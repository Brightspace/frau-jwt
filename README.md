# frau-jwt

[![NPM version](https://img.shields.io/npm/v/frau-jwt.svg)](https://www.npmjs.org/package/frau-jwt)

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

## Versioning & Releasing

> TL;DR: Commits prefixed with `fix:` and `feat:` will trigger patch and minor releases when merged to `main`. Read on for more details...

The [semantic-release GitHub Action](https://github.com/BrightspaceUI/actions/tree/main/semantic-release) is called from the `release.yml` GitHub Action workflow to handle version changes and releasing.

### Version Changes

All version changes should obey [semantic versioning](https://semver.org/) rules:
1. **MAJOR** version when you make incompatible API changes,
2. **MINOR** version when you add functionality in a backwards compatible manner, and
3. **PATCH** version when you make backwards compatible bug fixes.

The next version number will be determined from the commit messages since the previous release. Our semantic-release configuration uses the [Angular convention](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular) when analyzing commits:
* Commits which are prefixed with `fix:` or `perf:` will trigger a `patch` release. Example: `fix: validate input before using`
* Commits which are prefixed with `feat:` will trigger a `minor` release. Example: `feat: add toggle() method`
* To trigger a MAJOR release, include `BREAKING CHANGE:` with a space or two newlines in the footer of the commit message
* Other suggested prefixes which will **NOT** trigger a release: `build:`, `ci:`, `docs:`, `style:`, `refactor:` and `test:`. Example: `docs: adding README for new component`

To revert a change, add the `revert:` prefix to the original commit message. This will cause the reverted change to be omitted from the release notes. Example: `revert: fix: validate input before using`.

### Releases

When a release is triggered, it will:
* Update the version in `package.json`
* Tag the commit
* Create a GitHub release (including release notes)
* Deploy a new package to NPM

### Releasing from Maintenance Branches

Occasionally you'll want to backport a feature or bug fix to an older release. `semantic-release` refers to these as [maintenance branches](https://semantic-release.gitbook.io/semantic-release/usage/workflow-configuration#maintenance-branches).

Maintenance branch names should be of the form: `+([0-9])?(.{+([0-9]),x}).x`.

Regular expressions are complicated, but this essentially means branch names should look like:
* `1.15.x` for patch releases on top of the `1.15` release (after version `1.16` exists)
* `2.x` for feature releases on top of the `2` release (after version `3` exists)
