var _ = require('lodash');
_.extend(module.exports,
  require('./src/process-definition.js'),
  require('./src/process-engine.js'),
  require('./src/human-task.js'),
  require('./src/diagram-model.js'));