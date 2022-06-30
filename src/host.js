import getJwt from './local.js';
import REQUEST_KEY from './request-key.js';

export default function ifrauJwtHost(host) {
	host.onRequest(REQUEST_KEY, getJwt);
}
