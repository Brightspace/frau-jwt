# frau-jwt

[![NPM version][npm-image]][npm-url]

Simple utility to get a json web token in a D2L free range application ([frau](https://www.npmjs.com/browse/keyword/frau)).

## Install
```sh
npm install frau-jwt --save
```

## Usage

```js
import jwt from 'frau-jwt';

const token = await jwt('a:b:c');
```

### API

---

#### `jwt([String scope][, Object opts])` -> `Promise<String>`

Requests a JWT with the given scope and opts from the hosting LMS. If in an ifrau, the request will be delegated to the frame host. 

The resulting token will be cached until it expires.

##### scope `String` _(`*:*:*:`)_

If _scope_ is provided, then it will be sent as the request scope of the token.
It should be a properly formatted String, with scopes seperated by spaces.

```js
jwt();
jwt('foo:bar:baz');
jwt('a:b:c x:y:z');
```

##### opts `Object`

If an _opts_ object is provided, the following options will be checked for:

##### Option: extendSession `Boolean` _(true)_

You may optionally specify whether you want the user's sessions to be extended by the act of fetching the token.

```js
jwt();
jwt({ extendSession: false });
jwt('foo:bar:baz', { extendSession: false });
```

## Testing

```bash
npm test
```

[npm-url]: https://www.npmjs.org/package/frau-jwt
[npm-image]: https://img.shields.io/npm/v/frau-jwt.svg
