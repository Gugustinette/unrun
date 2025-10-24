# Interface: Options

Defined in: [options.ts:4](https://github.com/Gugustinette/unrun/blob/8a9ded37d6301e096d513875042f8e88334bc098/src/options.ts#L4)

## Properties

### debug?

```ts
optional debug: boolean;
```

Defined in: [options.ts:18](https://github.com/Gugustinette/unrun/blob/8a9ded37d6301e096d513875042f8e88334bc098/src/options.ts#L18)

Debug mode.
Wether or not to keep temporary files to help with debugging.
Temporary files are stored in `node_modules/.cache/unrun/` if possible,
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

Defined in: [options.ts:30](https://github.com/Gugustinette/unrun/blob/8a9ded37d6301e096d513875042f8e88334bc098/src/options.ts#L30)

Additional rolldown input options. These options will be merged with the
defaults provided by unrun, with these options always taking precedence.

---

### outputOptions?

```ts
optional outputOptions: OutputOptions;
```

Defined in: [options.ts:36](https://github.com/Gugustinette/unrun/blob/8a9ded37d6301e096d513875042f8e88334bc098/src/options.ts#L36)

Additional rolldown output options. These options will be merged with the
defaults provided by unrun, with these options always taking precedence.

---

### path?

```ts
optional path: string | URL;
```

Defined in: [options.ts:9](https://github.com/Gugustinette/unrun/blob/8a9ded37d6301e096d513875042f8e88334bc098/src/options.ts#L9)

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

Defined in: [options.ts:24](https://github.com/Gugustinette/unrun/blob/8a9ded37d6301e096d513875042f8e88334bc098/src/options.ts#L24)

The preset to use for bundling and output format.

#### Default

```ts
"none";
```
