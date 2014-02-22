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
  
  processDefinition.layout = '{"cells":[{"type":"basic.Circle","size":{"width":30,"height":30},"id":"d20b5cde-08a5-4924-9a7f-9ea2233654c1","z":0,"position":{"x":15,"y":80},"attrs":{"circle":{"fill":"red"}}},{"type":"basic.Decision","size":{"width":70,"height":40},"id":"5263db73-adc8-41a4-be54-4e058be66caa","z":1,"position":{"x":115,"y":80},"attrs":{"text":{"text":"Repeat"}}},{"type":"basic.Rect","size":{"width":100,"height":30},"id":"fa7d020c-4653-4bd5-85aa-b6c9111d8d7a","z":2,"position":{"x":220,"y":85},"attrs":{"rect":{"fill":"grey"},"text":{"text":"Basic Info","fill":"white"}}},{"type":"basic.Rect","size":{"width":100,"height":30},"id":"b39147c4-4db7-4671-bef1-b92fd380c795","z":3,"position":{"x":365,"y":85},"attrs":{"rect":{"fill":"blue"},"text":{"text":"Auto UW","fill":"white"}}},{"type":"basic.Decision","size":{"width":70,"height":40},"id":"4d3e55b7-068c-40b1-9cad-d2cca469c13e","z":4,"position":{"x":505,"y":80},"attrs":{"text":{"text":"Passed?"}}},{"type":"basic.Rect","size":{"width":100,"height":30},"id":"c82b8e1d-5aae-401d-9ee9-e7faa41e44ca","z":5,"position":{"x":365,"y":145},"attrs":{"rect":{"fill":"grey"},"text":{"text":"Manual UW","fill":"white"}}},{"type":"basic.Decision","size":{"width":70,"height":40},"id":"cbd5466b-6841-40f8-a102-90d43fd05912","z":6,"position":{"x":380,"y":235},"attrs":{"text":{"text":"Passed?"}}},{"type":"basic.Decision","size":{"width":70,"height":40},"id":"312f74ce-e786-4e31-968c-7283238e90d0","z":7,"position":{"x":625,"y":80},"attrs":{"text":{"text":"Merge"}}},{"type":"basic.Rect","size":{"width":100,"height":30},"id":"37f5c598-66f6-4e10-9ecd-e1d19dd9c16c","z":8,"position":{"x":740,"y":85},"attrs":{"rect":{"fill":"grey"},"text":{"text":"View Result","fill":"white"}}},{"type":"basic.Decision","size":{"width":70,"height":40},"id":"a89c27a5-a609-4372-a370-9067bffccb9c","z":9,"position":{"x":755,"y":160},"attrs":{"text":{"text":"Purchase"}}},{"type":"basic.Circle","size":{"width":30,"height":30},"id":"23538bae-4167-4d84-8b95-029d31449b55","z":10,"position":{"x":775,"y":230},"attrs":{"circle":{"fill":"green"}}},{"type":"basic.Circle","size":{"width":30,"height":30},"id":"551b6769-784c-4a23-b119-30bf12c1f320","z":11,"position":{"x":875,"y":165},"attrs":{"circle":{"fill":"green"}}},{"type":"link","source":{"id":"d20b5cde-08a5-4924-9a7f-9ea2233654c1"},"target":{"id":"5263db73-adc8-41a4-be54-4e058be66caa"},"manhattan":true,"toolMarkup":"<g></g>","id":"d3bae423-cb58-4b32-91e8-f9c27e7b0fb8","z":12,"attrs":{".marker-target":{"d":"M 10 0 L 0 5 L 10 10 z"}}},{"type":"link","source":{"id":"5263db73-adc8-41a4-be54-4e058be66caa"},"target":{"id":"fa7d020c-4653-4bd5-85aa-b6c9111d8d7a"},"manhattan":true,"toolMarkup":"<g></g>","id":"7a96f39f-4fa5-4a16-895c-6a33333d813e","z":13,"attrs":{".marker-target":{"d":"M 10 0 L 0 5 L 10 10 z"}}},{"type":"link","source":{"id":"fa7d020c-4653-4bd5-85aa-b6c9111d8d7a"},"target":{"id":"b39147c4-4db7-4671-bef1-b92fd380c795"},"manhattan":true,"toolMarkup":"<g></g>","id":"7e932439-c0bb-4fec-acdd-fc8342dcc72d","z":14,"attrs":{".marker-target":{"d":"M 10 0 L 0 5 L 10 10 z"}}},{"type":"link","source":{"id":"b39147c4-4db7-4671-bef1-b92fd380c795"},"target":{"id":"4d3e55b7-068c-40b1-9cad-d2cca469c13e"},"manhattan":true,"toolMarkup":"<g></g>","id":"5cca5ba7-3263-4d38-bbca-12d7f48f345d","z":15,"attrs":{".marker-target":{"d":"M 10 0 L 0 5 L 10 10 z"}}},{"type":"link","source":{"id":"4d3e55b7-068c-40b1-9cad-d2cca469c13e"},"target":{"id":"c82b8e1d-5aae-401d-9ee9-e7faa41e44ca"},"manhattan":true,"toolMarkup":"<g></g>","id":"c9688b34-2d6d-47b8-98ac-931958dea90f","z":16,"vertices":[],"attrs":{".marker-target":{"d":"M 10 0 L 0 5 L 10 10 z"}}},{"type":"link","source":{"id":"4d3e55b7-068c-40b1-9cad-d2cca469c13e"},"target":{"id":"312f74ce-e786-4e31-968c-7283238e90d0"},"manhattan":true,"toolMarkup":"<g></g>","id":"1a2aac6d-782e-450d-8002-36dfca298eff","z":17,"vertices":[],"attrs":{".marker-target":{"d":"M 10 0 L 0 5 L 10 10 z"}}},{"type":"link","source":{"id":"c82b8e1d-5aae-401d-9ee9-e7faa41e44ca"},"target":{"id":"cbd5466b-6841-40f8-a102-90d43fd05912"},"manhattan":true,"toolMarkup":"<g></g>","id":"5a400978-f692-4b23-99d0-8aa1ab3cba88","z":18,"attrs":{".marker-target":{"d":"M 10 0 L 0 5 L 10 10 z"}}},{"type":"link","source":{"id":"cbd5466b-6841-40f8-a102-90d43fd05912"},"target":{"id":"5263db73-adc8-41a4-be54-4e058be66caa"},"manhattan":true,"toolMarkup":"<g></g>","id":"96f820d9-841a-44fc-87ca-5b9dab125c33","z":19,"vertices":[{"x":150,"y":255,"d":"top"}],"attrs":{".marker-target":{"d":"M 10 0 L 0 5 L 10 10 z"}}},{"type":"link","source":{"id":"cbd5466b-6841-40f8-a102-90d43fd05912"},"target":{"id":"312f74ce-e786-4e31-968c-7283238e90d0"},"manhattan":true,"toolMarkup":"<g></g>","id":"5969f55c-d532-4003-9481-b75ecac7dcd3","z":20,"vertices":[{"x":595,"y":255,"d":"top"}],"attrs":{".marker-target":{"d":"M 10 0 L 0 5 L 10 10 z"}}},{"type":"link","source":{"id":"312f74ce-e786-4e31-968c-7283238e90d0"},"target":{"id":"37f5c598-66f6-4e10-9ecd-e1d19dd9c16c"},"manhattan":true,"toolMarkup":"<g></g>","id":"61b393ed-7055-4926-84a9-35bafd25972e","z":21,"attrs":{".marker-target":{"d":"M 10 0 L 0 5 L 10 10 z"}}},{"type":"link","source":{"id":"37f5c598-66f6-4e10-9ecd-e1d19dd9c16c"},"target":{"id":"a89c27a5-a609-4372-a370-9067bffccb9c"},"manhattan":true,"toolMarkup":"<g></g>","id":"95f53c9b-4602-43f5-8443-d0c496930419","z":22,"attrs":{".marker-target":{"d":"M 10 0 L 0 5 L 10 10 z"}}},{"type":"link","source":{"id":"a89c27a5-a609-4372-a370-9067bffccb9c"},"target":{"id":"23538bae-4167-4d84-8b95-029d31449b55"},"manhattan":true,"toolMarkup":"<g></g>","id":"b183d198-c1e9-4fa9-a034-33c95dda7a82","z":23,"attrs":{".marker-target":{"d":"M 10 0 L 0 5 L 10 10 z"}}},{"type":"link","source":{"id":"a89c27a5-a609-4372-a370-9067bffccb9c"},"target":{"id":"551b6769-784c-4a23-b119-30bf12c1f320"},"manhattan":true,"toolMarkup":"<g></g>","id":"eb639dcf-1840-4700-91da-c27a58fcc9f6","z":24,"attrs":{".marker-target":{"d":"M 10 0 L 0 5 L 10 10 z"}}}]}';
  processDefinition.save().done();
})();


