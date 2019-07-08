'use strict';

var Client = require('ifrau/client/slim'),
	Promise = require('lie');

var REQUEST_KEY = require('./request-key');

module.exports = function getFramedJwt(scope) {
	return Promise
		.resolve()
		.then(function() {
			return new Client().connect();
		})
		.then(function(client) {
			return client.request(REQUEST_KEY, scope);
		});
};
