/* jshint node: true */

var _ = require('lodash');
var util = require('util');
var Promise = require("bluebird");
Promise.longStackTraces();
var expect = require('chai').expect;
var ProcessEngine = require('../');
var processEngine = ProcessEngine.processEngine,
    ProcessDefinition = ProcessEngine.ProcessDefinition,
    ProcessInstance = ProcessEngine.ProcessInstance,
    processBuilder = ProcessEngine.processBuilder,
    humanTaskService = ProcessEngine.humanTaskService;

function createProcessDefinition() {
  var processDefinition = new ProcessDefinition('Quick Quote');
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
    //console.log('Auto underwriting service task result:', variables.autoUnderwritingResult);
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
    //console.log(variables);
    return !variables.autoUnderwritingResult;
  });
  processDefinition.addFlow(manualUnderwriting, decisionManualUnderwriting);
  processDefinition.addFlow(decisionManualUnderwriting, decisionRepeat, function (variables) {
    //console.log(variables);
    return !variables.manualUnderwritingResult;
  });

  processDefinition.addFlow(decisionAutoUnderwriting, decisionMerge, function (variables) {
    //console.log(variables);
    return variables.autoUnderwritingResult;
  });
  processDefinition.addFlow(decisionManualUnderwriting, decisionMerge, function (variables) {
    //console.log(variables);
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

  return processDefinition;
}


var processDefinition = createProcessDefinition();
var diagram_model = ProcessEngine.getDiagramModel(processDefinition);

console.log(util.inspect(diagram_model, {depth: null}));
var fs = require('fs');
fs.writeFileSync('/Users/zhouyujie/dev/process-engine.js/ui/server/sample-test-diagram.json', JSON.stringify(diagram_model));

