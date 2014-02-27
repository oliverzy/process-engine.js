var Datastore = require('nedb');
var Promise = require("bluebird");

/**
 * [CORE] The entry point to access this library core features
 */
function ProcessEngine(options) {
  // TODO: this one should be fetched from database
  this.nextProcessId = 0;
  this.taskTypes = {};
  this.processPool = {};
  this.definitionCollection = options.definitionCollection || new Datastore();
  Promise.promisifyAll(this.definitionCollection);
  this.instanceCollection = options.instanceCollection || new Datastore();
  Promise.promisifyAll(this.instanceCollection);
  this.humanTaskCollection = options.humanTaskCollection || new Datastore();
  Promise.promisifyAll(this.humanTaskCollection);
}

ProcessEngine.prototype.registerTaskType = function (type, Task, Node) {
  this.taskTypes[type] = [Task, Node];
  this.processBuilder.registerTask(type, Task);
};

module.exports = ProcessEngine;