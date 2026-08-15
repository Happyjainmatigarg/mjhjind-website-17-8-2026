// @ts-check
import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import node from '@astrojs/node'

export default defineConfig({
  site: 'https://mjhospital.in',
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  server: {
    host: true,
  },
  build: {
    inlineStylesheets: 'auto',
  },
})
