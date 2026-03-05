'use strict';

function framed() {
	return !window.D2L || !window.D2L.IsNotAnIframedApp;
}

var getFramed = require('./framed'),
	getLocal = require('./local');

module.exports = function frauJwt() {
	var fn = framed()
		? getFramed
		: getLocal;
	return fn.apply(fn, arguments);
};
