<script setup lang="ts">
import type { DiscogsResult } from '@/stores/discogs'

defineProps<{
  result: DiscogsResult
}>()

const joinArray = (val?: string[]) => (val && val.length ? val.join(', ') : '—')
</script>

<template>
  <div class="detail-panel">
    <div class="detail-thumb">
      <img v-if="result.thumb" :src="result.thumb" :alt="result.title" />
      <div v-else class="no-image">No image available</div>
    </div>

    <dl class="detail-fields">
      <div class="detail-row">
        <dt>Format</dt>
        <dd>{{ joinArray(result.format) }}</dd>
      </div>
      <div class="detail-row">
        <dt>Label</dt>
        <dd>{{ joinArray(result.label) }}</dd>
      </div>
      <div class="detail-row">
        <dt>Cat No.</dt>
        <dd>{{ result.catno ?? '—' }}</dd>
      </div>
      <div class="detail-row">
        <dt>Want</dt>
        <dd>{{ result.community?.want ?? '—' }}</dd>
      </div>
      <div class="detail-row">
        <dt>Have</dt>
        <dd>{{ result.community?.have ?? '—' }}</dd>
      </div>
    </dl>
  </div>
</template>

<style scoped>
.detail-panel {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.75rem 1rem;
  flex-shrink: 0;
  border-top: 1px solid var(--color-border);
}

.detail-thumb {
  flex-shrink: 0;
  width: 90px;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.no-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 11px;
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}

.detail-fields {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 0;
}

.detail-row {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

dt {
  flex-shrink: 0;
  min-width: 60px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
}

dd {
  margin: 0;
  font-size: 13px;
  color: var(--color-text);
}
</style>
