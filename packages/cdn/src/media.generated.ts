/** 自动生成，请勿手改。执行 pnpm sync:cdn 更新 */
import { mediaExportPath } from './media-path'

export const MEDIA_SRC = {
  svg: {
    bilibili: mediaExportPath('svg/bilibili.svg'),
    csdn: mediaExportPath('svg/csdn.svg'),
    gitee: mediaExportPath('svg/gitee.svg'),
    github: mediaExportPath('svg/github.svg'),
    juejin: mediaExportPath('svg/juejin.svg'),
  },
  wechat: {
    chuFan443650x650: mediaExportPath('wechat/chu-fan-443-650x650.jpg'),
    chuFan443: mediaExportPath('wechat/chu-fan-443.jpg'),
    chuFanCode450x450: mediaExportPath('wechat/chu-fan-code-450x450.webp'),
    chuFanCode: mediaExportPath('wechat/chu-fan-code.jpg'),
    fairySister450x450: mediaExportPath('wechat/fairy-sister-450x450.jpg'),
    fairySister: mediaExportPath('wechat/fairy-sister.jpg'),
    mainCode: mediaExportPath('wechat/main-code.png'),
  },
} as const

/**media 资源路径映射类型 */
export type MediaSrc = typeof MEDIA_SRC
