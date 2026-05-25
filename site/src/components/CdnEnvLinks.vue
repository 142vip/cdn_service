<script setup lang="ts">
import type { CdnEnv } from '@/utils/cdn'
import { ElMessage } from 'element-plus'
import { reactive } from 'vue'
import {
  buildCdnUrl,
  copyText,
  getCdnDomains,
  getCdnEnvSections,
  getDefaultCdnHost,
} from '@/utils/cdn'

const props = defineProps<{
  filePath: string
}>()

const sections = getCdnEnvSections()
const domains = getCdnDomains()

const hostByEnv = reactive<Record<CdnEnv, string>>({
  production: getDefaultCdnHost(),
  development: getDefaultCdnHost(),
})

function urlFor(env: CdnEnv, branch: string) {
  return buildCdnUrl(props.filePath, hostByEnv[env], branch)
}

async function handleCopy(url: string) {
  try {
    await copyText(url)
    ElMessage.success('链接已复制')
  }
  catch {
    ElMessage.error('复制失败')
  }
}
</script>

<template>
  <div class="cdn-env-links">
    <section v-for="section in sections" :key="section.key" class="cdn-env-links__block">
      <div class="cdn-env-links__head">
        <ElTag :type="section.key === 'production' ? 'success' : 'warning'" size="small">
          {{ section.label }}
        </ElTag>
        <ElText type="info" size="small">
          {{ section.branch }} · {{ section.hint }}
        </ElText>
      </div>
      <div class="cdn-env-links__row">
        <ElSelect v-model="hostByEnv[section.key]" size="small" class="cdn-env-links__select">
          <ElOption
            v-for="domain in domains"
            :key="domain.host"
            :label="domain.label"
            :value="domain.host"
          />
        </ElSelect>
        <ElInput :model-value="urlFor(section.key, section.branch)" readonly size="small">
          <template #append>
            <ElButton @click="handleCopy(urlFor(section.key, section.branch))">
              复制
            </ElButton>
          </template>
        </ElInput>
      </div>
    </section>
  </div>
</template>

<style scoped>
.cdn-env-links {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
}

.cdn-env-links__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.cdn-env-links__row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cdn-env-links__select {
  width: 100%;
}
</style>
