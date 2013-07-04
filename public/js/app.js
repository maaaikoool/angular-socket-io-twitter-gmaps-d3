'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', ['myApp.filters', 'myApp.services', 'myApp.directives',"google-maps","dangle"]).
  config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
		$routeProvider.when('/streaming', {templateUrl: 'partials/streaming', controller: TweetStream});
		 $routeProvider.otherwise({redirectTo: '/streaming'});

    $locationProvider.html5Mode(true);
  }]);