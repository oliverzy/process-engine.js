var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var processEngine = require('./process-engine.js').processEngine;
var ProcessInstance = require('./process-engine.js').ProcessInstance;
var Task = require('./process-definition.js').Task;
var Node = require('./process-engine.js').Node;
var Datastore = require('nedb');
var Q = require('q');
var debug = require('debug')('human-task');

/**
 * Human Task needs to be managed in a separate collection so that in any time
 * we can query/change task state without loading/saving process instances
 * until the task status is changed to complete
 */
var humanTaskCollection = new Datastore();

function HumanTask() {
  HumanTask.super_.apply(this, arguments);
  this.type = 'human-task';
  this.assignee = null;
  this.candidateUsers = [];
  this.candidateGroups = [];
}
util.inherits(HumanTask, Task);

HumanTask.prototype.serialize = function () {
  var entity = HumanTask.super_.prototype.serialize.call(this);
  entity.assignee = this.assignee;
  entity.candidateUsers = this.candidateUsers;
  entity.candidateGroups = this.candidateGroups;
  entity.taskEntityId = this.entityId;
  return entity;
};

HumanTask.prototype.deserialize = function (entity) {
  HumanTask.super_.prototype.deserialize.call(this, entity);
  this.assignee = entity.assignee;
  this.candidateUsers = entity.candidateUsers;
  this.candidateGroups = entity.candidateGroups;
  this.entityId = entity.taskEntityId;
};

function HumanTaskNode() {
  HumanTaskNode.super_.apply(this, arguments);
}
util.inherits(HumanTaskNode, Node);

HumanTaskNode.prototype.executeInternal = function (complete) {
  var taskDef = {processId: this.processInstance.id};
  _.extend(taskDef, this.task);
  humanTaskService.newTask(taskDef).done(function (entity) {
    this.entityId = entity._id;
    // Put it in the waiting status
    this.processInstance.changeStatus(ProcessInstance.STATUS.WAITING);
  }.bind(this));
};

function HumanTaskService() {
}

HumanTaskService.STATUS = {
  NEW: 'New',
  // only has single candidate || one of candidates claims the task
  RESERVED: 'Reserved',
  // the assignee starts to work on the task
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed'
};
HumanTaskService.prototype.complete = function (taskId) {
  return this.queryOne({'_id': taskId}).then(function (task) {
    if (!task) throw new Error('No task is found!');
    task.status = HumanTaskService.STATUS.COMPLETED;
    return this.saveTask(task).then(function () {
      if (task.processId !== undefined)
        processEngine.completeTask(task.processId, task.taskDefId);
    });
  }.bind(this));
};

HumanTaskService.prototype.newTask = function (taskDef) {
  var task = {
    name: taskDef.name,
    status: taskDef.assignee ? HumanTaskService.STATUS.RESERVED: HumanTaskService.STATUS.NEW,
    assignee: taskDef.assignee,
    candidateUsers: taskDef.candidateUsers,
    candidateGroups: taskDef.candidateGroups,
    processId: taskDef.processId,
    taskDefId: taskDef.id
  };
  
  return Q.ninvoke(humanTaskCollection, 'insert', task);
};

HumanTaskService.prototype.saveTask = function (task) {
  return Q.ninvoke(humanTaskCollection, 'update', {'_id': task._id}, task, {});
};

HumanTaskService.prototype.claim = function (taskId, user) {
  return Q.ninvoke(humanTaskCollection, 'findOne', {'_id': taskId})
  .then(function (task) {
    if (task) {
      if (task.assignee === user) return;
      if (task.candidateUsers.indexOf(user) === -1) throw new Error('cannot claim task because user is not the candidate');
      task.assignee = user;
      task.status = HumanTaskService.STATUS.IN_PROGRESS;
      return this.saveTask(task);
    }
  }.bind(this));
};

HumanTaskService.prototype.startWorking = function (taskId) {
  return this.queryOne({'_id': taskId}).then(function (task) {
    if (!task) throw new Error('No task is found!');
    task.status = HumanTaskService.STATUS.IN_PROGRESS;
    return this.saveTask(task);
  }.bind(this));
};

HumanTaskService.prototype.query = function (conditions) {
  return Q.ninvoke(humanTaskCollection, 'find', conditions);
};

HumanTaskService.prototype.queryOne = function (conditions) {
  return Q.ninvoke(humanTaskCollection, 'findOne', conditions);
};
var humanTaskService = new HumanTaskService();


processEngine.registerTaskType('human-task', HumanTask, HumanTaskNode);

module.exports = {
  humanTaskService: humanTaskService,
  status: HumanTaskService.STATUS
};

