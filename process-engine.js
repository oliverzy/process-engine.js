var util = require('util');
var EventEmitter = require('events').EventEmitter;

/**
Built-in Tasks
*/
function BaseTask() {
  BaseTask.super_.apply(this, arguments);
  this.incomingFlows = [];
  this.outgoingFlows = [];
}
util.inherits(BaseTask, EventEmitter);
BaseTask.prototype.execute = function (complete) {
  complete();
};
function StartTask() {
  StartTask.super_.apply(this, arguments);
  this.type = "start-task";
}
util.inherits(StartTask, BaseTask);
function EndTask() {
  EndTask.super_.apply(this, arguments);
  this.type = "end-task";
}
util.inherits(EndTask, BaseTask);

function ServiceTask(action) {
  ServiceTask.super_.apply(this, arguments);
  this.type = "service-task";
  this.action = action;
}
util.inherits(ServiceTask, BaseTask);
ServiceTask.prototype.execute = function (complete) {
  this.action(complete);
};

// TODO: Handle Human Task
function HumanTask() {
  HumanTask.super_.apply(this, arguments);
}
util.inherits(HumanTask, BaseTask);
HumanTask.prototype.execute = function (complete) {
};

//TODO: Decision Node | Exclusive Gateway - Must be explicitly modelled as diamond symbol
//      Fork/Join | Parallel Gateway - Default Behavior

/**
Process Definition
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
  this.task.execute(this.complete.bind(this));
};
Node.prototype.complete = function () {
  this.processInstance.emit('after', this.task);
  if (this.task.type === 'end-task')
    this.processInstance.emit('end');
  this.task.outgoingFlows.forEach(function (flow) {
    var node;
    if (this.processInstance.nodePool[flow.to.id]) {
      node = this.processInstance.nodePool[flow.to.id];
    }
    else {
      node = new Node(flow.to, this.processInstance);
      this.processInstance.nodePool[flow.to.id] = node;
    }
    node.incomingFlowCompletedNumber++;
    //console.log('node: ' + node.task + ', incoming: ' + node.incomingFlowCompletedNumber);
    if (node.incomingFlowCompletedNumber === flow.to.incomingFlows.length) {
      node.execute();
    }
  }.bind(this));
};

function ProcessInstance(def) {
  ProcessInstance.super_.apply(this, arguments);
  this.def = def;
  // The active node instances (key: task id)
  this.nodePool = {};
}
util.inherits(ProcessInstance, EventEmitter);

ProcessInstance.prototype.start = function () {
  var node = new Node(this.def.tasks[0], this);
  node.execute();
};

function ProcessBuilder() {
  this.startTask = function () {
    return new StartTask();
  };
  this.endTask = function () {
    return new EndTask();
  };
  this.serviceTask = function (action) {
    return new ServiceTask(action);
  };
}

/**
 * CMD Export
 */
processBuilder = new ProcessBuilder();
module.exports = {
  ProcessInstance: ProcessInstance,
  ProcessDefinition: ProcessDefinition,
  processBuilder: processBuilder
};

/**
* Main Function
*/
function createProcessDefinition() {
  var processDefinition = new ProcessDefinition();
  var startTask = processBuilder.startTask();
  processDefinition.addTask(startTask);

  var serviceTask1 = processBuilder.serviceTask(function (complete) {
    console.log('Oh, service task1');
    complete();
  });
  processDefinition.addTask(serviceTask1);

  var serviceTask2 = processBuilder.serviceTask(function (complete) {
    console.log('Oh, service task2');
    complete();
  });
  processDefinition.addTask(serviceTask2);

  var endTask = processBuilder.endTask();
  processDefinition.addTask(endTask);
  processDefinition.addFlow(startTask, serviceTask1);
  processDefinition.addFlow(startTask, serviceTask2);
  processDefinition.addFlow(serviceTask1, endTask);
  processDefinition.addFlow(serviceTask2, endTask);

  return processDefinition;
}

var processInstance = new ProcessInstance(createProcessDefinition());
processInstance.on('before', function (task) {
  if (task.type === 'start-task')
    console.log("Well, start event is emitted!");
  else if (task instanceof ServiceTask)
    console.log("Service Task: " + task.id);
  else if (task.type === 'end-task')
    console.log("Goodbye, end event is emitted!");
});
processInstance.on('end', function () {
  console.log("Process is ended!");
});
processInstance.start();


