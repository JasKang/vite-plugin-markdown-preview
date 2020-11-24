import fs from 'fs-extra'
import { ServerPlugin } from 'vite'
import { createMarkdownRenderFn, DemoType } from './markdownToVue'
import { VUEDOC_DEMO_RE } from './resolver'
import { VueDocPluginOptions } from '.'
import path from 'path'
const slash = require('slash');
// const getETag = require('etag')

const debug = require('debug')('vite:vuedoc:serve')
const debugHmr = require('debug')('vite:vuedoc:hmr')

const cacheDemos: Map<string, DemoType[]> = new Map()

export function createVuedocServerPlugin(options: VueDocPluginOptions): ServerPlugin {
  return ({ app, root, watcher, resolver }) => {
    const markdownToVue = createMarkdownRenderFn(options)

    // hot reload .md files as .vue files
    watcher.on('change', async file => {
      if (file.endsWith('.md')) {
        debugHmr(`reloading ${file}`)
        const content = await fs.readFile(file, 'utf-8')
        const { component, demos } = markdownToVue(content, file)
        cacheDemos.set(file, demos)
        const timestamp = Date.now()
        for (const demo of demos) {
          watcher.handleVueReload(`${slash(file)}/${demo.id}`, timestamp, demo.code)
        }
        watcher.handleVueReload(`${slash(file)}`, timestamp, component)
      }
    })

    app.use(async (ctx, next) => {
      if (VUEDOC_DEMO_RE.test(ctx.path)) {
        const file = resolver.requestToFile(ctx.path)
        const [, filepath, id] = VUEDOC_DEMO_RE.exec(file) || []
        const demos = cacheDemos.get(filepath) || []
        const demo = demos.find(item => item.id === id)

        ctx.vue = true
        ctx.type = 'js'
        ctx.set('Cache-Control', 'no-store')
        ctx.body = demo?.code
        await next()
        return
      }
      if (ctx.path.endsWith('.md')) {
        const file = resolver.requestToFile(ctx.path)
        if (!fs.existsSync(file)) {
          return next()
        }
        const content = await fs.readFile(file, 'utf-8')
        const requestPath = path.join('/', path.relative(root, file))
        debug(`requestPath:${requestPath}`)

        const { component, demos } = markdownToVue(content, requestPath)
        cacheDemos.set(file, demos)

        ctx.vue = true
        ctx.type = 'js'
        ctx.set('Cache-Control', 'no-store')
        ctx.body = component
        await next()
        debug(ctx.url, ctx.status)
        return
      }
      await next()
    })
  }
}

// export async function createServer(options: ServerConfig = {}) {

//   return createViteServer({
//     ...options,
//     configureServer: createVitePressPlugin(config),
//     resolvers: [config.resolver]
//   })
// }
