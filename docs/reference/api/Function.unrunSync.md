# Function: unrunSync()

```ts
function unrunSync<T>(options): Result<T>;
```

Defined in: [index.ts:52](https://github.com/Gugustinette/unrun/blob/1d96385dc157c7e6982ac12e98a5a41be1dab16e/src/index.ts#L52)

Loads a module with JIT transpilation based on the provided options.
This function runs synchronously using a worker thread.

## Type Parameters

### T

`T`

## Parameters

### options

[`Options`](Interface.Options.md)

The options for loading the module.

## Returns

[`Result`](Interface.Result.md)\<`T`\>

The loaded module.
