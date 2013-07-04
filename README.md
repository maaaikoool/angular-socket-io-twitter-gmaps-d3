# Angular + Socket.io + Twitter Streaming API + Google Maps + d3.js(Dangle)

1- npm install angular-socket-io-twitter-gmaps-d3

2- Set up the Twitter credentials in a 'TwitterCredentials.js' file in the root directory.

var credentials = {
    consumer_key: 'your consumer key here',
    consumer_secret: 'your consumer secret here',
    access_token_key: 'your access token key here',
    access_token_secret: 'your access token secret here'
};

module.exports = credentials;

3- node app.js

4- Double click in the map to set the bounds within Twitter Streaming API will filter tweets

5- Right click in the rectangle or press Stream! button to start

