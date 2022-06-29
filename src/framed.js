import clientPromise from './ifrau-client.js';
import REQUEST_KEY from './request-key.js';

export default async function getFramedJwt(scope, opts) {
	const Client = await clientPromise;
	const client = await  new Client().connect();
	const token = await client.request(REQUEST_KEY, scope, opts);
	return token;
}
