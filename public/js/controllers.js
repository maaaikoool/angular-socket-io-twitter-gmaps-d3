'use strict';

/* Controllers */

function TweetStream($scope, $log, $timeout, $filter, socket)
{
	$scope.tweets = new Array();
	$scope.languages = new Array();
	$scope.clicks = $scope.cont = 0;
	$scope.rectangle;
	$scope.streaming = false;

	$scope.results =  {
        Language: {
            _type: "terms",
            terms: new Array()
        },
		User : {
			_type: "terms",
			 terms: [{
                term: "Friends",
                count: 1
            }, {
                term: "Followers",
                count: 1
            }]
		},
		Timer : {
			_type: "date_histogram",
		    entries : new Array()
		}
    };

	socket.on('tweet', function (message) {
		
		$scope.tweets.push(message);
		$scope.cont++;
		$scope.numTweets++;
		$scope.results.User.terms[0].count+=message.user.friends_count;
		$scope.results.User.terms[1].count+=message.user.followers_count;

		var found=false,i=0;
		while(!found && i < $scope.languages.length)
		{
			if(message.lang == $scope.languages[i].term)
			{
				found = true;
				$scope.languages[i].count++;
			}
			else
				i++;
		}

		if(!found)
			$scope.languages.push({term : message.lang, count : 1});

		$scope.results.Language.terms = $filter('top5')($scope.languages);
		
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

    });

	$scope.stream = function()
	{
		$scope.showGraph = true;

		if($scope.buttonVal == "Stream!" && $scope.rectangle != undefined)
		{	
			$timeout(function (){
			  		$scope.position.coords.latitude = $scope.rectangle.bounds.getCenter().lat();
					$scope.position.coords.longitude = $scope.rectangle.bounds.getCenter().lng();
			},1000);
			$scope.buttonVal = "Stop";
			$scope.results.User.terms[0].count=$scope.results.User.terms[1].count=$scope.tweets.length=$scope.languages.length=$scope.cont=0;

			var aux = $scope.rectangle.getBounds().getSouthWest().lng() + "," + $scope.rectangle.getBounds().getSouthWest().lat()
						+ "," + $scope.rectangle.getBounds().getNorthEast().lng() + "," + $scope.rectangle.getBounds().getNorthEast().lat();
			$scope.rectangle.setMap(null);
			socket.emit('start', aux);
			$scope.streaming = true;

			 $timeout(function timer(){
		       	$scope.results.Timer.entries.push({ time : new Date().getTime(), count: $scope.cont});
		 		$scope.cont = 0;
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

}