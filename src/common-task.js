var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var Task = require('./process-definition.js').Task;
var ProcessEngine = require('./process-engine.js');
var ProcessInstance = require('./process-instance.js'),
    Instance = ProcessInstance.Instance,
    Node = ProcessInstance.Node;
var Promise = require("bluebird");
var debug = require('debug')('common-task');

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


module.exports = {
  ServiceTask: ServiceTask,
  Decision: Decision,
  ServiceNode: ServiceNode,
  DecisionNode: DecisionNode
};

