var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var processEngine = require('./process-engine.js').processEngine;
var ProcessInstance = require('./process-engine.js').ProcessInstance;
var Task = require('./process-engine.js').Task;
var Node = require('./process-engine.js').Node;
var Datastore = require('nedb');

var humanTaskCollection = new Datastore();

function HumanTask() {
  HumanTask.super_.apply(this, arguments);
  this.type = 'human-task';
  this.assignee = null;
  this.candidateUsers = [];
  this.candidateGroups = [];
}
util.inherits(HumanTask, Task);

function HumanTaskNode() {
  HumanTaskNode.super_.apply(this, arguments);
}
util.inherits(HumanTaskNode, Node);
HumanTaskNode.prototype.executeInternal = function (complete) {
  // Put it in the waiting status
  this.processInstance.changeStatus(ProcessInstance.STATUS.WAITING);
};

function HumanTaskService() {
}

HumanTaskService.prototype.complete = function (processId, taskId) {
  processEngine.completeTask(processId, taskId);
};
HumanTaskService.prototype.newTask = function () {
};
HumanTaskService.prototype.saveTask = function () {
};
HumanTaskService.prototype.claim = function () {
};
HumanTaskService.prototype.setAssignee = function (assignee) {
};
HumanTaskService.prototype.query = function (conditions) {
};

processEngine.registerTaskType('human-task', HumanTask, HumanTaskNode);

