# Function: unrunCli()

```ts
function unrunCli(options, args): Promise<CliResult>;
```

Defined in: [index.ts:69](https://github.com/Gugustinette/unrun/blob/820eb49cc19e3f61445feaad271174649b79ff69/src/index.ts#L69)

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
