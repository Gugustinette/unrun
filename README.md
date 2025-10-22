# unrun

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Unit Test][unit-test-src]][unit-test-href]

unrun is a tool that enables running any module at runtime (TypeScript, ESM, CJS, JSX, etc.) by bundling it with [Rolldown](https://rolldown.rs/).

It is highly inspired by tools like :

- [jiti](https://github.com/unjs/jiti)
- [bundle-require](https://github.com/egoist/bundle-require)
- [tsx](https://tsx.is/)

In fact, unrun is tested against most of the same test cases as jiti and bundle-require to ensure backward compatibility.

## Install

```bash
npm i unrun
```

## Usage

- Programmatic API
  - Async

  ```ts
  import { unrun } from 'unrun'

  const mod = await unrun({
    path: './path/to/file', // Path to the module to load
  })
  ```

  - Sync

  ```ts
  import { unrunSync } from 'unrun'

  const mod = unrunSync({
    path: './path/to/file', // Path to the module to load
  })
  ```

- CLI

```bash
npx unrun ./path/to/file
```

## Options

| Option          | Type                     | Default              | Description                                                             |
| --------------- | ------------------------ | -------------------- | ----------------------------------------------------------------------- |
| `path`          | `string`                 | `'custom.config.ts'` | Path to the module to load.                                             |
| `debug`         | `boolean`                | `false`              | Keep temporary build artifacts to help with debugging.                  |
| `outputPreset`  | `'none' \| 'jiti'`       | `'none'`             | Selects the output preset used during bundling.                         |
| `inputOptions`  | `rolldown.InputOptions`  | `undefined`          | Extra rolldown input options that override the defaults used by unrun.  |
| `outputOptions` | `rolldown.OutputOptions` | `undefined`          | Extra rolldown output options that override the defaults used by unrun. |

## Advanced Usage

### JSX

When loading files that contain JSX syntax, you may need to customize Rolldown's JSX transform options :

```ts
import { unrun } from 'unrun'

const mod = await unrun({
  path: './path/to/file-with-jsx.tsx',
  inputOptions: {
    transform: {
      jsx: {
        // Adjust these options according to your needs
        importSource: 'react',
        pragma: 'React.createElement',
        pragmaFrag: 'React.Fragment',
      },
    },
  },
})
```

For example, when using JSX with Vue, you need to set the `importSource` to `'vue'` :

```ts
import { unrun } from 'unrun'

const mod = await unrun({
  path: './path/to/file-with-jsx.tsx',
  inputOptions: {
    transform: {
      jsx: {
        importSource: 'vue',
      },
    },
  },
})
```

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/unrun.svg
[npm-version-href]: https://npmjs.com/package/unrun
[npm-downloads-src]: https://img.shields.io/npm/dm/unrun
[npm-downloads-href]: https://www.npmcharts.com/compare/unrun?interval=30
[unit-test-src]: https://github.com/gugustinette/unrun/actions/workflows/unit-test.yml/badge.svg
[unit-test-href]: https://github.com/gugustinette/unrun/actions/workflows/unit-test.yml
