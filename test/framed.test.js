import { expect } from '@open-wc/testing';
import frauJwt from '../src/framed.js';
import REQUEST_KEY from '../src/request-key.js';
import sinon from 'sinon';

const TOKEN_VALUE = 'token-val!';

describe('framed', () => {

	let messageCallback, sandbox;
	beforeEach(() => {
		sandbox = sinon.createSandbox();
		sandbox.stub(window, 'addEventListener').callsFake((_type, callback) => {
			messageCallback = callback;
		});
		sandbox.stub(window, 'postMessage').callsFake((message) => {
			if (message.key === `frau.req.${REQUEST_KEY}`) {
				setTimeout(() => {
					const e = {
						source: window,
						data: {
							key: `frau.res.${REQUEST_KEY}`,
							payload: { id: message.payload.id, val: TOKEN_VALUE }
						}
					};
					messageCallback(e);
				});
			}
		});
	});
	afterEach(() => {
		sandbox.reset();
	});

	it('fetched token from ifrau', async() => {
		const token = await frauJwt();
		expect(token).to.equal(TOKEN_VALUE);
	});

});
