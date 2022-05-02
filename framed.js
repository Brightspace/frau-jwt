'use strict';

var clientPromise = require('./ifrau-client');

var REQUEST_KEY = require('./request-key');

module.exports = function getFramedJwt(scope, opts) {
	return clientPromise
		.then(function(Client) {
			return new Client().connect();
		})
		.then(function(client) {
			return client.request(REQUEST_KEY, scope, opts);
		});
};
