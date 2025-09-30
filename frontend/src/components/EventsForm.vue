<template>
  <div class="event-form-container">
    <div class="form-overlay" @click="closeForm"></div>
    <div class="event-form">
      <div class="form-header">
        <h3>{{ isEditing ? 'Edit Event' : 'Create New Event' }}</h3>
        <button @click="closeForm" class="close-btn">&times;</button>
      </div>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="name">Event Name *</label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            required
            placeholder="Enter event name"
            class="form-input"
          />
          <small class="form-hint">Will be saved as: {{ toKebabCase(formData.name) }}</small>
        </div>

        <div class="form-group">
          <label for="description">Description *</label>
          <textarea
            id="description"
            v-model="formData.description"
            required
            placeholder="Enter event description"
            class="form-textarea"
            rows="3"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="type">Event Type *</label>
          <select
            id="type"
            v-model="formData.type"
            required
            class="form-select"
          >
            <option value="">Select event type</option>
            <option value="crosspromo">Cross Promo</option>
            <option value="liveops">Live Ops</option>
            <option value="app">App</option>
            <option value="ads">Ads</option>
          </select>
        </div>

        <div class="form-group">
          <label for="priority">Priority *</label>
          <input
            id="priority"
            v-model.number="formData.priority"
            type="number"
            required
            min="1"
            max="10"
            placeholder="1-10"
            class="form-input"
          />
        </div>

        <div class="form-actions">
          <button type="button" @click="closeForm" class="cancel-btn">
            Cancel
          </button>
          <button type="submit" :disabled="loading" class="submit-btn">
            {{ loading ? 'Saving...' : (isEditing ? 'Update Event' : 'Create Event') }}
          </button>
        </div>
      </form>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'

interface Event {
  id: number
  name: string
  description: string
  type: 'crosspromo' | 'liveops' | 'app' | 'ads'
  priority: number
  createdAt: string
  updatedAt: string
}

interface FormData {
  id?: number
  name: string
  description: string
  type: 'crosspromo' | 'liveops' | 'app' | 'ads' | ''
  priority: number
}

interface Props {
  event?: Event | null
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'save', event: Event): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const loading = ref(false)
const error = ref('')

const formData = reactive<FormData>({
  name: '',
  description: '',
  type: '',
  priority: 1
})

const isEditing = ref(false)

// Define resetForm before the watch function
const resetForm = () => {
  formData.id = undefined
  formData.name = ''
  formData.description = ''
  formData.type = ''
  formData.priority = 1
  error.value = ''
}

// Watch for prop changes to populate form
watch(() => props.event, (newEvent) => {
  if (newEvent) {
    isEditing.value = true
    formData.id = newEvent.id
    formData.name = newEvent.name
    formData.description = newEvent.description
    formData.type = newEvent.type
    formData.priority = newEvent.priority
  } else {
    isEditing.value = false
    resetForm()
  }
}, { immediate: true })

const closeForm = () => {
  resetForm()
  emit('close')
}

const toKebabCase = (str: string): string => {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

const handleSubmit = async () => {
  loading.value = true
  error.value = ''

  try {
    const url = isEditing.value 
      ? `http://localhost:3001/events/${formData.id}`
      : 'http://localhost:3001/events'
    
    const method = isEditing.value ? 'PATCH' : 'POST'
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: toKebabCase(formData.name),
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const savedEvent: Event = await response.json()
    emit('save', savedEvent)
    closeForm()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to save event'
    console.error('Failed to save event:', err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
</style>