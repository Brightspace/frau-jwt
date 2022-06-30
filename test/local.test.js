import { default as getLocalJwt, resetCaches, TOKEN_ROUTE } from '../src/local.js';
import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import { XSRF_TOKEN_PATH } from 'frau-xsrf-token';

const EXPIRES_AT = 5;

describe('local', () => {

	let fetchStub, tokenCallCount, clock, hasClockSkew, sandbox;
	beforeEach(() => {

		sandbox = sinon.createSandbox();
		clock = sandbox.useFakeTimers();
		hasClockSkew = false;
		tokenCallCount = 0;
		localStorage.clear();

		fetchStub = sandbox.stub(window, 'fetch');
		fetchStub.callsFake((resource, init) => {
			return new Promise((resolve) => {
				let response;
				if (resource === XSRF_TOKEN_PATH) {
					response = new Response(JSON.stringify({
						referrerToken: 'tokeny-token'
					}), {
						status: 200,
						headers: { 'Content-type': 'application/json' }
					});
				} else if (resource === TOKEN_ROUTE) {
					tokenCallCount++;
					const scope = init.body.get('scope');
					response = new Response(JSON.stringify({
						expires_at: EXPIRES_AT,
						access_token: `token-${scope}-${Date.now()}`
					}), {
						status: 200,
						headers: {
							'Content-type': 'application/json',
							'Date': hasClockSkew ? 'Thu, 1 Jan 1970 00:00:02 GMT' : 'Thu, 1 Jan 1970 00:00:00 GMT'
						}
					});
				}
				setTimeout(() => resolve(response));
				clock.tick();
			});
		});
	});

	afterEach(() => {
		sandbox.restore();
		resetCaches();
	});

	it('should default to scope *:*:*', async() => {
		await getLocalJwt();
		const fetchInitArg = fetchStub.getCall(1).args[1];
		expect(fetchInitArg.body.get('scope')).to.equal('*:*:*');
	});

	it('should resolve with token the LMS returns', async() => {
		const value = await getLocalJwt();
		expect(value).to.equal('token-*:*:*-0');
	});

	it('should dedupe concurrent requests for the same scope', async() => {
		const values = await Promise.allSettled([getLocalJwt(), getLocalJwt()]);
		expect(values[0].value).to.equal('token-*:*:*-0');
		expect(values[1].value).to.equal('token-*:*:*-0');
		expect(tokenCallCount).to.equal(1);
	});

	it('should not dedupe concurrent requests for different scopes', async() => {
		const scope1 = 'a:b:c';
		const scope2 = 'x:y:z';
		const values = await Promise.allSettled([getLocalJwt(scope1), getLocalJwt(scope2)]);
		expect(values[0].value).to.equal(`token-${scope1}-0`);
		expect(values[1].value).to.equal(`token-${scope2}-0`);
		expect(tokenCallCount).to.equal(2);
	});

	it('should cache tokens per scope', async() => {
		const scope = 'a:b:c';
		const value1 = await getLocalJwt(scope);
		expect(value1).to.equal(`token-${scope}-0`);
		clock.tick((EXPIRES_AT - 1) * 1000);
		const value2 = await getLocalJwt(scope);
		expect(value2).to.equal(`token-${scope}-0`);
		expect(tokenCallCount).to.equal(1);
	});

	it('should re-fetch tokens after expiry', async() => {
		const expiryTick = (EXPIRES_AT + 1) * 1000;
		const value1 = await getLocalJwt();
		expect(value1).to.equal('token-*:*:*-0');
		clock.tick(expiryTick);
		const value2 = await getLocalJwt();
		expect(value2).to.equal(`token-*:*:*-${expiryTick}`);
		expect(tokenCallCount).to.equal(2);
	});

	it('should account for clock skew from server when determining expiry', async() => {
		hasClockSkew = true;
		const expiryTick = (EXPIRES_AT - 1) * 1000;
		const value1 = await getLocalJwt();
		expect(value1).to.equal('token-*:*:*-0');
		clock.tick(expiryTick);
		const value2 = await getLocalJwt();
		expect(value2).to.equal(`token-*:*:*-${expiryTick}`);
		expect(tokenCallCount).to.equal(2);
	});
});
