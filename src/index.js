import getFramed from './framed.js';
import getLocal from './local.js';

export function framed() {
	return !window.D2L || !window.D2L.IsNotAnIframedApp;
}

export default function getJwt() {
	const fn = framed()
		? getFramed
		: getLocal;
	return fn.apply(fn, arguments);
}
