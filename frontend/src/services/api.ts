const API_URL = 'http://localhost:3001';

export interface Event {
  id: number
  name: string
  description: string
  type: 'crosspromo' | 'liveops' | 'app' | 'ads'
  priority: number
  createdAt: string
  updatedAt: string
}

export const GeolocationApi = {
  async getUserCountry(): Promise<string> {
    try {
      const response = await fetch('http://ip-api.com/json/');
      if (!response.ok) {
        throw new Error('Failed to get location data');
      }
      const data = await response.json();
      return data.countryCode;
    } catch (error) {
      console.error('Error fetching user location:', error);
      throw new Error('Could not determine your location');
    }
  }
};

export const AdsPermissionApi = {
  async checkPermission(countryCode: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/ads-permission?countryCode=${countryCode}`);
      if (!response.ok) {
        throw new Error('Failed to check ads permission');
      }
      const data = await response.json();
      console.log('Permission data:', data);
      return data.ads === "sure, why not!";
    } catch (error) {
      console.error('Error checking ads permission:', error);
      throw new Error('Could not verify ads permission');
    }
  }
};

export const EventsApi = {
  async fetchEvents(): Promise<Event[]> {
    const response = await fetch(`${API_URL}/events`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  },

  async deleteEvent(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/events/${id}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
  },

  async createEvent(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    const response = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  },

  async updateEvent(id: number, event: Partial<Omit<Event, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Event> {
    const response = await fetch(`${API_URL}/events/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  }
}