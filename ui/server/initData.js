var humanTaskService = require('process-engine').humanTaskService;
var ProcessDefinition = require('process-engine').ProcessDefinition;
var processBuilder = require('process-engine').processBuilder;

(function () {
  var processDefinition = new ProcessDefinition('simple process');
  processDefinition.category = 'Basic';
  var startTask = processBuilder.startTask();
  processDefinition.addTask(startTask);
  var serviceTask = processBuilder.serviceTask(function (variables, complete) {
    console.log('Oh, service task');
    complete();
  });
  processDefinition.addTask(serviceTask);
  var endTask = processBuilder.endTask();
  processDefinition.addTask(endTask);
  processDefinition.addFlow(startTask, serviceTask);
  processDefinition.addFlow(serviceTask, endTask);

  processDefinition.save().done();
})();

(function () {
  var processDefinition = new ProcessDefinition('simple parallel process');
  processDefinition.category = 'Basic';
  var startTask = processBuilder.startTask();
  processDefinition.addTask(startTask);

  var serviceTask1 = processBuilder.serviceTask(function (variables, complete) {
    console.log('Oh, service task1');
    complete();
  });
  processDefinition.addTask(serviceTask1);

  var serviceTask2 = processBuilder.serviceTask(function (variables, complete) {
    console.log('Oh, service task2');
    complete();
  });
  processDefinition.addTask(serviceTask2);

  var endTask = processBuilder.endTask();
  processDefinition.addTask(endTask);
  processDefinition.addFlow(startTask, serviceTask1);
  processDefinition.addFlow(startTask, serviceTask2);
  processDefinition.addFlow(serviceTask1, endTask);
  processDefinition.addFlow(serviceTask2, endTask);

  processDefinition.save().done();
})();


(function () {
  var processDefinition = new ProcessDefinition('simple exclusive gateway process');
  processDefinition.category = 'Basic';
  var startTask = processBuilder.startTask();
  processDefinition.addTask(startTask);

  var decision = processBuilder.decision();
  processDefinition.addTask(decision);

  var serviceTask1 = processBuilder.serviceTask(function (variables, complete) {
    console.log('Oh, service task10', variables);
    complete();
  });
  processDefinition.addTask(serviceTask1);

  var serviceTask2 = processBuilder.serviceTask(function (variables, complete) {
    console.log('Oh, service task20', variables);
    complete();
  });
  processDefinition.addTask(serviceTask2);

  var decisionMerge = processBuilder.decision();
  decisionMerge.name = 'merge';
  processDefinition.addTask(decisionMerge);

  var endTask = processBuilder.endTask();
  processDefinition.addTask(endTask);

  processDefinition.addFlow(startTask, decision);
  processDefinition.addFlow(decision, serviceTask1, function(variables) {
    return variables.score < 10;
  });
  processDefinition.addFlow(decision, serviceTask2, function(variables) {
    return variables.score >= 10;
  });
  processDefinition.addFlow(serviceTask1, decisionMerge);
  processDefinition.addFlow(serviceTask2, decisionMerge);
  processDefinition.addFlow(decisionMerge, endTask);

  processDefinition.variables = {score: 50};

  processDefinition.save().done();
})();

(function () {
  var processDefinition = new ProcessDefinition('exclusive gateway + parrallel gateway process');
  processDefinition.category = 'Basic';
  var startTask = processBuilder.startTask();
  processDefinition.addTask(startTask);

  var parallelTask = processBuilder.serviceTask(function (variables, complete) {
    console.log('Oh, Parallel Task is called');
    complete();
  });
  parallelTask.name = 'parallelTask';
  processDefinition.addTask(parallelTask);

  var decision = processBuilder.decision();
  processDefinition.addTask(decision);

  var serviceTask1 = processBuilder.serviceTask(function (variables, complete) {
    console.log('Oh, service task1', variables);
    complete();
  });
  serviceTask1.name = 'serviceTask1';
  processDefinition.addTask(serviceTask1);

  var serviceTask2 = processBuilder.serviceTask(function (variables, complete) {
    console.log('Oh, service task2', variables);
    complete();
  });
  serviceTask2.name = 'serviceTask2';
  processDefinition.addTask(serviceTask2);

  var decisionMerge = processBuilder.decision();
  processDefinition.addTask(decisionMerge);

  var endTask = processBuilder.endTask();
  processDefinition.addTask(endTask);

  processDefinition.addFlow(startTask, parallelTask);
  processDefinition.addFlow(parallelTask, endTask);
  processDefinition.addFlow(startTask, decision);
  processDefinition.addFlow(decision, serviceTask1, function(variables) {
    return variables.score < 10;
  });
  processDefinition.addFlow(decision, serviceTask2, function(variables) {
    return variables.score >= 10;
  });
  processDefinition.addFlow(serviceTask1, decisionMerge);
  processDefinition.addFlow(serviceTask2, decisionMerge);
  processDefinition.addFlow(decisionMerge, endTask);

  processDefinition.variables = {score: 50};

  processDefinition.save().done();
})();

(function () {
  var processDefinition = new ProcessDefinition('simple human process');
  processDefinition.category = 'Basic';
  var startTask = processBuilder.startTask();
  processDefinition.addTask(startTask);
  var humanTask = processBuilder.humanTask();
  humanTask.name = 'humanTask';
  humanTask.assignee = 'Oliver Zhou';
  processDefinition.addTask(humanTask);
  var serviceTask = processBuilder.serviceTask(function (variables, complete) {
    console.log('Oh, service task before human task');
    complete();
  });
  processDefinition.addTask(serviceTask);

  var endTask = processBuilder.endTask();
  processDefinition.addTask(endTask);
  processDefinition.addFlow(startTask, serviceTask);
  processDefinition.addFlow(serviceTask, humanTask);
  processDefinition.addFlow(humanTask, endTask);

  processDefinition.save().done();
})();

(function () {
  var processDefinition = new ProcessDefinition('human process with cycle');
  processDefinition.category = 'Basic';
  var startTask = processBuilder.startTask();
  processDefinition.addTask(startTask);
  var serviceTask = processBuilder.serviceTask(function (variables, complete) {
    console.log('Oh, service task before human task');
    complete();
  });
  processDefinition.addTask(serviceTask);
  var humanTask = processBuilder.humanTask();
  humanTask.name = 'humanTask';
  humanTask.assignee = 'Oliver Zhou';
  processDefinition.addTask(humanTask);

  var decisionRepeat = processBuilder.decision();
  processDefinition.addTask(decisionRepeat);

  var decision = processBuilder.decision();
  processDefinition.addTask(decision);

  var endTask = processBuilder.endTask();
  processDefinition.addTask(endTask);
  processDefinition.addFlow(startTask, serviceTask);
  processDefinition.addFlow(serviceTask, decisionRepeat);
  processDefinition.addFlow(decisionRepeat, humanTask);
  processDefinition.addFlow(humanTask, decision);

  processDefinition.addFlow(decision, endTask, function(variables) {
    return variables.score < 10;
  });
  processDefinition.addFlow(decision, decisionRepeat, function(variables) {
    return variables.score >= 10;
  });

  processDefinition.variables = {score: 50};
  processDefinition.save().done();
})();


(function () {
  var processDefinition = new ProcessDefinition('Quick Quote');
  processDefinition.category = 'Insurance';
  // Tasks
  var startTask = processBuilder.startTask();
  processDefinition.addTask(startTask);

  var decisionRepeat = processBuilder.decision();
  decisionRepeat.name = 'Repeat';
  processDefinition.addTask(decisionRepeat);

  var basicInfo = processBuilder.humanTask();
  basicInfo.name = 'Basic Info';
  basicInfo.assignee = 'Oliver Zhou';
  processDefinition.addTask(basicInfo);

  var serviceTask = processBuilder.serviceTask(function (variables, complete) {
    variables.autoUnderwritingResult = variables.age < 60;
    console.log('Auto underwriting service task result:', variables.autoUnderwritingResult);
    complete();
  });
  serviceTask.name = 'Auto UW';
  processDefinition.addTask(serviceTask);

  var decisionAutoUnderwriting = processBuilder.decision();
  decisionAutoUnderwriting.name = 'Passed?';
  processDefinition.addTask(decisionAutoUnderwriting);

  var manualUnderwriting = processBuilder.humanTask();
  manualUnderwriting.name = 'Manual UW';
  manualUnderwriting.assignee = 'Gary Chang';
  processDefinition.addTask(manualUnderwriting);

  var decisionManualUnderwriting = processBuilder.decision();
  decisionManualUnderwriting.name = 'Passed?';
  processDefinition.addTask(decisionManualUnderwriting);

  var decisionMerge = processBuilder.decision();
  decisionMerge.name = 'Merge';
  processDefinition.addTask(decisionMerge);

  var viewResult = processBuilder.humanTask();
  viewResult.name = 'View Result';
  viewResult.assignee = 'Oliver Zhou';
  processDefinition.addTask(viewResult);

  var decisionPurchase = processBuilder.decision();
  decisionPurchase.name = 'Purchase';
  processDefinition.addTask(decisionPurchase);

  var endPurchaseTask = processBuilder.endTask();
  processDefinition.addTask(endPurchaseTask);

  var endNotPurchaseTask = processBuilder.endTask();
  processDefinition.addTask(endNotPurchaseTask);

  // Flows
  processDefinition.addFlow(startTask, decisionRepeat);
  processDefinition.addFlow(decisionRepeat, basicInfo);
  processDefinition.addFlow(basicInfo, serviceTask);
  processDefinition.addFlow(serviceTask, decisionAutoUnderwriting);
  processDefinition.addFlow(decisionAutoUnderwriting, manualUnderwriting, function (variables) {
    console.log(variables);
    return !variables.autoUnderwritingResult;
  });
  processDefinition.addFlow(manualUnderwriting, decisionManualUnderwriting);
  processDefinition.addFlow(decisionManualUnderwriting, decisionRepeat, function (variables) {
    console.log(variables);
    return !variables.manualUnderwritingResult;
  });

  processDefinition.addFlow(decisionAutoUnderwriting, decisionMerge, function (variables) {
    console.log(variables);
    return variables.autoUnderwritingResult;
  });
  processDefinition.addFlow(decisionManualUnderwriting, decisionMerge, function (variables) {
    console.log(variables);
    return variables.manualUnderwritingResult;
  });
  processDefinition.addFlow(decisionMerge, viewResult);
  processDefinition.addFlow(viewResult, decisionPurchase);
  processDefinition.addFlow(decisionPurchase, endPurchaseTask, function (variables) {
    return variables.confirmPurchase;
  });
  processDefinition.addFlow(decisionPurchase, endNotPurchaseTask, function (variables) {
    return !variables.confirmPurchase;
  });

  processDefinition.variables = {name: 'Oliver Zhou', manualUnderwritingResult: undefined, confirmPurchase: undefined};
  
  processDefinition.save().done();
})();


