var _ = require('lodash');
var ProcessEngine = require('./src/process-engine.js');
var ProcessDefinition = require('./src/process-definition.js');
var Diagram = require('./src/diagram-model.js');
var CommonTask = require('./src/common-task.js');
var HumanTask = require('./src/human-task.js');
var ProcessInstance = require('./src/process-instance.js');

_.extend(ProcessEngine.prototype, ProcessInstance.API);
ProcessEngine.InstanceStatus = ProcessInstance.Instance.STATUS;
ProcessEngine.HumanTaskServiceStatus = HumanTask.Service.STATUS;
_.extend(ProcessEngine.prototype, ProcessDefinition.API);
_.extend(ProcessEngine.prototype, Diagram.API);


ProcessEngine.create = function (options_) {
  var options = options_ || {};
  
  var processEngine = new ProcessEngine(options);
  processEngine.processBuilder = ProcessDefinition.processBuilder;
  processEngine.registerTaskType('service-task', CommonTask.ServiceTask, CommonTask.ServiceNode);
  processEngine.registerTaskType('decision', CommonTask.Decision, CommonTask.DecisionNode);
  processEngine.registerTaskType('human-task', HumanTask.Task, HumanTask.Node);
  processEngine.humanTaskService = new HumanTask.Service(processEngine);

  return processEngine;
};

// console.log(ProcessEngine);
// console.log(ProcessEngine.prototype);
// console.log(ProcessEngine.create());

module.exports = ProcessEngine;