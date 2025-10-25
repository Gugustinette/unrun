import { defineConfig } from 'vitepress'
import {
  groupIconMdPlugin,
  groupIconVitePlugin,
} from 'vitepress-plugin-group-icons'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'unrun - Unything at runtime',
  description: 'Unything at runtime',
  base: '/unrun/',
  head: [
    ['link', { rel: 'icon', href: '/unrun/public/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#ff9143' }],
  ],
  themeConfig: {
    siteTitle: 'unrun',
    logo: {
      src: '/unrun-logo.webp',
      alt: 'unrun logo',
      height: 32,
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/introduction' },
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Introduction', link: '/guide/introduction' },
          { text: 'Getting started', link: '/guide/getting-started' },
        ],
      },
      {
        text: 'Advanced',
        items: [
          { text: 'JSX', link: '/advanced/jsx' },
          { text: 'Presets', link: '/advanced/presets' },
        ],
      },
      {
        text: 'API Reference',
        items: [
          { text: 'Config options', link: '/reference/api/Interface.Options' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/gugustinette/unrun' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/unrun' },
    ],

    search: {
      provider: 'local',
    },
  },
  markdown: {
    config(md) {
      md.use(groupIconMdPlugin)
    },
  },
  vite: {
    plugins: [groupIconVitePlugin()],
  },
})
