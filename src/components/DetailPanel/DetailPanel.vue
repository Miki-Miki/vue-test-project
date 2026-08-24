<script setup lang="ts">
import { computed } from 'vue'
import type { DiscogsResult } from '@/stores/discogs'

const props = defineProps<{
  result: DiscogsResult
}>()

const emit = defineEmits<{
  close: []
}>()

const joinArray = (val?: string[]) => (val && val.length ? val.join(', ') : '—')

const titleParts = computed(() => {
  const [first, ...rest] = props.result.title.split(' - ')
  return rest.length ? { artist: first, releaseTitle: rest.join(' - ') } : { artist: '', releaseTitle: first }
})

const artist = computed(() => titleParts.value.artist)
const releaseTitle = computed(() => titleParts.value.releaseTitle)

const tags = computed(() => [...(props.result.genre ?? []), ...(props.result.style ?? [])])

const fields = computed(() => [
  { label: 'Year', value: props.result.year ?? '—' },
  { label: 'Format', value: joinArray(props.result.format) },
  { label: 'Label', value: joinArray(props.result.label) },
  { label: 'Catalog #', value: props.result.catno ?? '—' },
  { label: 'Country', value: props.result.country ?? '—' },
])

const discogsUrl = computed(() =>
  props.result.uri.startsWith('http') ? props.result.uri : `https://www.discogs.com${props.result.uri}`,
)
</script>

<template>
  <Transition name="detail-panel-slide" appear>
    <aside class="detail-panel" role="dialog" aria-label="Release detail">
      <header class="detail-panel-header">
        <span class="detail-panel-header-label">Release Detail</span>
        <button type="button" class="detail-panel-close" aria-label="Close" @click="emit('close')">✕</button>
      </header>

      <div class="detail-panel-body">
        <div class="detail-panel-thumb">
          <img
            v-if="result.thumb"
            class="detail-panel-thumb-image"
            :src="result.thumb"
            :alt="result.title"
          />
          <div v-else class="detail-panel-thumb-empty">♫</div>
        </div>

        <h2 class="detail-panel-title">{{ releaseTitle }}</h2>
        <p v-if="artist" class="detail-panel-artist">{{ artist }}</p>

        <div v-if="tags.length" class="detail-panel-tags">
          <span v-for="tag in tags" :key="tag" class="detail-panel-tags-tag">{{ tag }}</span>
        </div>

        <dl class="detail-panel-fields">
          <div v-for="field in fields" :key="field.label" class="detail-panel-fields-field">
            <dt class="detail-panel-fields-field-label">{{ field.label }}</dt>
            <dd class="detail-panel-fields-field-value">{{ field.value }}</dd>
          </div>
        </dl>
      </div>

      <footer class="detail-panel-footer">
        <a :href="discogsUrl" target="_blank" rel="noopener noreferrer" class="btn">View on Discogs</a>
        <button type="button" class="btn btn--primary">Add to collection</button>
      </footer>
    </aside>
  </Transition>
</template>

<style scoped src="./DetailPanel.scss" lang="scss"></style>
