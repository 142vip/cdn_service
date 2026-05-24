<script setup lang="ts">
import { onMounted } from 'vue'
import { siteConfig } from '@/site.config'

/** 页脚：文案与 142vip.cn 保持一致 */
onMounted(() => {
  const id = siteConfig.baiduAnalyticsId
  if (!import.meta.env.PROD || !id || document.querySelector(`script[src*="hm.baidu.com/hm.js?${id}"]`))
    return

  window._hmt = window._hmt || []
  const script = document.createElement('script')
  script.src = `https://hm.baidu.com/hm.js?${id}`
  script.async = true
  document.head.appendChild(script)
})
</script>

<template>
  <ElFooter class="site-footer" height="auto">
    <ElSpace direction="vertical" :size="4" alignment="center">
      <ElText size="small" type="info">
        百度统计
      </ElText>
      <ElLink :href="siteConfig.footer.icpUrl" target="_blank" type="info" :underline="false">
        <ElText size="small" type="info">
          {{ siteConfig.footer.icp }}
        </ElText>
      </ElLink>
      <ElLink :href="siteConfig.homeUrl" target="_blank" type="info" :underline="false">
        <ElText size="small" type="info">
          {{ siteConfig.footer.copyright }}
        </ElText>
      </ElLink>
    </ElSpace>
  </ElFooter>
</template>

<style scoped>
.site-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}
</style>
