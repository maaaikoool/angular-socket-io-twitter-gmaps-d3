'use strict';

/* Controllers */

function TweetStream($scope, $log, $timeout, socket)
{
	$scope.class = "";
	$scope.buttonVal = "Stream!"
	$scope.tweets = new Array();
	$scope.terms = new Array();
	$scope.friends=$scope.followers=$scope.clicks = $scope.cont = 0;
	$scope.rectangle;
	$scope.entries = new Array();
	$scope.streaming = false;

	socket.on('tweet', function (message) {
		
		$scope.class = "streaming";
		$scope.tweets.push(message);
		$scope.cont++;
		$scope.numTweets++;
		$scope.friends+=message.user.friends_count;
		$scope.followers+=message.user.followers_count;

		var found=false,i=0;
		while(!found && i < $scope.terms.length)
		{
			if(message.lang == $scope.terms[i].term)
			{
				found = true;
				$scope.terms[i].count++;
			}
			else
				i++;
		}

		if(!found)
			$scope.terms.push({term : message.lang, count : 1});
		
		if(message.coordinates != undefined)
		{
			var user = message.user.id_str;
			$scope.markersProperty.push({latitude : message.coordinates.coordinates[1], longitude : message.coordinates.coordinates[0], icon : message.user.profile_image_url, user : user});
			$timeout(function () {
			 	angular.forEach($scope.markersProperty, function (v, i) {
			 		if(v.user == user) 
			 			$scope.markersProperty.splice(i,1);
			 	 });
			 }, 1500);
		}


		var aux = {
                Language: {
                    _type: "terms",
                    terms: $scope.terms.sort(compareCount).slice(0, ($scope.terms.length < 5) ? $scope.terms.length : 5)
                },
        		User : {
        			_type: "terms",
        			 terms: [{
                        term: "Friends",
                        count: $scope.friends
                    }, {
                        term: "Followers",
                        count: $scope.followers
                    }]
        		}
        };
		$scope.results = aux;

    });

	$scope.stream = function()
	{
		$scope.showGraph = true;

		if($scope.buttonVal == "Stream!" && $scope.rectangle != undefined)
		{	

			// $timeout(function (){
			  		$scope.position.coords.latitude = $scope.rectangle.bounds.getCenter().lat();
					$scope.position.coords.longitude = $scope.rectangle.bounds.getCenter().lng();
			// },1000);
			$scope.buttonVal = "Stop";
			$scope.tweets.length=$scope.terms.length=$scope.entries.length=$scope.friends=$scope.followers=$scope.cont=0;

			var aux = $scope.rectangle.getBounds().getSouthWest().lng() + "," + $scope.rectangle.getBounds().getSouthWest().lat()
						+ "," + $scope.rectangle.getBounds().getNorthEast().lng() + "," + $scope.rectangle.getBounds().getNorthEast().lat();
			$scope.rectangle.setMap(null);
			socket.emit('start', aux);

			$scope.streaming = true;

			 $timeout(function timer(){
		       	$scope.entries.push({ time : new Date().getTime(), count: $scope.cont});
		 		$scope.cont = 0;
		 		$scope.timer =  {
	        			_type: "date_histogram",
		        		entries : $scope.entries
	        		};
		 		if($scope.streaming)
		        	$timeout(timer, 1000);
		    },1000);

		}
		else if($scope.buttonVal == "Stop")
		{
			$scope.buttonVal = "Stream!";
			$scope.streaming = false;
	 		socket.emit('stop');
		}
		
	}

	angular.extend($scope, {

	    position: {
	      coords: {
			latitude: 54,
	        longitude: 25
	      }
	    },

		/** the initial center of the map */
		centerProperty: {
			   latitude: 54,
	        longitude: 25
		},

		/** the initial zoom level of the map */
		zoomProperty: 4,

		/** list of markers to put in the map */
		markersProperty: [],

		// These 2 properties will be set when clicking on the map
		clickedLatitudeProperty: null,	
		clickedLongitudeProperty: null,

		eventsProperty: {
		  click: function (mapModel, eventName, originalEventArgs) {	
		    
		    $scope.clicks++;

		    if($scope.clicks == 1 && $scope.rectangle != undefined)
		    	$scope.rectangle.setMap(null);
		    else if($scope.clicks > 1)
		    {
		    	$scope.rectangle = mapModel.addRectangle( toBounds(
			      new google.maps.LatLng($scope.clickedLatitudeProperty, $scope.clickedLongitudeProperty),
			      originalEventArgs[0].latLng) ,'#3182bd', { name : 'rightclick', function : $scope.stream });

		    	mapModel.removeMarkers(mapModel.getMarkerInstances());
		    	mapModel.markers.length = 0;
		    	$scope.clicks = 0;
		    	$scope.markersProperty.length = 0;

		    }
		    
		  }
		}
	});

	function toLatLng(lat, lng) {
	    return new google.maps.LatLng(lat, lng);
	  }

	function toBounds(j,k) {
	var pts = [];
	var latMin, latMax, lngMin, lngMax;
	var sw, ne;

	latMin = Math.min(j.lat(), k.lat());
	latMax = Math.max(j.lat(), k.lat());

	lngMin = Math.min(j.lng(), k.lng());
	lngMax = Math.max(j.lng(), k.lng());

	sw = toLatLng(latMin, lngMin);
	ne = toLatLng(latMax, lngMax);
	return new google.maps.LatLngBounds(sw, ne);
	}

	function compareCount(a,b) { 
	    if(a.count == b.count)
	        return 0;
	    if(a.count > b.count)
	        return -1;
	    else
	        return 1
	}

}
