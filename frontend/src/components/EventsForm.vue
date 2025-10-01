<template>
  <section 
    class="event-form" 
    role="dialog" 
    aria-modal="true" 
    aria-labelledby="form-title"
    @keydown="handleFormKeydown"
  >
    <div class="event-form__overlay" @click="closeForm"></div>
    <article class="event-form__container">
      <header class="event-form__header">
        <h3 id="form-title" class="event-form__title">{{ isEditing ? 'Edit Event' : 'Create New Event' }}</h3>
        <button @click="closeForm" class="event-form__close-btn" aria-label="Close form">&times;</button>
      </header>
      
      <form @submit.prevent="handleSubmit" @keydown="handleFormKeydown">
        <div class="event-form__group">
          <label for="name" class="event-form__label">
            Event Name 
            <span class="event-form__required" aria-label="required">*</span>
          </label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            required
            placeholder="Enter event name"
            class="event-form__input"
            :class="{ 'event-form__input--error': fieldErrors.name }"
            :aria-invalid="!!fieldErrors.name"
            :aria-describedby="fieldErrors.name ? 'name-error' : 'name-hint'"
          />
          <small id="name-hint" class="event-form__hint">Will be saved as: {{ toKebabCase(formData.name) }}</small>
          <div v-if="fieldErrors.name" id="name-error" class="event-form__error" role="alert">
            {{ fieldErrors.name }}
          </div>
        </div>

        <div class="event-form__group">
          <label for="description" class="event-form__label">
            Description 
            <span class="event-form__required" aria-label="required">*</span>
          </label>
          <textarea
            id="description"
            v-model="formData.description"
            required
            placeholder="Enter event description"
            class="event-form__textarea"
            rows="3"
            :class="{ 'event-form__textarea--error': fieldErrors.description }"
            :aria-invalid="!!fieldErrors.description"
            :aria-describedby="fieldErrors.description ? 'description-error' : undefined"
          ></textarea>
          <div v-if="fieldErrors.description" id="description-error" class="event-form__error" role="alert">
            {{ fieldErrors.description }}
          </div>
        </div>

        <div class="event-form__group">
          <fieldset class="event-form__fieldset">
            <legend class="event-form__label">
              Event Type 
              <span class="event-form__required" aria-label="required">*</span>
            </legend>
            <div class="event-form__radio-group" :aria-describedby="fieldErrors.type ? 'type-error' : undefined">
            <div class="event-form__radio-option">
              <input
                id="type-crosspromo"
                v-model="formData.type"
                type="radio"
                :value="EVENT_TYPES.CROSSPROMO"
                name="eventType"
                class="event-form__radio-input"
                required
                :aria-invalid="!!fieldErrors.type"
              />
              <label for="type-crosspromo" class="event-form__radio-label">
                <span class="event-form__radio-custom"></span>
                <span class="event-form__radio-text">Cross Promo</span>
              </label>
            </div>
        
            <div class="event-form__radio-option">
              <input
                id="type-liveops"
                v-model="formData.type"
                type="radio"
                :value="EVENT_TYPES.LIVEOPS"
                name="eventType"
                class="event-form__radio-input"
                :aria-invalid="!!fieldErrors.type"
              />
              <label for="type-liveops" class="event-form__radio-label">
                <span class="event-form__radio-custom"></span>
                <span class="event-form__radio-text">Live Ops</span>
              </label>
            </div>
        
            <div class="event-form__radio-option">
              <input
                id="type-app"
                v-model="formData.type"
                type="radio"
                :value="EVENT_TYPES.APP"
                name="eventType"
                class="event-form__radio-input"
                :aria-invalid="!!fieldErrors.type"
              />
              <label for="type-app" class="event-form__radio-label">
                <span class="event-form__radio-custom"></span>
                <span class="event-form__radio-text">App</span>
              </label>
            </div>
        
            <div class="event-form__radio-option" :class="{ 'event-form__radio-option--disabled': !adsTypeAllowed }">
              <input
                id="type-ads"
                v-model="formData.type"
                type="radio"
                :value="EVENT_TYPES.ADS"
                name="eventType"
                class="event-form__radio-input"
                :disabled="!adsTypeAllowed"
                :aria-invalid="!!fieldErrors.type"
              />
              <label for="type-ads" class="event-form__radio-label" :class="{ 'event-form__radio-label--disabled': !adsTypeAllowed }">
                <span class="event-form__radio-custom"></span>
                <span class="event-form__radio-text">
                  Ads
                  <small v-if="!adsTypeAllowed" class="event-form__permission-note">
                    (Not available in your region)
                  </small>
                </span>
              </label>
            </div>
          </div>
            <div v-if="fieldErrors.type" id="type-error" class="event-form__error" role="alert">
              {{ fieldErrors.type }}
            </div>
          </fieldset>
        </div>

        <div class="event-form__group">
          <label for="priority" class="event-form__label">
            Priority 
            <span class="event-form__required" aria-label="required">*</span>
          </label>
          <input
            id="priority"
            v-model.number="formData.priority"
            type="number"
            required
            min="0"
            max="10"
            placeholder="0-10"
            class="event-form__input"
            :class="{ 'event-form__input--error': fieldErrors.priority }"
            :aria-invalid="!!fieldErrors.priority"
            :aria-describedby="fieldErrors.priority ? 'priority-error' : 'priority-hint'"
          />
          <small id="priority-hint" class="event-form__hint">Enter a value between 0-10</small>
          <div v-if="fieldErrors.priority" id="priority-error" class="event-form__error" role="alert">
            {{ fieldErrors.priority }}
          </div>
        </div>

        <div class="event-form__actions">
          <button type="button" @click="closeForm" class="event-form__btn event-form__btn--cancel">
            Cancel
          </button>
          <button type="submit" :disabled="loading" class="event-form__btn event-form__btn--submit">
            {{ loading ? 'Saving...' : (isEditing ? 'Update Event' : 'Create Event') }}
          </button>
        </div>
      </form>

      <footer v-if="error" class="event-form__footer-error">
        {{ error }}
      </footer>
    </article>
  </section>
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

// Form validation state
const fieldErrors = reactive({
  name: '',
  description: '',
  type: '',
  priority: ''
})

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

// Form validation function
const validateForm = () => {
  // Clear previous errors
  fieldErrors.name = ''
  fieldErrors.description = ''
  fieldErrors.type = ''
  fieldErrors.priority = ''
  
  let isValid = true
  
  // Validate name
  if (!formData.name.trim()) {
    fieldErrors.name = 'Event name is required'
    isValid = false
  } else if (formData.name.trim().length < 3) {
    fieldErrors.name = 'Event name must be at least 3 characters'
    isValid = false
  }
  
  // Validate description
  if (!formData.description.trim()) {
    fieldErrors.description = 'Description is required'
    isValid = false
  } else if (formData.description.trim().length < 10) {
    fieldErrors.description = 'Description must be at least 10 characters'
    isValid = false
  }
  
  // Validate type
  if (!formData.type) {
    fieldErrors.type = 'Event type is required'
    isValid = false
  }
  
  // Validate priority
  if (formData.priority < 0 || formData.priority > 10) {
    fieldErrors.priority = 'Priority must be between 0 and 10'
    isValid = false
  }
  
  return isValid
}

// Define resetForm before the watch function
const resetForm = () => {
  formData.id = undefined
  formData.name = ''
  formData.description = ''
  formData.type = ''
  formData.priority = 0
  error.value = ''
  // Clear field errors
  fieldErrors.name = ''
  fieldErrors.description = ''
  fieldErrors.type = ''
  fieldErrors.priority = ''
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
  // First validate the form
  if (!validateForm()) {
    return
  }

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

// Keyboard navigation handler
const handleFormKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeForm()
  }
  
  // Tab trapping for modal accessibility
  if (event.key === 'Tab') {
    const formElement = event.currentTarget as HTMLElement
    const focusableElements = formElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>
    
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    
    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement?.focus()
    }
    
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement?.focus()
    }
  }
}
</script>

<style scoped>
.event-form {
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

.event-form__overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.event-form__container {
  position: relative;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  margin: 20px;
}

.event-form__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}

.event-form__title {
  margin: 0;
  color: #333;
}

.event-form__close-btn {
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

.event-form__close-btn:hover {
  color: #000;
}

form {
  padding: 0 20px 20px;
}

.event-form__group {
  margin-bottom: 20px;
}

.event-form__label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
}

.event-form__input,
.event-form__textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
}

.event-form__input:focus,
.event-form__textarea:focus {
  outline: none;
  border-color: var(--color);
  box-shadow: 0 0 0 2px rgba(66, 184, 131, 0.2);
}

.event-form__textarea {
  resize: vertical;
  min-height: 80px;
}

.event-form__hint {
  display: block;
  margin-top: 4px;
  font-size: 0.8em;
  color: #666;
  font-style: italic;
}

.event-form__radio-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.event-form__radio-option {
  display: flex;
  align-items: center;
}

.event-form__radio-option--disabled {
  opacity: 0.5;
}

.event-form__radio-input {
  display: none;
}

.event-form__radio-label {
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

.event-form__radio-label:hover {
  border-color: var(--color);
  background: #f8fffe;
}

.event-form__radio-label--disabled {
  cursor: not-allowed;
  color: #999;
}

.event-form__radio-label--disabled:hover {
  border-color: #ddd;
  background: #fff;
}

.event-form__radio-input:checked + .event-form__radio-label {
  border-color: var(--color);
  background: #e8f5e8;
  color: #2c5530;
}

.event-form__radio-custom {
  width: 16px;
  height: 16px;
  border: 2px solid #ddd;
  border-radius: 50%;
  margin-right: 10px;
  position: relative;
  transition: all 0.2s ease;
}

.event-form__radio-input:checked + .event-form__radio-label .event-form__radio-custom {
  border-color: var(--color);
  background: var(--color);
}

.event-form__radio-input:checked + .event-form__radio-label .event-form__radio-custom::after {
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

.event-form__radio-text {
  font-weight: 500;
  font-size: 14px;
}

.event-form__permission-note {
  display: block;
  font-size: 0.75em;
  color: #999;
  font-style: italic;
  margin-top: 2px;
}

.event-form__actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 30px;
}

.event-form__btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.2s ease;
}

/* Enhanced focus styles for accessibility */
.event-form__btn:focus-visible,
.event-form__close-btn:focus-visible {
  outline: 2px solid #646cff;
  outline-offset: 2px;
}

.event-form__btn--cancel {
  background: #f5f5f5;
  color: #666;
}

.event-form__btn--cancel:hover {
  background: #e5e5e5;
}

.event-form__btn--submit {
  background: var(--color);
  color: white;
}

.event-form__btn--submit:hover:not(:disabled) {
  background: #369870;
}

.event-form__btn--submit:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* Form element focus styles */
.event-form__input:focus-visible,
.event-form__textarea:focus-visible {
  outline: 2px solid #646cff;
  outline-offset: 2px;
  border-color: #646cff;
}

.event-form__radio-input:focus-visible + .event-form__radio-label {
  outline: 2px solid #646cff;
  outline-offset: 2px;
  border-radius: 4px;
}

/* Required indicator styling */
.event-form__required {
  color: #d73a49;
  font-weight: bold;
  margin-left: 4px;
}

/* Form fieldset styling */
.event-form__fieldset {
  border: none;
  margin: 0;
  padding: 0;
}

.event-form__fieldset legend {
  font-weight: bold;
  margin-bottom: 10px;
  padding: 0;
}

/* Error states */
.event-form__input--error,
.event-form__textarea--error {
  border-color: #d73a49;
  background-color: #fff5f5;
}

.event-form__error {
  color: #d73a49;
  font-size: 0.875rem;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.event-form__error::before {
  content: "⚠";
  font-weight: bold;
}

.event-form__hint {
  color: #6a737d;
  font-size: 0.875rem;
  margin-top: 4px;
  display: block;
}

.event-form__footer-error {
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
  .event-form__radio-group {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>