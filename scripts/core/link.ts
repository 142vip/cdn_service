import {
  GitGeneralBranch,
  vipLogger,
  VipNodeJS,
} from '@142vip/utils'

/**
 * 备份访问域名
 * - https://github.com/XPoet/picx/issues/154
 */
enum BackupCDNDomain {
  CDN_STATICALY_COM = 'https://cdn.staticaly.com',
  JSD_CDN_ZZKO_CN = 'https://jsd.cdn.zzko.cn',
  CDN_JSDELIVR_NET = 'https://cdn.jsdelivr.net',
  CDN_STATICALLY_IO = 'cdn.statically.io',
  CDN_FASTLY_JSDELIVR_NET = 'fastly.jsdelivr.net',
}

// 忽略的文件
const IgnoreDirNameList: string[] = ['.git', '.idea', 'link', 'LICENSE', 'README.md', 'readme.md', 'node_modules', 'scripts']
const CDNPrefixRouter = `${BackupCDNDomain.CDN_JSDELIVR_NET}/gh/142vip/cdn_service@`

/**
 * 循环遍历当前目录下的所有文件
 */
function getAllFile(dirName: string, filesList: string[]): void {
  const files = VipNodeJS.readdirSync(dirName)
  files.forEach((file) => {
    if (!IgnoreDirNameList.includes(file)) {
      const deepPath = `${dirName}/${file}`
      if (VipNodeJS.isDirectory(deepPath)) {
        getAllFile(deepPath, filesList)
      }
      else {
        filesList.push(deepPath)
      }
    }
  })
}

const filesList: string[] = []
getAllFile('.', filesList)

function printLinks(branch: string): void {
  vipLogger.logByBlank(`${branch}分支下的cdn访问链接：`)
  const chineseFiles: string[] = []
  for (const filename of filesList) {
    console.log(filename, filename.slice(1))
    const realFilePath = filename.slice(1)
    if (/[\u4E00-\u9FA5]/.test(realFilePath)) {
      chineseFiles.push(realFilePath)
      vipLogger.logByBlank(`${realFilePath} -- 包含中文，生成的CDN链接可能访问不存在，建议修改！！！`)
    }
    else {
      vipLogger.log(`${CDNPrefixRouter}${branch}${realFilePath}`)
    }
  }

  // 处理中文
  if (chineseFiles.length > 0) {
    vipLogger.logByBlank('包含中文，生成的CDN链接可能访问不存在，建议修改！！！')
    vipLogger.log(chineseFiles.join('\n'))
  }
}

// 输出main分支链接
printLinks(GitGeneralBranch.MAIN)

// 输出next分支链接
printLinks(GitGeneralBranch.NEXT)
