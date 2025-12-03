# Interface: Result\<T\>

Defined in: [types.ts:1](https://github.com/Gugustinette/unrun/blob/b64adabdf32121df1c2a5f2e0fb417df89d458ee/src/types.ts#L1)

## Type Parameters

### T

`T` = `unknown`

## Properties

### dependencies

```ts
dependencies: string[];
```

Defined in: [types.ts:11](https://github.com/Gugustinette/unrun/blob/b64adabdf32121df1c2a5f2e0fb417df89d458ee/src/types.ts#L11)

The dependencies involved when loading the targeted module.
Note: this only includes local file dependencies, npm-resolved dependencies are excluded.

---

### module

```ts
module: T;
```

Defined in: [types.ts:6](https://github.com/Gugustinette/unrun/blob/b64adabdf32121df1c2a5f2e0fb417df89d458ee/src/types.ts#L6)

The module that was loaded.
You can specify the type of the module by providing a type argument when using the `unrun` function.
