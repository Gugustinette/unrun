# Interface: Options

Defined in: [options.ts:7](https://github.com/Gugustinette/unrun/blob/bae8f2c2e2ebb9973307777da1471f84fa253869/src/options.ts#L7)

## Properties

### debug?

```ts
optional debug: boolean;
```

Defined in: [options.ts:21](https://github.com/Gugustinette/unrun/blob/bae8f2c2e2ebb9973307777da1471f84fa253869/src/options.ts#L21)

Debug mode.
Wether or not to keep temporary files to help with debugging.
Temporary files are stored in `node_modules/.unrun/` if possible,
otherwise in the OS temporary directory.

#### Default

```ts
false;
```

---

### inputOptions?

```ts
optional inputOptions: InputOptions;
```

Defined in: [options.ts:33](https://github.com/Gugustinette/unrun/blob/bae8f2c2e2ebb9973307777da1471f84fa253869/src/options.ts#L33)

Additional rolldown input options. These options will be merged with the
defaults provided by unrun, with these options always taking precedence.

---

### outputOptions?

```ts
optional outputOptions: OutputOptions;
```

Defined in: [options.ts:39](https://github.com/Gugustinette/unrun/blob/bae8f2c2e2ebb9973307777da1471f84fa253869/src/options.ts#L39)

Additional rolldown output options. These options will be merged with the
defaults provided by unrun, with these options always taking precedence.

---

### path?

```ts
optional path: string | URL;
```

Defined in: [options.ts:12](https://github.com/Gugustinette/unrun/blob/bae8f2c2e2ebb9973307777da1471f84fa253869/src/options.ts#L12)

The path to the file to be imported. Supports filesystem paths, file URLs or URL objects.

#### Default

```ts
"index.ts";
```

---

### preset?

```ts
optional preset: "none" | "jiti" | "bundle-require";
```

Defined in: [options.ts:27](https://github.com/Gugustinette/unrun/blob/bae8f2c2e2ebb9973307777da1471f84fa253869/src/options.ts#L27)

The preset to use for bundling and output format.

#### Default

```ts
"none";
```
