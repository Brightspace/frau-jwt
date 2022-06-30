import getXsrfToken from 'frau-xsrf-token';

const DEFAULT_SCOPE = '*:*:*';
export const TOKEN_ROUTE = '/d2l/lp/auth/oauth2/token';

let CACHED_TOKENS = null,
	IN_FLIGHT_REQUESTS = null,
	CLOCK_SKEW = 0;

resetCaches();

function clock() {
	return (Date.now() / 1000) | 0;
}

function expired(token) {
	return clock() + CLOCK_SKEW > token.expires_at;
}

export function resetCaches() {
	CACHED_TOKENS = Object.create(null);
	IN_FLIGHT_REQUESTS = Object.create(null);
}

function cacheToken(scope, token) {
	CACHED_TOKENS[scope] = token;
}

async function cachedToken(scope) {
	return Promise
		.resolve()
		.then(() => {
			const cached = CACHED_TOKENS[scope];
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
	const dateHeader = res.headers.get('date');
	if (!dateHeader) {
		return;
	}

	let serverTime = new Date(dateHeader).getTime();
	// getTime() will return NaN when dateHeader wasn't parseable
	// and this is faster than isNaN
	if (serverTime !== serverTime) {
		return;
	}

	serverTime = serverTime / 1000 | 0;

	const currentTime = clock();

	CLOCK_SKEW = serverTime - currentTime;
}

async function requestToken(scope, opts) {

	const params = new URLSearchParams({ scope: scope });
	if (opts && opts.extendSession === false) {
		params.append('X-D2L-Session', 'no-keep-alive');
	}

	let xsrfToken = null;
	try {
		xsrfToken = await getXsrfToken();
	// eslint-disable-next-line no-empty
	} catch (e) {}

	const headers = new Headers({
		'Content-Type': 'application/x-www-form-urlencoded'
	});
	if (xsrfToken !== null) {
		headers.append('X-Csrf-Token', xsrfToken);
	}

	const response = await fetch(TOKEN_ROUTE, {
		body: params,
		headers,
		method: 'POST'
	});
	if (!response.ok) {
		throw new Error(response.statusText);
	}

	adjustClockSkew(response);

	const value = await response.json();
	return value;

}

async function requestTokenDeduped(scope, opts) {
	if (!IN_FLIGHT_REQUESTS[scope]) {
		IN_FLIGHT_REQUESTS[scope] = requestToken(scope, opts)
			.then((token) => {
				delete IN_FLIGHT_REQUESTS[scope];
				return token;
			})
			.catch((e) => {
				delete IN_FLIGHT_REQUESTS[scope];
				throw e;
			});
	}

	return IN_FLIGHT_REQUESTS[scope];
}

export default async function getLocalJwt(scope, opts) {
	return Promise
		.resolve()
		.then(() => {
			if (typeof scope === 'object') {
				opts = scope;
				scope = undefined;
			}

			scope = scope || DEFAULT_SCOPE;

			const cached = cachedToken.bind(null, scope);

			return cached()
				.catch(() => {
					return requestTokenDeduped(scope, opts)
						.then(cacheToken.bind(null, scope))
						.then(cached);
				});
		});
}

window.addEventListener && window.addEventListener('storage', (e) => {
	switch (e.key) {
		case 'Session.Expired':
		case 'Session.UserId':
			resetCaches();
			break;
		default:
			break;
	}
});
