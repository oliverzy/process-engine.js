/**
* This file is used to test the lastest development feature
* For unit test, go for jasimine-node
*/
var ProcessDefinition = require('./process-engine.js').ProcessDefinition;
var ProcessInstance = require('./process-engine.js').ProcessInstance;
var processBuilder = require('./process-engine.js').processBuilder;

function createProcessDefinition() {
  var processDefinition = new ProcessDefinition();
  var startTask = processBuilder.startTask();
  processDefinition.addTask(startTask);

  var decision = processBuilder.decision();
  processDefinition.addTask(decision);

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

  var decisionMerge = processBuilder.decision();
  processDefinition.addTask(decisionMerge);

  var endTask = processBuilder.endTask();
  processDefinition.addTask(endTask);

  processDefinition.addFlow(startTask, decision);
  processDefinition.addFlow(decision, serviceTask1, function() {
    return false;
  });
  processDefinition.addFlow(decision, serviceTask2, function() {
    return true;
  });
  processDefinition.addFlow(serviceTask1, decisionMerge);
  processDefinition.addFlow(serviceTask2, decisionMerge);
  processDefinition.addFlow(decisionMerge, endTask);

  return processDefinition;
}

var processInstance = new ProcessInstance(createProcessDefinition());
processInstance.on('before', function (task) {
  if (task.type === 'start-task')
    console.log("Well, start event is emitted!");
  else if (task.type === 'service-task')
    console.log("Service Task: " + task.id);
  else if (task.type === 'end-task')
    console.log("Goodbye, end event is emitted!");
});
processInstance.on('end', function () {
  console.log("Process is ended!");
});
processInstance.start();

