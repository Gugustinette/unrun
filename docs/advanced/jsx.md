# JSX

When loading files that contain JSX syntax, you may need to customize Rolldown's JSX transform options :

```ts
import { unrun } from 'unrun'

const mod = await unrun({
  path: './path/to/file-with-jsx.tsx',
  inputOptions: {
    transform: {
      jsx: {
        // Adjust these options according to your needs
        importSource: 'react',
        pragma: 'React.createElement',
        pragmaFrag: 'React.Fragment',
      },
    },
  },
})
```

For example, when using JSX with Vue, you need to set the `importSource` to `'vue'` :

```ts
import { unrun } from 'unrun'

const mod = await unrun({
  path: './path/to/file-with-jsx.tsx',
  inputOptions: {
    transform: {
      jsx: {
        importSource: 'vue',
      },
    },
  },
})
```
