var endWith, startsWith, sysPath;

sysPath = require('path');

startsWith = function(string, substring) {
  return string.lastIndexOf(substring, 0) === 0;
};

endWith = function(string, suffix) {
  return string.indexOf(suffix, string.length - suffix.length) !== -1;
};

exports.config = {
  modules: {
    definition: false,
    wrapper: function(path, data) {
      if (!endWith(path, 'joint.nojquerynobackbone.js') &&
          !endWith(path, 'joint.layout.DirectedGraph.js') &&
          !startsWith(path, 'app/diagram-viewer')) {
        return "(function() {\n  " + data + "\n}());\n\n";
      } else {
        return "" + data;
      }
    }
  },
  conventions: {
    assets: function(path) {
      return (!endWith(sysPath.basename(path), '.js')) && (!endWith(sysPath.basename(path), '.css'));
    }
  },
  files: {
    javascripts: {
      joinTo: {
        'js/app.js': /^app\/(?!(diagram-viewer))/,
        'js/vendor.js': /^(bower_components|vendor)/,
        'js/diagram-viewer.js': /^app\/diagram-viewer/,
        'test/js/test.js': /^test(\/|\\)(?!bower_components)/,
        'test/js/test-bower_components.js': /^test(\/|\\)(?=bower_components)/
      },
      order: {
        before: [
          'vendor/jquery.js',
          'vendor/lodash.js',
          'bower_components/angular/angular.js',
          'vendor/angular-nvd3/d3.js',
          'vendor/qtip/jquery.qtip.js',

          // diagram viewer
          'app/diagram-viewer/js/jstools.js',
          'app/diagram-viewer/js/raphael.js',
          'app/diagram-viewer/js/jquery/jquery.progressbar.js',
          'app/diagram-viewer/js/jquery/jquery.asyncqueue.js',
          'app/diagram-viewer/js/Color.js',
          'app/diagram-viewer/js/Polyline.js',
          'app/diagram-viewer/js/ActivityImpl.js',
          'app/diagram-viewer/js/ActivitiRest.js',
          'app/diagram-viewer/js/LineBreakMeasurer.js',
          'app/diagram-viewer/js/ProcessDiagramGenerator.js',
          'app/diagram-viewer/js/ProcessDiagramCanvas.js'
        ]
      }
    },
    stylesheets: {
      joinTo: {
        'css/app.css': /^app\/(?!(diagram-viewer))/,
        'css/vendor.css': /^(bower_components|vendor)/,
        'diagram-viewer/style.css': /^app\/diagram-viewer/
      }
    }
  },
  overrides: {
    production: {
      sourceMaps: true
    }
  },
  server: {
    path: 'nodemon-wrapper.js'
  }
};
