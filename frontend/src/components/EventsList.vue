<template>
  <article class="events-container">
    <header class="events-header">
      <h2>Events Management</h2>
      <section class="events-summary">
        <p><strong>Total Events: {{ events.length }}</strong></p>
      </section>
    </header>
    
    <nav class="actions">
      <button @click="openCreateForm" class="create-btn">
        Create New Event
      </button>
      <button @click="fetchEvents" :disabled="loading" class="refresh-btn">
        {{ loading ? 'Loading...' : 'Refresh Events' }}
      </button>
    </nav>

    <section class="events-content">
      <div v-if="loading" class="loading">Loading events...</div>
      <div v-else-if="error" class="error">Error: {{ error }}</div>
      <div v-else-if="events.length === 0" class="empty">No events found</div>
      
      <section v-else class="events-grid">
        <h3 class="sr-only">Events List</h3>
        <!-- Grid Header -->
        <header class="event-card event-header-row">
          <span class="event-id"><strong>ID</strong></span>
          <span class="event-header"><strong>Name</strong></span>
          <span class="event-type"><strong>Type</strong></span>
          <span class="event-description"><strong>Description</strong></span>
          <span class="event-footer"><strong>Priority</strong></span>
          <span class="created"><strong>Created</strong></span>
          <span class="created"><strong>Last Updated</strong></span>
          <span class="event-actions"><strong>Actions</strong></span>
        </header>
        <!-- Event Rows -->
        <article 
          v-for="event in events" 
          :key="event.id" 
          class="event-card"
          :class="`event-${event.type}`"
          tabindex="0"
          @keydown="handleEventCardKeydown($event, event)"
        >
          <span class="event-id">{{ event.id }}</span>
          <header class="event-header">
            <h4>{{ event.name }}</h4>
          </header>
          <span class="event-type">{{ event.type }}</span>
          
          <p class="event-description">{{ event.description }}</p>
          
          <footer class="event-footer">
            <span class="priority">Priority: {{ event.priority }}</span>
          </footer>
          <time class="created">{{ formatDate(event.createdAt) }}</time>
          <time class="updated">{{ formatDate(event.updatedAt) }}</time>

          <nav class="event-actions">
            <button 
              @click="openEditForm(event)" 
              @keydown="handleButtonKeydown"
              class="edit-btn"
              :aria-label="`Edit event ${event.name}`"
            >
              Edit
            </button>
            <button 
              @click="deleteEvent(event.id)" 
              @keydown="handleButtonKeydown"
              class="delete-btn"
              :aria-label="`Delete event ${event.name}`"
            >
              Delete
            </button>
          </nav>
        </article>
      </section>
    </section>
  
    <!-- Event Form Modal -->
    <EventsForm
      v-if="showForm"
      :event="selectedEvent"
      :is-open="showForm"
      @close="closeForm"
      @save="handleEventSave"
    />
  </article>
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

// Keyboard navigation handlers
const handleEventCardKeydown = (event: KeyboardEvent, eventData: Event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    openEditForm(eventData)
  }
}

const handleButtonKeydown = (event: KeyboardEvent) => {
  // Allow default button behavior for Enter and Space
  if (event.key === 'Enter' || event.key === ' ') {
    // Let the click handler handle the action
    return
  }
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

  /* Keyboard focus styles */
  .event-card:focus {
    outline: 2px solid #646cff;
    outline-offset: 2px;
    background-color: #f8f9ff;
    border-radius: 4px;
  }

  .event-card:focus-visible {
    outline: 2px solid #646cff;
    outline-offset: 2px;
    background-color: #f8f9ff;
    border-radius: 4px;
  }

  /* Enhanced button styling for accessibility */
  .edit-btn, .delete-btn, .create-btn, .refresh-btn {
    padding: 8px 16px;
    margin: 4px;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .edit-btn:hover, .create-btn:hover {
    background-color: #e8f4fd;
    border-color: #0969da;
  }

  .delete-btn:hover {
    background-color: #ffebe9;
    border-color: #d73a49;
  }

  .refresh-btn:hover:not(:disabled) {
    background-color: #f6f8fa;
    border-color: #656d76;
  }
</style>