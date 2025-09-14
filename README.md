# unrun

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Unit Test][unit-test-src]][unit-test-href]

Load anything at runtime.

## Install

```bash
npm i unrun
```

## Usage

```ts
import { unrun } from 'unrun';

const mod = await unrun("./path/to/file.ts");
```

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/unrun.svg
[npm-version-href]: https://npmjs.com/package/unrun
[npm-downloads-src]: https://img.shields.io/npm/dm/unrun
[npm-downloads-href]: https://www.npmcharts.com/compare/unrun?interval=30
[unit-test-src]: https://github.com/gugustinette/unrun/actions/workflows/unit-test.yml/badge.svg
[unit-test-href]: https://github.com/gugustinette/unrun/actions/workflows/unit-test.yml
