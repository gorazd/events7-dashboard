<template>
  <article class="events-list">
    <header class="events-list__header">
      <section class="events-list__summary">
        <p><strong>Total Events: {{ events.length }}</strong></p>
      </section>
      <nav class="events-list__actions">
        <button @click="openCreateForm" class="events-list__btn events-list__btn--create">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-circle" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
          </svg>
          Create New Event
        </button>
        <button @click="fetchEvents" :disabled="loading" class="events-list__btn events-list__btn--refresh">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-clockwise" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
          <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>
        </svg>
          {{ loading ? 'Loading...' : 'Refresh Events' }}
        </button>
      </nav>
    </header>
    

    <section class="events-list__content">
      <div v-if="loading" class="events-list__message events-list__message--loading">Loading events...</div>
      <div v-else-if="error" class="events-list__message events-list__message--error">Error: {{ error }}</div>
      <div v-else-if="events.length === 0" class="events-list__message events-list__message--empty">No events found</div>
      
      <section v-else class="events-list__grid">
        <h3 class="sr-only">Events List</h3>
        <!-- Grid Header -->
        <header class="events-list__item events-list__item--header">
          <span>ID</span>
          <span>Name</span>
          <span>Type</span>
          <span>Description</span>
          <span>Priority</span>
          <span>Created</span>
          <span>Last Updated</span>
          <span>Actions</span>
        </header>
        <!-- Event Rows -->
        <article 
          v-for="event in events" 
          :key="event.id" 
          class="events-list__item"
          :class="`events-list__item--${event.type}`"
          tabindex="0"
          @keydown="handleEventCardKeydown($event, event)"
        >
          <span class="events-list__cell events-list__cell--id">{{ event.id }}</span>
          <header class="events-list__cell events-list__cell--name">
            <h4 class="events-list__title">{{ event.name }}</h4>
          </header>
          <span class="events-list__cell events-list__cell--type">{{ event.type }}</span>
          
          <p class="events-list__cell events-list__cell--description">{{ event.description }}</p>
          
          <footer class="events-list__cell events-list__cell--priority">
            <span class="events-list__priority-label">{{ event.priority }}</span>
          </footer>
          <time class="events-list__cell events-list__cell--created">{{ formatDate(event.createdAt) }}</time>
          <time class="events-list__cell events-list__cell--updated">{{ formatDate(event.updatedAt) }}</time>

          <nav class="events-list__cell events-list__cell--actions">
            <button 
              @click="openEditForm(event)" 
              @keydown="handleButtonKeydown"
              class="events-list__action-btn events-list__action-btn--edit"
              :aria-label="`Edit event ${event.name}`"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
              </svg>
            </button>
            <button 
              @click="deleteEvent(event.id)" 
              @keydown="handleButtonKeydown"
              class="events-list__action-btn events-list__action-btn--delete"
              :aria-label="`Delete event ${event.name}`"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
                <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
              </svg>
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
  .events-list__item {
    display: grid;
    grid-template-columns: 1fr 3fr 100px 300px 1fr 3fr 3fr 2.5fr;
    align-items: baseline;
    gap: .5rem 2rem;
  }

  .events-list__item > *:last-child {
    justify-self: flex-end;
  }
  
  .events-list__item--header {
    font-weight: bold;
    font-size: .75em;
    text-transform: uppercase;
    background: #f5f5f5;
    border-bottom: 1px solid #ddd;
  }

  /* Keyboard focus styles */
  .events-list__item:focus {
    outline: 2px solid #646cff;
    outline-offset: 2px;
    background-color: #f8f9ff;
    border-radius: 4px;
  }

  .events-list__item:focus-visible {
    outline: 2px solid #646cff;
    outline-offset: 2px;
    background-color: #f8f9ff;
    border-radius: 4px;
  }

  /* Enhanced button styling for accessibility */
  .events-list__action-btn, .events-list__btn {
    padding: 8px 16px;
    margin: 4px;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .events-list__action-btn--edit:hover, .events-list__btn--create:hover {
    background-color: #e8f4fd;
    border-color: #0969da;
  }

  .events-list__action-btn--delete:hover {
    background-color: #ffebe9;
    border-color: #d73a49;
  }

  .events-list__btn--refresh:hover:not(:disabled) {
    background-color: #f6f8fa;
    border-color: #656d76;
  }

  .events-list__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .events-list__actions,
  .events-list__cell--actions {
    display: flex;
    gap: .5rem;
    flex-flow: wrap;
    justify-content: flex-end;
    align-items: stretch;
  }
  .events-list__cell--created,
  .events-list__cell--updated,
  .events-list__cell--type {
    font-size: .85em;
  }
  button {
    display: flex;
    align-items: center;
    flex-flow: wrap;
    gap: .5rem;
  }

</style>