<template>
  <div class="nest-component">
    <h1>{{ title }}</h1>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">Error: {{ error }}</div>
    <div v-else class="message">{{ message }}</div>
    <button @click="fetchHelloWorld" :disabled="loading">
      {{ loading ? 'Loading...' : 'Fetch Hello World from NestJS' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const title = ref('NestJS Backend Connection')
const message = ref('')
const loading = ref(false)
const error = ref('')

const fetchHelloWorld = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await fetch('http://localhost:3001/')
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.text()
    message.value = data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error occurred'
    console.error('Failed to fetch hello world:', err)
  } finally {
    loading.value = false
  }
}

// Automatically fetch on component mount
onMounted(() => {
  fetchHelloWorld()
})
</script>

<style scoped>

</style>