# CLI

The CLI acts as a drop-in replacement for `node`, allowing you to run JavaScript or TypeScript files directly with JIT transpilation.

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

## Command line arguments

As for `node`, the order of your arguments matters. The general structure is as follows:

```sh
unrun [UNRUN_OPTIONS] <script-file> [SCRIPT_ARGUMENTS]
```

So if you want to pass options to `unrun`, make sure they come before the script file. Any arguments after the script file will be passed to the executed script.
