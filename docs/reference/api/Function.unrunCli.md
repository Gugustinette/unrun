# Function: unrunCli()

```ts
function unrunCli(options, args?): Promise<CliResult>;
```

Defined in: [index.ts:73](https://github.com/Gugustinette/unrun/blob/1d96385dc157c7e6982ac12e98a5a41be1dab16e/src/index.ts#L73)

Runs a given module with JIT transpilation based on the provided options.
This function does not return the module, as it simply executes it.
Corresponds to the CLI behavior.

## Parameters

### options

[`Options`](Interface.Options.md)

The options for running the module.

### args?

`string`[] = `[]`

Additional command-line arguments to pass to the module.

## Returns

`Promise`\<[`CliResult`](Interface.CliResult.md)\>
