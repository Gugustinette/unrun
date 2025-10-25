# Function: unrunSync()

```ts
function unrunSync(options): Result;
```

Defined in: [index.ts:37](https://github.com/Gugustinette/unrun/blob/7887433aed88966d6e4547e5f4fa1d7ad5fdc0d0/src/index.ts#L37)

Loads a module with JIT compilation based on the provided options.
This function runs synchronously using a worker thread.

## Parameters

### options

[`Options`](Interface.Options.md)

The options for loading the module.

## Returns

[`Result`](Interface.Result.md)

The loaded module.
