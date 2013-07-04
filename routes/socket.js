/*
 * Serve content over a socket
 */

module.exports = function (socket) {

  var twitter = require('ntwitter');
  var credentials = require('../TwitterCredentials.js');

  var twit = new twitter({
     consumer_key: credentials.consumer_key,
    consumer_secret: credentials.consumer_secret,
    access_token_key: credentials.access_token_key,
    access_token_secret: credentials.access_token_secret
  });

	socket.on('start', function (filter) {

    console.log("filter " + filter );

    twit.stream('statuses/filter', {'locations': filter}, function(stream) {

      stream.on('data', function (data) {
        socket.emit('tweet',data);
      });
      stream.on('end', function (response) {
        console.log("stream end");
      });
      stream.on('destroy', function (response) {
          console.log("stream destroy");
      });

      socket.on('stop', function() {
        console.log("socket stop");
        stream.destroy();
      });

      socket.on('error', function() {
        console.log("socket error");
        stream.destroy();
      });

    });

  });
	
  

};