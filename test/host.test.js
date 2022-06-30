import { expect } from '@open-wc/testing';
import getJwt from '../src/local.js';
import ifrauJwtHost from '../src/host.js';
import REQUEST_KEY from '../src/request-key.js';
import sinon from 'sinon';

describe('host', () => {

	it('should add "onRequest" listener to ifrau host', () => {
		const onRequestStub = sinon.stub();
		const ifrauHost = { onRequest: onRequestStub };
		ifrauJwtHost(ifrauHost);
		expect(onRequestStub).to.have.been.calledWith(REQUEST_KEY, getJwt);
	});

});
