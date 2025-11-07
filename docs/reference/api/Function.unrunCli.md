# Function: unrunCli()

```ts
function unrunCli(options, args): Promise<CliResult>;
```

Defined in: [index.ts:72](https://github.com/Gugustinette/unrun/blob/bae8f2c2e2ebb9973307777da1471f84fa253869/src/index.ts#L72)

Runs a given module with JIT transpilation based on the provided options.
This function does not return the module, as it simply executes it.
Corresponds to the CLI behavior.

## Parameters

### options

[`Options`](Interface.Options.md)

The options for running the module.

### args

`string`[] = `[]`

Additional command-line arguments to pass to the module.

## Returns

`Promise`\<[`CliResult`](Interface.CliResult.md)\>
