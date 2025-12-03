# Function: unrunSync()

```ts
function unrunSync<T>(options): Result<T>;
```

Defined in: [index.ts:51](https://github.com/Gugustinette/unrun/blob/b64adabdf32121df1c2a5f2e0fb417df89d458ee/src/index.ts#L51)

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
