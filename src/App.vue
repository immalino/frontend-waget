<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from './components/AppLayout.vue'

const route = useRoute()
const isPublic = computed(() => route.meta.public)
</script>

<template>
  <!-- Login (and any future public pages) render without the sidebar shell -->
  <RouterView v-if="isPublic" />
  <!-- Authenticated pages render inside the sidebar layout -->
  <AppLayout v-else />
</template>
