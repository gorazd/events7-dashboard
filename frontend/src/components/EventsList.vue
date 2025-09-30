<template>
  <div class="events-container">
    <h2>Events Dashboard</h2>
    <div>
      <strong>Total Events: {{ events.length }}</strong>
    </div>
    
    <div class="actions">
      <button @click="openCreateForm" class="create-btn">
        Create New Event
      </button>
      <button @click="fetchEvents" :disabled="loading" class="refresh-btn">
        {{ loading ? 'Loading...' : 'Refresh Events' }}
      </button>
    </div>

    <div v-if="loading" class="loading">Loading events...</div>
    <div v-else-if="error" class="error">Error: {{ error }}</div>
    <div v-else-if="events.length === 0" class="empty">No events found</div>
    
    <div v-else class="events-grid">
      <!-- Grid Header -->
      <div class="event-card event-header-row">
        <span class="event-id"><strong>ID</strong></span>
        <div class="event-header"><strong>Name</strong></div>
        <span class="event-type"><strong>Type</strong></span>
        <p class="event-description"><strong>Description</strong></p>
        <div class="event-footer"><strong>Priority</strong></div>
        <span class="created"><strong>Created</strong></span>
        <span class="created"><strong>Last Updated</strong></span>
        <div class="event-actions"><strong>Actions</strong></div>
      </div>
      <!-- Event Rows -->
      <div 
        v-for="event in events" 
        :key="event.id" 
        class="event-card"
        :class="`event-${event.type}`"
      >
      <span class="event-id">{{ event.id }}</span>
        <div class="event-header">
          <h3>{{ event.name }}</h3>
        </div>
        <span class="event-type">{{ event.type }}</span>
        
        <p class="event-description">{{ event.description }}</p>
        
        <div class="event-footer">
          <span class="priority">{{ event.priority }}</span>
        </div>
        <span class="created">{{ formatDate(event.createdAt) }}</span>
        <span class="updated">{{ formatDate(event.updatedAt) }}</span>

        <div class="event-actions">
          <button @click="openEditForm(event)" class="edit-btn">
            Edit
          </button>
          <button @click="deleteEvent(event.id)" class="delete-btn">
            Delete
          </button>
        </div>
      </div>
    </div>
  <!-- Event Form Modal -->
  <EventsForm
    v-if="showForm"
    :event="selectedEvent"
    :is-open="showForm"
    @close="closeForm"
    @save="handleEventSave"
  />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import EventsForm from './EventsForm.vue'
import { EventsApi, type Event } from '../services/api'

const events = ref<Event[]>([])
const loading = ref(false)
const error = ref('')
const showForm = ref(false)
const selectedEvent = ref<Event | null>(null)

const fetchEvents = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const data = await EventsApi.fetchEvents()
    events.value = data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error occurred'
    console.error('Failed to fetch events:', err)
  } finally {
    loading.value = false
  }
}

const openCreateForm = () => {
  selectedEvent.value = null
  showForm.value = true
}

const openEditForm = (event: Event) => {
  selectedEvent.value = event
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  selectedEvent.value = null
}

const handleEventSave = (savedEvent: Event) => {
  if (selectedEvent.value) {
    // Update existing event
    const index = events.value.findIndex(e => e.id === savedEvent.id)
    if (index !== -1) {
      events.value[index] = savedEvent
    }
  } else {
    // Add new event
    events.value.unshift(savedEvent)
  }
  closeForm()
}

const deleteEvent = async (id: number) => {
  if (!confirm('Are you sure you want to delete this event?')) {
    return
  }

  try {
    await EventsApi.deleteEvent(id)
    // Remove from local array
    events.value = events.value.filter(event => event.id !== id)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete event'
    console.error('Failed to delete event:', err)
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-UK', {
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
  .event-card {
    display: grid;
    grid-template-columns: 1fr 3fr 1fr 4fr 1fr 1fr 2fr 2fr;
    align-items: baseline;
  }
  .event-header-row {
    font-weight: bold;
    font-size: .75em;
    text-transform: uppercase;
    background: #f5f5f5;
    border-bottom: 1px solid #ddd;
  }
</style>