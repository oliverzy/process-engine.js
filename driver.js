/**
* This file is used to test the lastest development feature
* For unit test, go for jasimine-node
*/
var util = require('util');
var processEngine = require('./').processEngine;
var ProcessDefinition = require('./').ProcessDefinition;
var ProcessInstance = require('./').ProcessInstance;
var processBuilder = require('./').processBuilder;

var humanTaskId;
function createProcessDefinition() {
  var processDefinition = new ProcessDefinition();
  var startTask = processBuilder.startTask();
  processDefinition.addTask(startTask);
  var humanTask = processBuilder.humanTask();
  humanTask.name = 'humanTask';
  humanTask.assignee = 'Oliver Zhou';
  processDefinition.addTask(humanTask);
  humanTaskId = humanTask.id;
  var serviceTask = processBuilder.serviceTask(function (variables, complete) {
    console.log('Oh, service task');
    complete();
  });
  processDefinition.addTask(serviceTask);

  var endTask = processBuilder.endTask();
  processDefinition.addTask(endTask);
  processDefinition.addFlow(startTask, serviceTask);
  processDefinition.addFlow(serviceTask, humanTask);
  processDefinition.addFlow(humanTask, endTask);

  return processDefinition;
}

var processInstance = processEngine.createProcessInstance(createProcessDefinition());
var processInstanceId = processInstance.id;
processInstance.start({score: 50});

// Simulate Human Task Complete
setTimeout(function () {
  processEngine.clearPool();
  processEngine.loadProcessInstance(processInstanceId).done(function (instance) {
    //console.log(util.inspect(instance, {depth: 5}));
    instance.on('end', function () {
      console.log('Loaded process instance is ended!');
    });
    processEngine.completeTask(processInstanceId, humanTaskId);
  });
}, 500);
