<script setup lang="ts">
import { useDiscogsAuth } from '@/composables/useDiscogsAuth'

const { login } = useDiscogsAuth()
</script>

<template>
  <div class="auth-prompt">
    <p>Connect your Discogs account to search the database.</p>
    <button @click="login">Connect to Discogs</button>
  </div>
</template>

<style scoped src="./AuthPrompt.scss" lang="scss"></style>
