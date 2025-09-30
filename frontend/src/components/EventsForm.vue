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
          <label class="form-label">Event Type *</label>
          <div class="radio-group">
            <div class="radio-option">
              <input
                id="type-crosspromo"
                v-model="formData.type"
                type="radio"
                :value="EVENT_TYPES.CROSSPROMO"
                name="eventType"
                class="radio-input"
                required
              />
              <label for="type-crosspromo" class="radio-label">
                <span class="radio-custom"></span>
                <span class="radio-text">Cross Promo</span>
              </label>
            </div>
        
            <div class="radio-option">
              <input
                id="type-liveops"
                v-model="formData.type"
                type="radio"
                :value="EVENT_TYPES.LIVEOPS"
                name="eventType"
                class="radio-input"
              />
              <label for="type-liveops" class="radio-label">
                <span class="radio-custom"></span>
                <span class="radio-text">Live Ops</span>
              </label>
            </div>
        
            <div class="radio-option">
              <input
                id="type-app"
                v-model="formData.type"
                type="radio"
                :value="EVENT_TYPES.APP"
                name="eventType"
                class="radio-input"
              />
              <label for="type-app" class="radio-label">
                <span class="radio-custom"></span>
                <span class="radio-text">App</span>
              </label>
            </div>
        
            <div class="radio-option" :class="{ 'disabled': !adsTypeAllowed }">
              <input
                id="type-ads"
                v-model="formData.type"
                type="radio"
                :value="EVENT_TYPES.ADS"
                name="eventType"
                class="radio-input"
                :disabled="!adsTypeAllowed"
              />
              <label for="type-ads" class="radio-label" :class="{ 'disabled': !adsTypeAllowed }">
                <span class="radio-custom"></span>
                <span class="radio-text">
                  Ads
                  <small v-if="!adsTypeAllowed" class="permission-note">
                    (Not available in your region)
                  </small>
                </span>
              </label>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="priority">Priority *</label>
          <input
            id="priority"
            v-model.number="formData.priority"
            type="number"
            required
            min="0"
            max="10"
            placeholder="0-10"
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
import { ref, reactive, watch, onMounted } from 'vue'
import { GeolocationApi, AdsPermissionApi } from '../services/api'
import type { Event, EventType } from '../types/events'
import { EVENT_TYPES } from '../types/events'

interface FormData {
  id?: number
  name: string
  description: string
  type: EventType | ''
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
const adsTypeAllowed = ref(false)

const formData = reactive<FormData>({
  name: '',
  description: '',
  type: '',
  priority: 1
})

const isEditing = ref(false)

// Check ads permission on component mount
onMounted(async () => {
  try {
    const countryCode = await GeolocationApi.getUserCountry()
    console.log('User country:', countryCode)
    adsTypeAllowed.value = await AdsPermissionApi.checkPermission(countryCode)
    console.log('Ads allowed:', adsTypeAllowed.value)
  } catch (error) {
    console.error('Failed to check ads permission:', error)
    adsTypeAllowed.value = true
  }
})

// Define resetForm before the watch function
const resetForm = () => {
  formData.id = undefined
  formData.name = ''
  formData.description = ''
  formData.type = ''
  formData.priority = 0
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

  // Validate ads permission if ads type is selected
  if (formData.type === EVENT_TYPES.ADS && !adsTypeAllowed.value) {
    error.value = 'Ads events are not allowed in your region'
    loading.value = false
    return
  }

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
.event-form-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.event-form {
  position: relative;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  margin: 20px;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}

.form-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #000;
}

form {
  padding: 0 20px 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label,
.form-label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
}

.form-label {
  margin-bottom: 10px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #42b883;
  box-shadow: 0 0 0 2px rgba(66, 184, 131, 0.2);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-hint {
  display: block;
  margin-top: 4px;
  font-size: 0.8em;
  color: #666;
  font-style: italic;
}

.radio-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.radio-option {
  display: flex;
  align-items: center;
}

.radio-option.disabled {
  opacity: 0.5;
}

.radio-input {
  display: none;
}

.radio-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 10px;
  border: 2px solid #ddd;
  border-radius: 6px;
  transition: all 0.2s ease;
  width: 100%;
  background: #fff;
}

.radio-label:hover {
  border-color: #42b883;
  background: #f8fffe;
}

.radio-label.disabled {
  cursor: not-allowed;
  color: #999;
}

.radio-label.disabled:hover {
  border-color: #ddd;
  background: #fff;
}

.radio-input:checked + .radio-label {
  border-color: #42b883;
  background: #e8f5e8;
  color: #2c5530;
}

.radio-custom {
  width: 16px;
  height: 16px;
  border: 2px solid #ddd;
  border-radius: 50%;
  margin-right: 10px;
  position: relative;
  transition: all 0.2s ease;
}

.radio-input:checked + .radio-label .radio-custom {
  border-color: #42b883;
  background: #42b883;
}

.radio-input:checked + .radio-label .radio-custom::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: white;
}

.radio-text {
  font-weight: 500;
  font-size: 14px;
}

.permission-note {
  display: block;
  font-size: 0.75em;
  color: #999;
  font-style: italic;
  margin-top: 2px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 30px;
}

.cancel-btn,
.submit-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn:hover {
  background: #e5e5e5;
}

.submit-btn {
  background: #42b883;
  color: white;
}

.submit-btn:hover:not(:disabled) {
  background: #369870;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message {
  margin-top: 15px;
  padding: 10px;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  color: #c33;
  font-size: 14px;
}

/* Responsive: Stack vertically on smaller screens */
@media (max-width: 480px) {
  .radio-group {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>