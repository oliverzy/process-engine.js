var util = require('util');
var EventEmitter = require('events').EventEmitter;

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
  if (this.task.type === 'end-task')
    this.processInstance.emit('end');
  // Follow outgoing flows
  this.task.outgoingFlows.forEach(function (flow) {
    if (this.task.type == 'decision') {
      // Evaluate condition if it has multiple outgoing flows, and skip execution for false condition
      if (this.task.outgoingFlows.length > 1 && !flow.condition())
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
};

function ServiceNode() {
  ServiceNode.super_.apply(this, arguments);
}
util.inherits(ServiceNode, Node);
ServiceNode.prototype.executeInternal = function (complete) {
  this.task.action(complete);
};

function ProcessInstance(def) {
  ProcessInstance.super_.apply(this, arguments);
  this.def = def;
  // The active node instances (key: task id)
  this.nodePool = {};
}
util.inherits(ProcessInstance, EventEmitter);
ProcessInstance.prototype.createNode = function (task) {
  var node;
  switch (task.type) {
  case 'service-task':
    node = new ServiceNode(task, this);
    break;
  default:
    node = new Node(task, this);
    break;
  }
  return node;
};
ProcessInstance.prototype.start = function () {
  var node = new Node(this.def.tasks[0], this);
  node.execute();
};

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

/**
 * CMD Export
 */
module.exports = {
  ProcessInstance: ProcessInstance,
  ProcessDefinition: ProcessDefinition,
  processBuilder: new ProcessBuilder()
};

