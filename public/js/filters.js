'use strict';

/* Filters */

  angular.module('myApp.filters', []).filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
});
