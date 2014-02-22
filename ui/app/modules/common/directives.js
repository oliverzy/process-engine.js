var module = angular.module("Common.Directives", []);

module.directive('bsNavbar', function($location) {
  return {
    restrict: 'A',
    link: function postLink(scope, element, attrs, controller) {
      // Watch for the $location
      scope.$watch(function() {
        return $location.path();
      }, function(newValue, oldValue) {

        $('li[data-match-route]', element).each(function(k, li) {
          var $li = angular.element(li),
            // data('match-rout') does not work with dynamic attributes
            pattern = $li.attr('data-match-route'),
            regexp = new RegExp('^' + pattern + '$', ['i']);

          if (regexp.test(newValue)) {
            $li.addClass('active');
          } else {
            $li.removeClass('active');
          }

        });
      });
    }
  };
});

module.directive('inputMask', function() {
  return {
    require: 'ngModel',
    restrict: 'A',
    link: function($scope, iElm, iAttrs, ngModel) {
      var options = $scope.$eval(iAttrs.inputMask);
      angular.extend(options, {
        oncomplete: function(event) {
          var value = $(event.target).inputmask('unmaskedvalue');
          $scope.$apply(function() {
            ngModel.$setViewValue(value);
          });
        }
      });
      $(iElm).inputmask(options);
    }
  };
});
