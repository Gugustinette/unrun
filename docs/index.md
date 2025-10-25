---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: 'unrun'
  text: 'Unything at runtime'
  tagline: 'A tool to dynamically load and execute any JavaScript or TypeScript code at runtime.'
  image:
    src: /unrun-logo.webp
    alt: unrun
  actions:
    - theme: brand
      text: Getting Started
      link: /guide/getting-started
    - theme: alt
      text: API Reference
      link: /reference/api/Interface.Options

features:
  - icon: ⚡
    title: Fast
    details: Powered by Rolldown and Oxc
  - icon: 🛠️
    title: Unything
    details: Run ESM, CJS, TypeScript or JSX
  - icon: ↩️
    title: Backwards compatible
    details: High compatibility with jiti and bundle-require if needed
---
