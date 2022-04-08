'use strict';

var request = require('superagent'),
	xsrfToken = require('frau-superagent-xsrf-token');

var DEFAULT_SCOPE = '*:*:*',
	TOKEN_ROUTE = '/d2l/lp/auth/oauth2/token';

var CACHED_TOKENS = null,
	IN_FLIGHT_REQUESTS = null,
	CLOCK_SKEW = 0;

resetCaches();

function clock() {
	return (Date.now() / 1000) | 0;
}

function expired(token) {
	return module.exports._clock() + CLOCK_SKEW > token.expires_at;
}

function resetCaches() {
	CACHED_TOKENS = Object.create(null);
	IN_FLIGHT_REQUESTS = Object.create(null);
}

function cacheToken(scope, token) {
	CACHED_TOKENS[scope] = token;
}

function cachedToken(scope) {
	return Promise
		.resolve()
		.then(function() {
			var cached = CACHED_TOKENS[scope];
			if (cached) {
				if (!expired(cached)) {
					return cached.access_token;
				}

				delete CACHED_TOKENS[scope];
			}

			throw new Error('No cached token');
		});
}

function adjustClockSkew(res) {
	var dateHeader = res.headers && res.headers.date;
	if (!dateHeader) {
		return;
	}

	var serverTime = new Date(dateHeader).getTime();
	// getTime() will return NaN when dateHeader wasn't parseable
	// and this is faster than isNaN
	if (serverTime !== serverTime) {
		return;
	}

	serverTime = serverTime / 1000 | 0;

	var currentTime = module.exports._clock();

	CLOCK_SKEW = serverTime - currentTime;
}

function requestToken(scope) {
	return new Promise(function(resolve, reject) {
		request
			.post(TOKEN_ROUTE)
			.type('form')
			.send({
				scope: scope,
				'X-D2L-Session': 'no-keep-alive'
			})
			.use(xsrfToken)
			.end(function(err, res) {
				if (err) {
					return reject(err);
				}

				adjustClockSkew(res);

				resolve(res.body);
			});
	});
}

function requestTokenDeduped(scope) {
	if (!IN_FLIGHT_REQUESTS[scope]) {
		IN_FLIGHT_REQUESTS[scope] = requestToken(scope)
			.then(function(token) {
				delete IN_FLIGHT_REQUESTS[scope];
				return token;
			})
			.catch(function(e) {
				delete IN_FLIGHT_REQUESTS[scope];
				throw e;
			});
	}

	return IN_FLIGHT_REQUESTS[scope];
}

module.exports = function getLocalJwt(scope) {
	return Promise
		.resolve()
		.then(function() {
			scope = scope || DEFAULT_SCOPE;

			var cached = cachedToken.bind(null, scope);

			return cached()
				.catch(function() {
					return requestTokenDeduped(scope)
						.then(cacheToken.bind(null, scope))
						.then(cached);
				});
		});
};

global.addEventListener && global.addEventListener('storage', function sessionListener(e) {
	switch (e.key) {
		case 'Session.Expired':
		case 'Session.UserId':
			resetCaches();
			break;
		default:
			break;
	}
});

module.exports._clock = clock;
module.exports._resetCaches = resetCaches;
