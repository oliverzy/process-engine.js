/**
* This file is used to test the lastest development feature
* For unit test, go for jasimine-node
*/
var util = require('util');
var processEngine = require('./').processEngine;
var ProcessDefinition = require('./').ProcessDefinition;
var ProcessInstance = require('./').ProcessInstance;
var processBuilder = require('./').processBuilder;

function createProcessDefinition() {
  var processDefinition = new ProcessDefinition();
  var startTask = processBuilder.startTask();
  processDefinition.addTask(startTask);
  var humanTask = processBuilder.humanTask();
  humanTask.name = 'humanTask';
  processDefinition.addTask(humanTask);
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
processInstance.on('before', function (task) {
  if (task.type === 'start-task')
    console.log("Well, start event is emitted!");
  else if (task.type === 'human-task')
    console.log("Human Task: " + task.id);
  else if (task.type === 'end-task')
    console.log("Goodbye, end event is emitted!");
});
processInstance.on('end', function () {
  console.log("Process is ended!", processInstance.nodePool);
  processEngine.loadProcessInstance(processInstance.id).done(function (instance) {
    console.log(util.inspect(instance, {depth: 5}));
  });
});
processInstance.start({
  score: 50
});

// Simulate Human Task Complete
setTimeout(function () {
  processEngine.completeTask(processInstance.id, processInstance.getNode('humanTask').task.id);
}, 500);

