import {BackupCDNDomain, Branch} from "./domain.enum";


/**
 * 获取文件的访问链接
 * @param filePath
 * @param options
 */
export function getLink(filePath:string,options?:{
  prefixRouter?:BackupCDNDomain,
  branch?:Branch
}){
  const prefixRouter=options?.prefixRouter??BackupCDNDomain.CDN_STATICALY_COM
  const branch=options?.branch??Branch.main

  return `${prefixRouter}/gh/142vip/cdn_service@${branch}/${filePath}`
}
