var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var processEngine = require('./process-engine.js').processEngine;
var ProcessInstance = require('./process-engine.js').ProcessInstance;
var Task = require('./process-engine.js').Task;
var Node = require('./process-engine.js').Node;

function HumanTask() {
  HumanTask.super_.apply(this, arguments);
  this.type = 'human-task';
}
util.inherits(HumanTask, Task);

function HumanTaskNode() {
  HumanTaskNode.super_.apply(this, arguments);
}
util.inherits(HumanTaskNode, Node);
HumanTaskNode.prototype.executeInternal = function (complete) {
  // Put it in the waiting status
  this.processInstance.status = ProcessInstance.STATUS.WAITING;
};

processEngine.registerTaskType('human-task', HumanTask, HumanTaskNode);

