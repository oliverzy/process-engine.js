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
  this.id = "start";
}
util.inherits(StartTask, BaseTask);
function EndTask() {
  EndTask.super_.apply(this, arguments);
}
util.inherits(EndTask, BaseTask);

function ServiceTask() {
  ServiceTask.super_.apply(this, arguments);
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

//TODO: Decision Node | Exclusive Gateway/Fork/Join | Parallel Gateway

/**
Process Definition
*/
function ProcessDefinition() {
  this.tasks = {};
  this.nextTaskId = 0;
}

ProcessDefinition.prototype.addTask = function (task) {
  this.tasks[task.id ? task.id : this.nextTaskId++] = task;
};

ProcessDefinition.prototype.addFlow = function (taskFrom, taskTo) {
  taskTo.incomingFlows.push(taskFrom);
  taskFrom.outgoingFlows.push(taskTo);
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
  this.task.outgoingFlows.forEach(function (task) {
    var node = new Node(task, this.processInstance);
    node.incomingFlowCompletedNumber++;
    if (node.incomingFlowCompletedNumber === task.incomingFlows.length) {
      node.execute();
    }
  }.bind(this));
};

function ProcessInstance(def) {
  ProcessInstance.super_.apply(this, arguments);
  this.def = def;
}
util.inherits(ProcessInstance, EventEmitter);

ProcessInstance.prototype.start = function () {
  var node = new Node(this.def.tasks.start, this);
  node.execute();
};





/**
* Main Function
*/
function createSampleProcessDefinition() {
  var processDefinition = new ProcessDefinition();
  var startTask = new StartTask();
  processDefinition.addTask(startTask);
  var serviceTask = new ServiceTask();
  serviceTask.action = function (complete) {
    console.log('Oh, service task');
    complete();
  };
  processDefinition.addTask(serviceTask);
  var endTask = new EndTask();
  processDefinition.addTask(endTask);
  processDefinition.addFlow(startTask, serviceTask);
  processDefinition.addFlow(serviceTask, endTask);

  return processDefinition;
}

var processInstance = new ProcessInstance(createSampleProcessDefinition());
processInstance.on('before', function (task) {
  if (task instanceof StartTask)
    console.log("Well, start event is emitted!");
  else if (task instanceof EndTask)
    console.log("Goodbye, end event is emitted!");
});
processInstance.start();


