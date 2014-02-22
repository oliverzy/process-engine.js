/*global angular*/
var module = angular.module("Security", ["Security.Controllers"]);

module.factory("Authentication", function($http, $q, $rootScope) {

  function Authentication() {
    this.auth = {};
  }

  Authentication.prototype.getCurrentUserFromServer = function() {
    var self = this;
    return $http.get("../api/auth/user").success(function(data) {
      self.set(data);
      if (data != "anonymousUser") {
        $rootScope.$broadcast("login.success");
      }
    });
  };

  Authentication.prototype.current = function() {
    return this.auth.current;
  };

  Authentication.prototype.set = function(current) {
    this.auth.current = current;
  };

  Authentication.prototype.login = function(username, password, remember) {
    var self = this;
    var form = $.param({ 'username': username, 'password': password, 'remember_me': remember });
    var promise = $http({
      method: 'POST',
      url: "./login",
      data: form,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return promise.then(function(response) {
      self.set(username);
      $rootScope.loginErrorMessage = null;
      return true;
    }, function(response) {
      $rootScope.loginErrorMessage = "User name and password don't match!";
      return false;
    });
  };

  Authentication.prototype.logout = function() {
    var self = this,
      promise = $http.post("./logout");

    return promise.then(function() {
      self.set("anonymousUser");
      return true;
    });
  };

  Authentication.prototype.clear = function() {
    this.set("anonymousUser");
  };

  return new Authentication();
});

module.config(function($httpProvider) {
  $httpProvider.interceptors.push(['$q', '$rootScope', '$location', '$log', function($q, $rootScope, $location, $log) {
    return {
      responseError: function(response) {
        //$log.warn(response);
        $rootScope.$broadcast('httpError', response);
        return $q.reject(response);
      }
    };
  }]);
});

module.run(function($rootScope, $location, Authentication) {
  $rootScope.$on('httpError', function(event, response) {
    if (response.status == 401) {
      Authentication.clear();
      $rootScope.loginErrorMessage = "Please login first!";
      $location.path('/login');
    } else if (response.status == 403) {
      $rootScope.loginErrorMessage = "You have no enough permissions!";
      $location.path('/login');
    }
  });
});

module.factory("CheckAuth", function(Authentication, $q) {
  var deferred = $q.defer();
  Authentication.getCurrentUserFromServer().then(function() {
        deferred.resolve();
      }, function() {
        deferred.reject();
      });
  return deferred.promise;
});

module.config(function($routeProvider) {
  $routeProvider.when("/login", {
    templateUrl: "modules/security/login.html",
    controller: 'LoginController'
  });
});

