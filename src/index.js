import framed from 'frau-framed';
import getFramed from './framed.js';
import getLocal from './local.js';

export default function getJwt() {
	const fn = framed()
		? getFramed
		: getLocal;
	return fn.apply(fn, arguments);
}
