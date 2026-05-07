# Interface: Result\<T\>

Defined in: [types.ts:1](https://github.com/Gugustinette/unrun/blob/1d96385dc157c7e6982ac12e98a5a41be1dab16e/src/types.ts#L1)

## Type Parameters

### T

`T` = `unknown`

## Properties

### dependencies

```ts
dependencies: string[];
```

Defined in: [types.ts:11](https://github.com/Gugustinette/unrun/blob/1d96385dc157c7e6982ac12e98a5a41be1dab16e/src/types.ts#L11)

The dependencies involved when loading the targeted module.
Note: this only includes local file dependencies, npm-resolved dependencies are excluded.

---

### module

```ts
module: T;
```

Defined in: [types.ts:6](https://github.com/Gugustinette/unrun/blob/1d96385dc157c7e6982ac12e98a5a41be1dab16e/src/types.ts#L6)

The module that was loaded.
You can specify the type of the module by providing a type argument when using the `unrun` function.
