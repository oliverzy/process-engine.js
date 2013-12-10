var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
_.str = require('underscore.string');
_.mixin(_.str.exports());
var Datastore = require('nedb');
var Promise = require("bluebird");
var debug = require('debug')('process-engine');

var ProcessDefinition = require('./process-definition.js').ProcessDefinition;
var processBuilder = require('./process-definition.js').processBuilder;
var Task = require('./process-definition.js').Task;
var ServiceTask = require('./process-definition.js').ServiceTask;
var Decision = require('./process-definition.js').Decision;

/**
 * [CORE] The graph structure to hold the runtime process execution state
 * @param {[Task]} task
 * @param {[ProcessInstance]} processInstance
 */
function Node(task, processInstance) {
  Node.super_.apply(this, arguments);
  this.task = task;
  this.processInstance = processInstance;
  this.incomingFlowCompletedNumber = 0;
}
util.inherits(Node, EventEmitter);

/**
 * The method is called when this node is ready to execute
 */
Node.prototype.execute = function () {
  this.processInstance.emit('before', this.task);
  this.executeInternal(this.complete.bind(this));
};

/**
 * The subclass needs to override this method
 * @param  {[function]} complete
 */
Node.prototype.executeInternal = function (complete) {
  complete();
};

/**
 * called before transition
 * @return {[Boolean]} whether we are allowed to follow outgoing flows
 */
Node.prototype.canFollowOutgoingFlow = function (flow) {
  return true;
};

/**
 * called before execution of the node
 * @param  {[Node]} node
 * @return {[Boolean]}
 */
Node.prototype.canExecuteNode = function () {
  return this.incomingFlowCompletedNumber === this.task.incomingFlows.length;
};

/**
 * The method is called when the node execution is done
 */
Node.prototype.complete = function (variables) {
  if (variables)
    this.processInstance.variables = _.clone(variables, true);
  this.processInstance.emit('after', this.task);
  delete this.processInstance.nodePool[this.task.id];

  // Follow outgoing flows
  this.task.outgoingFlows.forEach(function (flow) {
    if (!this.canFollowOutgoingFlow(flow))
      return;

    var node;
    if (this.processInstance.nodePool[flow.to.id]) {
      node = this.processInstance.nodePool[flow.to.id];
    }
    else {
      node = this.processInstance.createNode(flow.to);
      this.processInstance.nodePool[flow.to.id] = node;
    }
    node.incomingFlowCompletedNumber++;

    // Need to decide whether to execute next node
    if (node.canExecuteNode()) {
      node.execute();
    } else {
      // If Process instance status has been suspended, need to save again because it's possile that
      // an async service task is started before the instance is suspended
      if (this.processInstance.status === ProcessInstance.STATUS.WAITING)
        this.processInstance.save().done();
    }
  }.bind(this));

  if (this.task.type === 'end-task') {
    this.processInstance.changeStatus(ProcessInstance.STATUS.COMPLETED).done(function () {
      this.processInstance.emit('end');
    }.bind(this));
  }
};

Node.prototype.serialize = function () {
  var entity = {
    processInstance: this.processInstance.id,
    incomingFlowCompletedNumber: this.incomingFlowCompletedNumber,
    task: this.task.id
  };
  return entity;
};

Node.prototype.deserialize = function (entity) {
};

/**
 * The factory method to deserialize node
 * @param  {[Entity]} entity
 * @param  {[ProcessInstance]} instance
 * @return {[Node]}
 */
Node.deserialize = function (entity, instance) {
  var task = instance.def.tasks[entity.task];
  var node = instance.createNode(task);
  node.processInstance = instance;
  node.task = task;
  node.deserialize();
  return node;
};

function ServiceNode() {
  ServiceNode.super_.apply(this, arguments);
}
util.inherits(ServiceNode, Node);

ServiceNode.prototype.executeInternal = function (complete) {
  this.task.action(this.processInstance.variables, complete);
};

ServiceNode.prototype.canFollowOutgoingFlow = function (flow) {
  return ServiceNode.super_.prototype.canFollowOutgoingFlow.call(this, flow);
};

function DecisionNode() {
  DecisionNode.super_.apply(this, arguments);
}
util.inherits(DecisionNode, Node);

DecisionNode.prototype.canFollowOutgoingFlow = function (flow) {
  if (this.task.outgoingFlows.length > 1 && !flow.condition(this.processInstance.variables))
    return false;
  else
    return true;
};

DecisionNode.prototype.canExecuteNode = function (nextNode) {
  return true;
};


/**
 * [CORE] The entry point to access this library core features
 */
function ProcessEngine() {
  // TODO: this one should be fetched from database
  this.nextProcessId = 0;
  this.taskTypes = {};
  this.processPool = {};
  this.instanceCollection = new Datastore();
  Promise.promisifyAll(this.instanceCollection);
}

ProcessEngine.prototype.registerTaskType = function (type, Task, Node) {
  this.taskTypes[type] = [Task, Node];
  processBuilder.registerTask(type, Task);
};

ProcessEngine.prototype.createProcessInstance = function (def) {
  var processInstance = new ProcessInstance(def);
  processInstance.id = this.nextProcessId++;
  this.processPool[processInstance.id] = processInstance;
  return processInstance;
};

ProcessEngine.prototype.completeTask = function (processId, taskId, variables) {
  debug('Complete', processId, taskId);
  if (!this.processPool[processId]) {
    return this.loadProcessInstance(processId).done(function (instance) {
      this.processPool[processId].nodePool[taskId].complete(variables);
    }.bind(this));
  }
  else
    return Promise.resolve(this.processPool[processId].nodePool[taskId].complete(variables));
};

ProcessEngine.prototype.loadProcessInstance = function (id) {
  if (this.processPool[id])
    return Promise.resolve(this.processPool[id]);
  debug('loading instance: %s', id);
  return this.instanceCollection.findOneAsync({id: id}).then(function (entity) {
    debug('Load:', entity);
    if (!entity) return;
    return ProcessInstance.deserialize(entity).then(function(instance) {
      this.processPool[instance.id] = instance;
      return instance;
    }.bind(this));
  }.bind(this));
};

ProcessEngine.prototype.queryProcessInstances = function (conditions) {
  return this.instanceCollection.findAsync(conditions);
};

ProcessEngine.prototype.clearPool = function () {
  _.forOwn(this.processPool, function (instance, key) {
    if (instance.status === ProcessInstance.STATUS.WAITING || instance.status === ProcessInstance.STATUS.COMPLETED)
      delete this.processPool[key];
  }.bind(this));
};
var processEngine = new ProcessEngine();


/**
 * [CORE] A execution of a particular process definition
 */
function ProcessInstance(def) {
  ProcessInstance.super_.apply(this, arguments);
  this.id = null;
  this.def = def;
  // The active node instances (key: task id)
  this.nodePool = {};
  this.status = ProcessInstance.STATUS.NEW;
  this.variables = {};
}
util.inherits(ProcessInstance, EventEmitter);

ProcessInstance.STATUS = {NEW: 'New', RUNNING: 'Running', WAITING: 'Waiting', COMPLETED: 'Completed', FAILED: 'Failed'};

ProcessInstance.prototype.createNode = function (task) {
  var taskType = processEngine.taskTypes[task.type];
  if (!taskType)
    node = new Node(task, this);
  else
    node = new taskType[1](task, this);
  return node;
};

ProcessInstance.prototype.getNode = function (taskName) {
  for (var key in this.nodePool) {
    if (this.nodePool[key].task.name === taskName)
      return this.nodePool[key];
  }
};

ProcessInstance.prototype._start = function (variables) {
  this.variables = variables;
  return this.changeStatus(ProcessInstance.STATUS.RUNNING).done(function () {
    var node = new Node(this.def.tasks[0], this);
    node.execute();
  }.bind(this));
};

/**
 * Start the process instance with variables
 * If the process definition is not saved, just save it right now
 * @param  {[type]} variables [description]
 * @return {[type]}           [description]
 */
ProcessInstance.prototype.start = function (variables) {
  if (!this.def._id)
    this.def.save().done(function(def) {
      this.def._id = def._id;
      this._start(variables);
    }.bind(this));
  else
    this._start(variables);
};

/**
 * @return {Promise}
 */
ProcessInstance.prototype.changeStatus = function (status) {
  this.status = status;
  return this.save();
};

ProcessInstance.prototype.save = function () {
  var entity = this.serialize();
  if (entity._id)
    return processEngine.instanceCollection.updateAsync({'_id': entity._id}, entity, {}).then(function () {
      return entity;
    });
  else
    return processEngine.instanceCollection.insertAsync(entity).then(function (entity) {
      this._id = entity._id;
      return this;
    }.bind(this));
};

ProcessInstance.prototype.serialize = function () {
  var serializeNodePool = function() {
    var serializedNodes = [];
    _.forOwn(this.nodePool, function (node) {
      serializedNodes.push(node.serialize());
    }, this);
    return serializedNodes;
  }.bind(this);

  var entity = {
    _id: this._id,
    id: this.id,
    def: this.def._id,
    status: this.status,
    nodePool: serializeNodePool(),
    variables: this.variables
  };
  return entity;
};

/**
 * @return {[Promise]}
 */
ProcessInstance.deserialize = function (entity) {
  return ProcessDefinition.load(entity.def).then(function (def) {
    var instance = new ProcessInstance();
    instance.id = entity.id;
    instance.def = def;
    instance.status = entity.status;
    instance.variables = entity.variables;
    entity.nodePool.forEach(function (entity) {
      var node = Node.deserialize(entity, instance);
      instance.nodePool[node.task.id] = node;
    });

    return instance;
  });
};


processEngine.registerTaskType('service-task', ServiceTask, ServiceNode);
processEngine.registerTaskType('decision', Decision, DecisionNode);

/**
 * CMD Export
 */
module.exports = {
  processEngine: processEngine,
  ProcessInstance: ProcessInstance,
  ProcessDefinition: ProcessDefinition,
  processBuilder: processBuilder,
  Node: Node
};

