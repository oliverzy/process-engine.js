var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
_.str = require('underscore.string');
_.mixin(_.str.exports());
var Datastore = require('nedb');

/**
Process Definition
*/
function Task(type) {
  this.type = type;
  this.incomingFlows = [];
  this.outgoingFlows = [];
}

function Decision() {
  Decision.super_.apply(this, arguments);
  this.type = 'decision';
}
util.inherits(Decision, Task);

function ProcessBuilder() {
  this.startTask = function () {
    return new Task('start-task');
  };
  this.endTask = function () {
    return new Task('end-task');
  };
  this.serviceTask = function (action) {
    var task  = new Task('service-task');
    task.action = action;
    return task;
  };
  this.decision = function () {
    return new Decision();
  };
}
ProcessBuilder.prototype.registerTask = function (type, Task) {
  this[_.camelize(type)] = function () {
    return new Task();
  };
};
var processBuilder = new ProcessBuilder();


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

/**
Runtime Graph Structure
*/
function Node(task, processInstance) {
  Node.super_.apply(this, arguments);
  this.task = task;
  this.processInstance = processInstance;
  this.incomingFlowCompletedNumber = 0;
}
util.inherits(Node, EventEmitter);
Node.prototype.execute = function () {
  this.processInstance.emit('before', this.task);
  this.executeInternal(this.complete.bind(this));
};
Node.prototype.executeInternal = function (complete) {
  complete();
};
Node.prototype.complete = function () {
  this.processInstance.emit('after', this.task);
  delete this.processInstance.nodePool[this.task.id];

  // Follow outgoing flows
  this.task.outgoingFlows.forEach(function (flow) {
    if (this.task.type == 'decision') {
      // Evaluate condition if it has multiple outgoing flows, and skip execution for false condition
      if (this.task.outgoingFlows.length > 1 && !flow.condition(this.processInstance.variables))
        return;
    }

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
    if (node.task.type == 'decision') { // This means one of condition is satisfied
      node.execute();
    }
    else if (node.incomingFlowCompletedNumber === flow.to.incomingFlows.length) {
      node.execute();
    }
  }.bind(this));

  if (this.task.type === 'end-task')
    this.processInstance.emit('end');
};

function ServiceNode() {
  ServiceNode.super_.apply(this, arguments);
}
util.inherits(ServiceNode, Node);
ServiceNode.prototype.executeInternal = function (complete) {
  this.task.action(this.processInstance.variables, complete);
};


function ProcessEngine() {
  this.nextProcessId = 0;
  this.taskTypes = {
    'service-task': [Task, ServiceNode]
  };
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
  this.processPool[processId].nodePool[taskId].complete();
};
var processEngine = new ProcessEngine();


function ProcessInstance(def) {
  ProcessInstance.super_.apply(this, arguments);
  this.def = def;
  // The active node instances (key: task id)
  this.nodePool = {};
  this.status = ProcessInstance.STATUS.NEW;
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

