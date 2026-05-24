import { defineVipEslintConfig } from '@142vip/eslint-config'

export default defineVipEslintConfig({
  ignores: [
    '**/CHANGELOG.md',
    'apps/**',
    'backup/**',
    'site/dist/**',
    'site/src/assets/manifest.json',
    'site/src/types/auto-imports.d.ts',
    'site/src/types/components.d.ts',
  ],
  rules: {
    // 用于在模块构建后基于dist导出时找不到文件，忽略校验
    'antfu/no-import-dist': 0,
  },
  settings: {
    node: {
      exitFunctions: ['process.exit', 'VipNodeJS.exitProcess'],
    },
  },
})
