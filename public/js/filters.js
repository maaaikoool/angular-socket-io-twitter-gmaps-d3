'use strict';

/* Filters */

  angular.module('myApp.filters', []).filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
}).filter('top5', function() {
  	return function(items) {
	  	 return items.sort(compareCount).slice(0, (items.length < 5) ? items.length : 5)
	 };
});


function compareCount(a,b) { 
    if(a.count == b.count)
        return 0;
    if(a.count > b.count)
        return -1;
    else
        return 1
}

