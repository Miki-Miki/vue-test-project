<script setup lang="ts">
import { computed } from 'vue'
import { SearchMode } from '@/types/search'
import type { SearchResult } from '@/types/search'

const props = defineProps<{
  result: SearchResult
}>()

const emit = defineEmits<{
  close: []
  commandSelect: [mode: SearchMode, value: string]
}>()

const joinArray = (val?: string[]) => (val && val.length ? val.join(', ') : '—')

const titleParts = computed(() => {
  const [first, ...rest] = props.result.title.split(' - ')
  return rest.length
    ? { artist: first, releaseTitle: rest.join(' - ') }
    : { artist: '', releaseTitle: first }
})

const artist = computed(() => titleParts.value.artist)
const releaseTitle = computed(() => titleParts.value.releaseTitle)

const genreTags = computed(() => props.result.genre ?? [])
const styleTags = computed(() => props.result.style ?? [])

const fields = computed(() => [
  { label: 'Year', value: props.result.year ?? '—' },
  { label: 'Format', value: joinArray(props.result.format) },
  { label: 'Label', value: joinArray(props.result.label) },
  { label: 'Catalog #', value: props.result.catno ?? '—' },
  { label: 'Country', value: props.result.country ?? '—' },
])

const resultUrl = computed(() =>
  props.result.uri.startsWith('http')
    ? props.result.uri
    : `https://www.discogs.com${props.result.uri}`,
)
</script>

<template>
  <Transition name="detail-panel-slide" appear>
    <aside class="detail-panel" role="dialog" aria-label="Release detail">
      <header class="detail-panel-header">
        <span class="detail-panel-header-label">Release Detail</span>
        <button type="button" class="detail-panel-close" aria-label="Close" @click="emit('close')">
          ✕
        </button>
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

        <div v-if="genreTags.length || styleTags.length" class="detail-panel-tags">
          <button
            v-for="tag in genreTags"
            :key="`g-${tag}`"
            type="button"
            class="detail-panel-tags-tag detail-panel-tags-tag-clickable"
            :title="`Search ${tag}`"
            @click="emit('commandSelect', SearchMode.Genre, tag)"
          >
            {{ tag }}
          </button>
          <button
            v-for="tag in styleTags"
            :key="`s-${tag}`"
            type="button"
            class="detail-panel-tags-tag detail-panel-tags-tag-clickable"
            :title="`Search ${tag}`"
            @click="emit('commandSelect', SearchMode.Style, tag)"
          >
            {{ tag }}
          </button>
        </div>

        <dl class="detail-panel-fields">
          <div v-for="field in fields" :key="field.label" class="detail-panel-fields-field">
            <dt class="detail-panel-fields-field-label">{{ field.label }}</dt>
            <dd class="detail-panel-fields-field-value">{{ field.value }}</dd>
          </div>
        </dl>
      </div>

      <footer class="detail-panel-footer">
        <a :href="resultUrl" target="_blank" rel="noopener noreferrer" class="btn"
          >View on Discogs</a
        >
        <button type="button" class="btn btn--primary">Add to collection</button>
      </footer>
    </aside>
  </Transition>
</template>

<style scoped src="./DetailPanel.scss" lang="scss"></style>
