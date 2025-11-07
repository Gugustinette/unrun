# Function: unrunSync()

```ts
function unrunSync(options): Result;
```

Defined in: [index.ts:51](https://github.com/Gugustinette/unrun/blob/bae8f2c2e2ebb9973307777da1471f84fa253869/src/index.ts#L51)

Loads a module with JIT transpilation based on the provided options.
This function runs synchronously using a worker thread.

## Parameters

### options

[`Options`](Interface.Options.md)

The options for loading the module.

## Returns

[`Result`](Interface.Result.md)

The loaded module.
