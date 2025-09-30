import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EventForm from './EventsForm.vue';
import type { Event } from '../types/events';

// Mock the API services
vi.mock('../services/api', () => ({
  GeolocationApi: {
    getUserCountry: vi.fn().mockResolvedValue('US'),
  },
  AdsPermissionApi: {
    checkPermission: vi.fn().mockResolvedValue(true),
  },
}));

import { GeolocationApi, AdsPermissionApi } from '../services/api';

describe('EventForm', () => {
  const mockEvent: Event = {
    id: 1,
    name: 'test-event',
    description: 'Test description',
    type: 'liveops',
    priority: 5,
    createdAt: '2023-01-01T10:00:00Z',
    updatedAt: '2023-01-01T11:00:00Z',
  };

  beforeEach(() => {
    vi.resetAllMocks();
    // Set up default mock return values
    vi.mocked(GeolocationApi.getUserCountry).mockResolvedValue('US');
    vi.mocked(AdsPermissionApi.checkPermission).mockResolvedValue(true);
  });

  it('renders properly', async () => {
    const wrapper = mount(EventForm, {
      props: {
        isOpen: true,
      },
    });

    expect(wrapper.find('form').exists()).toBe(true);
    expect(wrapper.find('input[id="name"]').exists()).toBe(true);
    expect(wrapper.find('textarea[id="description"]').exists()).toBe(true);
    expect(wrapper.find('input[name="eventType"]').exists()).toBe(true);
  });

  it('initializes with default values for new event', async () => {
    const wrapper = mount(EventForm, {
      props: {
        isOpen: true,
      },
    });
    await wrapper.vm.$nextTick();
    
    const nameInput = wrapper.find('input[id="name"]').element as HTMLInputElement;
    const descriptionTextarea = wrapper.find('textarea[id="description"]').element as HTMLTextAreaElement;

    expect(nameInput.value).toBe('');
    expect(descriptionTextarea.value).toBe('');
  });

  it('initializes with event data for editing', async () => {
    const wrapper = mount(EventForm, {
      props: {
        event: mockEvent,
        isOpen: true,
      },
    });
    await wrapper.vm.$nextTick();

    const nameInput = wrapper.find('input[id="name"]').element as HTMLInputElement;
    const descriptionTextarea = wrapper.find('textarea[id="description"]').element as HTMLTextAreaElement;

    expect(nameInput.value).toBe('test-event');
    expect(descriptionTextarea.value).toBe('Test description');
  });

  it('calls API services on mount', async () => {
    mount(EventForm, {
      props: {
        isOpen: true,
      },
    });

    // Wait for the onMounted lifecycle to complete
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(GeolocationApi.getUserCountry).toHaveBeenCalled();
    expect(AdsPermissionApi.checkPermission).toHaveBeenCalledWith('US');
  });
});