/* jshint node: true */

var _ = require('lodash');
var util = require('util');
var Promise = require("bluebird");
Promise.longStackTraces();
var expect = require('chai').expect;
var ProcessEngine = require('../');
var processEngine = ProcessEngine.create();
var insuranceSamples = require('./insurance-processes');

var processDefinition = processEngine.importProcessDefinition(insuranceSamples.quickQuote);
var diagram_model = ProcessEngine.Diagram.getDiagramModel(processDefinition);

console.log(util.inspect(diagram_model, {depth: null}));
var fs = require('fs');
console.log(process.cwd());
fs.writeFileSync('../ui/server/sample-test-diagram.json', JSON.stringify(diagram_model));
fs.writeFileSync('../test/layouts/Quick Quote.json', JSON.stringify(diagram_model));


