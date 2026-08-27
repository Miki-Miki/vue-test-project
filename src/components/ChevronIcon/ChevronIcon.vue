<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number
    rotation?: number
  }>(),
  {
    size: 18,
    rotation: 0,
  },
)
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    :style="{ transform: `rotate(${rotation}deg)`, transition: 'transform 150ms' }"
  >
    <path d="M9 18l6-6-6-6" />
  </svg>
</template>
