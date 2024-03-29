import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import MarkdownPreview from 'vite-plugin-markdown-preview'
import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: 'vite-plugin-markdown-preview',
  description: 'vite-plugin-markdown-preview vitepress playground',
  vite: {
    plugins: [vueJsx(), MarkdownPreview()],
  },
  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/JasKang/vite-plugin-markdown-preview' },
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2022-present jaskang',
    },
  },
})
