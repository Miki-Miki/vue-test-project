<script setup lang="ts">
const props = defineProps<{
  class?: string
}>()

const suggestions: string[] = ['/genre Electronic', '/style "Tech House"', '/artist Aphex Twin']
</script>

<template>
  <div :class="['suggestion-picker', props.class]">
    <button
      v-for="suggestion in suggestions"
      :key="suggestion"
      type="button"
      class="btn suggestion-picker-option"
    >
      {{ suggestion }}
    </button>
  </div>
</template>

<style scoped src="./SuggestionPicker.scss" lang="scss"></style>
