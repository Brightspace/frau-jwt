import { expect } from '@brightspace-ui/testing';
import { framed } from '../src/index.js';

describe('index', () => {

	afterEach(() => {
		window.D2L = undefined;
	});

	it('should return true if D2L is undefined', () => {
		const val = framed();
		expect(val).to.be.true;
	});

	it('should return true if D2L is defined and D2L.IsNotAnIframedApp is not defined', () => {
		window.D2L = {};

		const val = framed();
		expect(val).to.be.true;
	});

	it('should return false if D2L.IsNotAnIframedApp is defined', () => {
		window.D2L = {};
		window.D2L.IsNotAnIframedApp = true;

		const val = framed();
		expect(val).to.be.false;
	});

});
