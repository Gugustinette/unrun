# Function: unrun()

```ts
function unrun<T>(options): Promise<Result<T>>;
```

Defined in: [index.ts:20](https://github.com/Gugustinette/unrun/blob/1d96385dc157c7e6982ac12e98a5a41be1dab16e/src/index.ts#L20)

Loads a module with JIT transpilation based on the provided options.

## Type Parameters

### T

`T`

## Parameters

### options

[`Options`](Interface.Options.md)

The options for loading the module.

## Returns

`Promise`\<[`Result`](Interface.Result.md)\<`T`\>\>

A promise that resolves to the loaded module.
