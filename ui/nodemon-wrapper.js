exports.startServer = function(port, path, callback) {
  var child_process = require('child_process');
  var server = child_process.spawn('nodemon', ['--watch', '../node_modules/process-engine', '--watch','.' ,'server.js'], {cwd: 'server'});
  server.stdout.setEncoding('utf8');
  callback();
  server.stdout.on('data', function(data) {
      process.stdout.write(data);
    });

  server.stderr.on('data', function(data) {
      process.stdout.write(data);
    });

  return server;
};