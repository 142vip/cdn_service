import { commitLiner } from '@142vip/commit-linter'
import { VipColor, VipConsole, vipLogger } from '@142vip/utils'

const { type, scope, subject, commit } = commitLiner({
  scopes: ['408', 'jsc', 'main-vip', 'oauth-client', 'scripts', 'media', 'site'],
})

// 提交符合规范，打印相关信息
VipConsole.log(`type: ${type}, scope: ${scope}, subject: ${subject}`)
vipLogger.logByBlank(`${VipColor.greenBright('Git Commit: ')} ${VipColor.green(commit)}`)
