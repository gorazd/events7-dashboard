<template>
  <div class="events-container">
    <h2>Events Dashboard</h2>
    
    <div class="actions">
      <button @click="fetchEvents" :disabled="loading" class="refresh-btn">
        {{ loading ? 'Loading...' : 'Refresh Events' }}
      </button>
    </div>

    <div v-if="loading" class="loading">Loading events...</div>
    <div v-else-if="error" class="error">Error: {{ error }}</div>
    <div v-else-if="events.length === 0" class="empty">No events found</div>
    
    <div v-else class="events-grid">
      <div 
        v-for="event in events" 
        :key="event.id" 
        class="event-card"
        :class="`event-${event.type}`"
      >
        <div class="event-header">
          <span class="event-id">{{ event.id }}</span>
          <h3>{{ event.name }}</h3>
          <span class="event-type">{{ event.type }}</span>
        </div>
        
        <p class="event-description">{{ event.description }}</p>
        
        <div class="event-footer">
          <span class="priority">Priority: {{ event.priority }}</span>
          <span class="created">{{ formatDate(event.createdAt) }}</span>
        </div>
        
        <div class="event-actions">
          <button @click="deleteEvent(event.id)" class="delete-btn">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Event {
  id: number
  name: string
  description: string
  type: 'crosspromo' | 'liveops' | 'app' | 'ads'
  priority: number
  createdAt: string
  updatedAt: string
}

const events = ref<Event[]>([])
const loading = ref(false)
const error = ref('')

const fetchEvents = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await fetch('http://localhost:3001/events')
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    events.value = data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error occurred'
    console.error('Failed to fetch events:', err)
  } finally {
    loading.value = false
  }
}

const deleteEvent = async (id: number) => {
  if (!confirm('Are you sure you want to delete this event?')) {
    return
  }

  try {
    const response = await fetch(`http://localhost:3001/events/${id}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    // Remove from local array
    events.value = events.value.filter(event => event.id !== id)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete event'
    console.error('Failed to delete event:', err)
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Fetch events when component mounts
onMounted(() => {
  fetchEvents()
})
</script>

<style scoped>

</style>