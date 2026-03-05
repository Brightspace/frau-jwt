'use strict';

var chai = require('chai'),
	chaiAsPromised = require('chai-as-promised').default,
	nock = require('nock'),
	sinon = require('sinon');

chai.use(chaiAsPromised);
var expect = chai.expect;

var TOKEN_ROUTE = '/d2l/lp/auth/oauth2/token';

var jwt = require('../local');

describe('local', function() {
	beforeEach(function() {
		sinon.stub(jwt, '_clock');
		jwt._clock.returns(0);
	});
	afterEach(function() {
		jwt._clock.restore();
		jwt._resetCaches();
	});

	it('should default to scope *:*:*', function() {
		var req = nock('http://localhost')
			.post(TOKEN_ROUTE, /scope=%2A%3A%2A%3A%2A/)
			.reply(200, {
				expires_at: 1,
				access_token: 'foo-bar-baz'
			});

		return jwt().then(function() {
			req.done();
		});
	});

	it('should resolve with token the LMS returns', function() {
		var req = nock('http://localhost')
			.post(TOKEN_ROUTE)
			.reply(200, {
				expires_at: 1,
				access_token: 'foo-bar-baz'
			});

		return expect(jwt())
			.to.eventually.equal('foo-bar-baz')
			.then(function() {
				req.done();
			});
	});

	it('should dedupe concurrent requests for the same scope', function() {
		var req = nock('http://localhost')
			.post(TOKEN_ROUTE)
			.once()
			.reply(200, {
				expires_at: 1,
				access_token: 'foo-bar-baz'
			});

		return Promise
			.all([
				expect(jwt()).to.eventually.equal('foo-bar-baz'),
				expect(jwt()).to.eventually.equal('foo-bar-baz')
			])
			.then(function() {
				req.done();
			});
	});

	it('should not dedupe concurrent requests for different scopes', function() {
		var req = nock('http://localhost')
			.post(TOKEN_ROUTE, /scope=a%3Ab%3Ac/)
			.reply(200, {
				expires_at: 1,
				access_token: 'abc'
			})
			.post(TOKEN_ROUTE, /scope=x%3Ay%3Az/)
			.reply(200, {
				expires_at: 1,
				access_token: 'xyz'
			});

		return Promise
			.all([
				expect(jwt('a:b:c')).to.eventually.equal('abc'),
				expect(jwt('x:y:z')).to.eventually.equal('xyz')
			])
			.then(function() {
				req.done();
			});
	});

	it('should cache tokens per scope', function() {
		var req = nock('http://localhost')
			.post(TOKEN_ROUTE, /scope=a%3Ab%3Ac/)
			.once()
			.reply(200, {
				expires_at: 1,
				access_token: 'abc'
			})
			.post(TOKEN_ROUTE, /scope=x%3Ay%3Az/)
			.once()
			.reply(200, {
				expires_at: 1,
				access_token: 'xyz'
			});

		return Promise
			.all([
				expect(jwt('a:b:c')).to.eventually.equal('abc'),
				expect(jwt('x:y:z')).to.eventually.equal('xyz')
			])
			.then(function() {
				return Promise
					.all([
						expect(jwt('a:b:c')).to.eventually.equal('abc'),
						expect(jwt('x:y:z')).to.eventually.equal('xyz')
					]);
			})
			.then(function() {
				req.done();
			});
	});

	it('should re-fetch tokens after expiry', function() {
		var req = nock('http://localhost')
			.post(TOKEN_ROUTE, /scope=a%3Ab%3Ac/)
			.once()
			.reply(200, {
				expires_at: 1,
				access_token: 'abc'
			})
			.post(TOKEN_ROUTE, /scope=a%3Ab%3Ac/)
			.once()
			.reply(200, {
				expires_at: 3,
				access_token: 'def'
			});

		return expect(jwt('a:b:c'))
			.to.eventually.equal('abc')
			.then(function() {
				jwt._clock.returns(2);
			})
			.then(function() {
				return expect(jwt('a:b:c')).to.eventually.equal('def');
			})
			.then(function() {
				req.done();
			});
	});

	it('should account for clock skew from server when determining expiry', function() {
		jwt._clock.returns(1);

		var req = nock('http://localhost')
			.post(TOKEN_ROUTE, /scope=a%3Ab%3Ac/)
			.once()
			.reply(200, {
				expires_at: 10,
				access_token: 'abc'
			}, {
				'Date': 'Thu, 1 Jan 1970 00:00:03 GMT' // clock skew of 2
			})
			.post(TOKEN_ROUTE, /scope=a%3Ab%3Ac/)
			.once()
			.reply(200, {
				expires_at: 20,
				access_token: 'def'
			});

		return expect(jwt('a:b:c'))
			.to.eventually.equal('abc')
			.then(function() {
				jwt._clock.returns(9); // 11 after skew
			})
			.then(function() {
				return expect(jwt('a:b:c')).to.eventually.equal('def');
			})
			.then(function() {
				req.done();
			});
	});
});
