var ProcessEngine = require('process-engine');
var ProcessDefinition = ProcessEngine.ProcessDefinition;
var _ = require('lodash');
var samples = require('process-engine/examples/basic-processes');
var insuranceSamples = require('process-engine/examples/insurance-processes');

function init(app) {
  var processEngine = app.get('processEngine');
  var humanTaskService = processEngine.humanTaskService;
  var processBuilder = processEngine.processBuilder;

  _.each(samples, function (definition) {
    var processDefinition = processEngine.importProcessDefinition(definition);
    processDefinition.save().done();
  });

  _.each(insuranceSamples, function (definition) {
    var processDefinition = processEngine.importProcessDefinition(definition);
    processDefinition.save().done();
  });
}

module.exports = init;


