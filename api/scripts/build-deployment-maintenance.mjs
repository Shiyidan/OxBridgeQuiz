// 本地构建分阶段数据迁移工具，测试服务器只执行 JavaScript，不安装开发工具或编译 TypeScript。
import { build } from 'esbuild'
import path from 'node:path'

const apiRoot = process.cwd()
await build({
  entryPoints: ['migrate-question-meta', 'migrate-question-content', 'migrate-syllabus-labels', 'cleanup-legacy-temporary-practice'].map(name => `scripts/${name}.ts`),
  outdir: 'dist/maintenance', outExtension: { '.js': '.mjs' },
  platform: 'node', target: 'node20', format: 'esm', bundle: true, packages: 'external',
  plugins: [{
    name: 'isolated-migration-client',
    setup(builder) {
      // 阶段 Client 与应用 Client 隔离；业务查询仍通过原有 Prisma 单例实现。
      builder.onResolve({ filter: /^@prisma\/client$/ }, () => ({ path: './generated-client/index.js', external: true }))
      builder.onResolve({ filter: /(?:^|\/)services\/prisma\.js$/ }, () => ({ path: './services/prisma.js', external: true }))
    },
  }],
  absWorkingDir: path.resolve(apiRoot),
})
