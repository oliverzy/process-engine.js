var Promise = require("bluebird");
Promise.longStackTraces();
var expect = require('chai').expect;
var ProcessEngine = require('../');
var processEngine = ProcessEngine.create(),
    ProcessDefinition = ProcessEngine.ProcessDefinition,
    processBuilder = processEngine.processBuilder,
    humanTaskService = processEngine.humanTaskService;
var _ = require('lodash');
var samples = require('../examples/insurance-processes.js');

describe('Quick Quote Process', function() {
  var processDefinition = processEngine.importProcessDefinition(samples.quickQuote);
  var processInstance;
  beforeEach(function() {
    processInstance = processEngine.createProcessInstance(processDefinition);
  });

  it('auto underwriting passed', function(done) {
    processInstance.on('end', function () {
      expect(processInstance.variables).to.deep.equal({ age: 30, autoUnderwritingResult: true, confirmPurchase: true });
      done();
    });

    processInstance.start({});
    setTimeout(function () {
      humanTaskService.complete(processInstance.getNode('Basic Info').taskEntityId,
        _.extend(processInstance.variables, {age: 30}));
    }, 100);

    setTimeout(function () {
      humanTaskService.complete(processInstance.getNode('View Result').taskEntityId,
          _.extend(processInstance.variables, {confirmPurchase: true}));
    }, 150);
  });

  it('auto underwriting failed', function(done) {
    processInstance.on('end', function () {
      expect(processInstance.variables).to.deep.equal({ age: 70, autoUnderwritingResult: false, manualUnderwritingResult: true, confirmPurchase: false });
      done();
    });

    processInstance.start({});
    setTimeout(function () {
      humanTaskService.complete(processInstance.getNode('Basic Info').taskEntityId,
        _.extend(processInstance.variables, {age: 70}));
    }, 100);

    setTimeout(function () {
      humanTaskService.complete(processInstance.getNode('Manual UW').taskEntityId,
        _.extend(processInstance.variables, {manualUnderwritingResult: true}));
    }, 150);

    setTimeout(function () {
      humanTaskService.complete(processInstance.getNode('View Result').taskEntityId,
          _.extend(processInstance.variables, {confirmPurchase: false}));
    }, 200);
  });

  it('manual underwriting failed and retry', function(done) {
    processInstance.on('end', function () {
      expect(processInstance.variables).to.deep.equal({ age: 70, autoUnderwritingResult: false, manualUnderwritingResult: true, confirmPurchase: true, vip: true });
      done();
    });

    processInstance.start({});
    setTimeout(function () {
      humanTaskService.complete(processInstance.getNode('Basic Info').taskEntityId,
        _.extend(processInstance.variables, {age: 70}));
    }, 200);

    setTimeout(function () {
      humanTaskService.complete(processInstance.getNode('Manual UW').taskEntityId,
        _.extend(processInstance.variables, {manualUnderwritingResult: false}));
    }, 250);

    setTimeout(function () {
      humanTaskService.complete(processInstance.getNode('Basic Info').taskEntityId,
        _.extend(processInstance.variables, {vip: true}));
    }, 300);

    setTimeout(function () {
      humanTaskService.complete(processInstance.getNode('Manual UW').taskEntityId,
        _.extend(processInstance.variables, {manualUnderwritingResult: true}));
    }, 350);

    setTimeout(function () {
      humanTaskService.complete(processInstance.getNode('View Result').taskEntityId,
          _.extend(processInstance.variables, {confirmPurchase: true}));
    }, 400);
  });

  it.skip('diagram-model', function () {
    var diagram_model = ProcessEngine.getDiagramModel(processDefinition);

    //console.log(util.inspect(diagram_model, {depth: null}));
    var fs = require('fs');
    var d2 = fs.readFileSync('test/layouts/Quick Quote.json', {encoding: 'utf8'});
    expect(JSON.stringify(diagram_model)).to.eql(d2);
  });

});

