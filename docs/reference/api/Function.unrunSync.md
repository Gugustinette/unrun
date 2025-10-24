# Function: unrunSync()

```ts
function unrunSync(options): any;
```

Defined in: [index.ts:57](https://github.com/Gugustinette/unrun/blob/8a9ded37d6301e096d513875042f8e88334bc098/src/index.ts#L57)

Loads a module with JIT compilation based on the provided options.
This function runs synchronously using a worker thread.

## Parameters

### options

[`Options`](Interface.Options.md)

The options for loading the module.

## Returns

`any`

The loaded module.
