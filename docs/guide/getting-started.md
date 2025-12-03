# Getting started

## Installation

Install `unrun` using your preferred package manager:

::: code-group

```sh [npm]
npm install unrun
```

```sh [pnpm]
pnpm add unrun
```

```sh [yarn]
yarn add unrun
```

```sh [bun]
bun add unrun
```

:::

## Usage

### CLI

You can use `unrun` via the command line interface (CLI) to run a JavaScript or TypeScript file directly.

::: code-group

```sh [npm]
npx unrun ./path/to/file.ts
```

```sh [pnpm]
pnpx unrun ./path/to/file.ts
```

```sh [yarn]
yarn dlx unrun ./path/to/file.ts
```

:::

### Programmatic API

You can also use `unrun` programmatically in your code, either asynchronously or synchronously.

- Async usage

```ts
import { unrun } from 'unrun'

const { module } = await unrun({
  path: './path/to/file.ts', // Path to the module to load
})
```

- Sync usage

```ts
import { unrunSync } from 'unrun'

const { module } = unrunSync({
  path: './path/to/file.ts', // Path to the module to load
})
```

::: warning
The synchronous API requires [`synckit`](https://github.com/un-ts/synckit) to be installed. If you don't have it installed, please run `npm install synckit` or the equivalent command for your package manager.
:::
