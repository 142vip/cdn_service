<script setup lang="ts">
import { getCdnBranches, getCdnDomains, getDefaultCdnBranch, getDefaultCdnHost } from '@/utils/cdn'

const branch = defineModel<string>('branch', { default: getDefaultCdnBranch() })
const host = defineModel<string>('host', { default: getDefaultCdnHost() })

const branches = getCdnBranches()
const domains = getCdnDomains()
</script>

<template>
  <ElSpace wrap class="cdn-source-picker">
    <ElText type="info">
      分支
    </ElText>
    <ElRadioGroup v-model="branch" size="small">
      <ElRadioButton v-for="item in branches" :key="item" :value="item">
        {{ item }}
      </ElRadioButton>
    </ElRadioGroup>
    <ElText type="info">
      CDN
    </ElText>
    <ElSelect v-model="host" size="small" class="cdn-source-picker__select">
      <ElOption
        v-for="domain in domains"
        :key="domain.host"
        :label="domain.label"
        :value="domain.host"
      />
    </ElSelect>
  </ElSpace>
</template>

<style scoped>
.cdn-source-picker__select {
  width: 160px;
}
</style>
