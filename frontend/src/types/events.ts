export type EventType = 'crosspromo' | 'liveops' | 'app' | 'ads';

export const EVENT_TYPES = {
  CROSSPROMO: 'crosspromo' as const,
  LIVEOPS: 'liveops' as const,
  APP: 'app' as const,
  ADS: 'ads' as const,
};

export interface Event {
  id: number;
  name: string;
  description: string;
  type: EventType;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventDTO {
  name: string;
  description: string;
  type: EventType;
  priority: number;
}

export interface UpdateEventDTO extends Partial<CreateEventDTO> {}
