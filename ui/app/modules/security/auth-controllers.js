var module = angular.module("Security.Controllers", []);
// Login
module.controller("LoginController", function($rootScope, $scope, $location, Authentication) {
  $scope.remember = false;
  $scope.login = function() {
    Authentication.login($scope.username, $scope.password, $scope.remember).then(function(success) {
      if (success) {
        $rootScope.$broadcast("login.success");
        $location.path("/");
      } else {
        //Notifications.addError({ status: "Login Failed", message: "Username / password are incorrect" });
      }
    });
  };
});

// Logout
module.controller("LogoutController", function($scope, $location, Authentication) {
  $scope.loginUser = Authentication.current();
  $scope.logout = function() {
    Authentication.logout().then(function(success) {
      $scope.loginUser = null;
      $location.path("/login");
    });
  };

  $scope.$on("login.success", function() {
    $scope.loginUser = Authentication.current();
  });
});

