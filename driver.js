/**
* This file is used to test the lastest development feature
* For unit test, go for jasimine-node
*/
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

  var endTask = processBuilder.endTask();
  processDefinition.addTask(endTask);
  processDefinition.addFlow(startTask, humanTask);
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
  console.log("Process is ended!");
});
processInstance.start({
  score: 50
});

// Simulate Human Task Complete
setTimeout(function () {
  processEngine.completeTask(processInstance.id, processInstance.getNode('humanTask').task.id);
}, 500);

