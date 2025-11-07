# Interface: Result

Defined in: [types.ts:1](https://github.com/Gugustinette/unrun/blob/bae8f2c2e2ebb9973307777da1471f84fa253869/src/types.ts#L1)

## Properties

### dependencies

```ts
dependencies: string[];
```

Defined in: [types.ts:10](https://github.com/Gugustinette/unrun/blob/bae8f2c2e2ebb9973307777da1471f84fa253869/src/types.ts#L10)

The dependencies involved when loading the targeted module.
Note: this only includes local file dependencies, npm-resolved dependencies are excluded.

---

### module

```ts
module: any;
```

Defined in: [types.ts:5](https://github.com/Gugustinette/unrun/blob/bae8f2c2e2ebb9973307777da1471f84fa253869/src/types.ts#L5)

The module that was loaded.
