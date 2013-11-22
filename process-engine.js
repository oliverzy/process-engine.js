var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
_.str = require('underscore.string');
_.mixin(_.str.exports());
var Datastore = require('nedb');
var Q = require('q');

/**
* [CORE] Task Definition: Represent a abstract task in the process definition
*/
function Task(type) {
  this.id = null;
  this.type = type;
  this.incomingFlows = [];
  this.outgoingFlows = [];
}

Task.prototype.serialize = function () {
  function handleFlow(flow) {
    return {
        from: flow.from.id,
        to: flow.to.id,
        condition: this.condition ? this.condition.toString() : null
      };
  }
  var entity = {
    id: this.id,
    type: this.type,
    incomingFlows: this.incomingFlows.map(function (flow) {
      return handleFlow(flow);
    }),
    outgoingFlows: this.outgoingFlows.map(function (flow) {
      return handleFlow(flow);
    })
  };
  return entity;
};

Task.prototype.deserialize = function (entity) {
  this.id = entity.id;
  this.type = entity.type;
};

/**
 * A factory method for deserialize the all kinds of Task
 * The subclass must provide a deserialize method in its prototype for extension
 * @param  {[TaskEntity]} entity
 * @return {[Task]}
 */
Task.deserialize = function (entity) {
  var task = processBuilder.createTask(entity.type);
  task.deserialize(entity);
  return task;
};

/**
 * Exclusive Gateway
 */
function Decision() {
  Decision.super_.apply(this, arguments);
  this.type = 'decision';
}
util.inherits(Decision, Task);

function ServiceTask(action) {
  ServiceTask.super_.apply(this, arguments);
  this.type = 'service-task';
  this.action = action;
}
util.inherits(ServiceTask, Task);

ServiceTask.prototype.serialize = function () {
  var entity = ServiceTask.super_.prototype.serialize.call(this);
  entity.action = this.action.toString();
  return entity;
};

ServiceTask.prototype.deserialize = function (entity) {
  ServiceTask.super_.prototype.deserialize.call(this, entity);
  eval('this.action = ' + entity.action);
};


/**
 * The factory class to create different kinds of tasks for the client
 */
function ProcessBuilder() {
  this.startTask = function () {
    return new Task('start-task');
  };
  this.endTask = function () {
    return new Task('end-task');
  };
}
ProcessBuilder.prototype.registerTask = function (type, Task) {
  this[_.camelize(type)] = function () {
    var task = new Task();
    Task.apply(task, arguments);
    return task;
  };
};
ProcessBuilder.prototype.createTask = function (type) {
  return this[_.camelize(type)]();
};
var processBuilder = new ProcessBuilder();


/**
 * [CORE] The definiton of the process which can be executed by process engine
 */
function ProcessDefinition() {
  this.tasks = {};
  this.nextTaskId = 0;
}

ProcessDefinition.prototype.addTask = function (task) {
  var id = task.id ? task.id : this.nextTaskId++;
  task.id = id;
  this.tasks[id] = task;
};
/**
 * create a flow
 * 
 * @param {[task]} taskFrom
 * @param {[task]} taskTo
 * @param {[function]} condition
 */
ProcessDefinition.prototype.addFlow = function (taskFrom, taskTo, condition) {
  var flow = {
    from: taskFrom,
    to: taskTo,
    condition: condition
  };
  taskTo.incomingFlows.push(flow);
  taskFrom.outgoingFlows.push(flow);
};

ProcessDefinition.prototype.serialize = function () {
  var entities = [];
  _.forOwn(this.tasks, function (task) {
    entities.push(task.serialize());
  }, this);
  return entities;
};

ProcessDefinition.deserialize = function (entity) {
  var def = new ProcessDefinition();
  entity.forEach(function (taskEntity) {
    def.addTask(Task.deserialize(taskEntity));
  });

  entity.forEach(function (taskEntity) {
    function deserializeFlow(flow) {
      var deserializedFlow = {
        from: def.tasks[flow.from],
        to: def.tasks[flow.to]
      };
      eval('deserializedFlow.condition = ' + flow.condition);
      return deserializedFlow;
    }

    def.tasks[taskEntity.id].incomingFlows = taskEntity.incomingFlows.map(function (flow) {
      return deserializeFlow(flow);
    });
    def.tasks[taskEntity.id].outgoingFlows = taskEntity.outgoingFlows.map(function (flow) {
      return deserializeFlow(flow);
    });
  });

  return def;
};

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
Node.prototype.complete = function () {
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
    }
  }.bind(this));

  if (this.task.type === 'end-task')
    this.processInstance.emit('end');
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
  // If Process instance status has been suspended, need to save again because it's possile that
  // an async service task is started before the instance is suspended
  if (this.processInstance.status === ProcessInstance.STATUS.WAITING)
    this.processInstance.savePoint().done();
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

ProcessEngine.prototype.completeTask = function (processId, taskId) {
  if (!this.processPool[processId]) {
    this.loadProcessInstance(processId).done(function (instance) {
      this.processPool[processId].nodePool[taskId].complete();
    }.bind(this));
  }
  else
    this.processPool[processId].nodePool[taskId].complete();
};

ProcessEngine.prototype.saveProcessInstance = function (entity) {
  if (entity._id)
    return Q.ninvoke(this.instanceCollection, 'update', {'_id': entity._id}, entity, {}).then(function () {
      return entity;
    });
  else
    return Q.ninvoke(this.instanceCollection, 'insert', entity);
};

ProcessEngine.prototype.loadProcessInstance = function (id) {
  return Q.ninvoke(this.instanceCollection, 'find', {id: id}).then(function (entities) {
    console.log('Load:', entities);
    if (entities.length === 0) return;
    var instance = ProcessInstance.deserialize(entities[0]);
    this.processPool[instance.id] = instance;
    return instance;
  }.bind(this));
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

ProcessInstance.prototype.start = function (variables) {
  this.status = ProcessInstance.STATUS.RUNNING;
  this.on('end', function () {
    this.status = ProcessInstance.STATUS.COMPLETED;
  });
  this.variables = variables;
  var node = new Node(this.def.tasks[0], this);
  node.execute();
};

ProcessInstance.prototype.changeStatus = function (status) {
  this.status = status;
  if (status === ProcessInstance.STATUS.WAITING)
    this.savePoint().done();
};

ProcessInstance.prototype.savePoint = function () {
  var entity = this.serialize();
  return processEngine.saveProcessInstance(entity).then(function (entity) {
    //console.log(util.inspect(entity, {depth: 5, colors: false}));
    return entity;
  });
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
    id: this.id,
    def: this.def.serialize(),
    status: this.status,
    nodePool: serializeNodePool(),
    variables: this.variables
  };
  return entity;
};

ProcessInstance.deserialize = function (entity) {
  var instance = new ProcessInstance();
  instance.id = entity.id;
  instance.def = ProcessDefinition.deserialize(entity.def);
  instance.status = entity.status;
  instance.variables = entity.variables;
  entity.nodePool.forEach(function (entity) {
    var node = Node.deserialize(entity, instance);
    instance.nodePool[node.task.id] = node;
  });
  return instance;
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
  Task: Task,
  Node: Node
};

