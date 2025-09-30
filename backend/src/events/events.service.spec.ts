import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { EventsService } from './events.service';
import { Event, EventType } from '../entities/event.entity';

// Mock TypeORM Repository
const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('EventsService', () => {
  let service: EventsService;
  let eventsRepository: typeof mockRepository;

  const mockEvent: Event = {
    id: 1,
    name: 'test-event',
    description: 'Test description',
    type: EventType.LIVEOPS,
    priority: 5,
    createdAt: new Date('2023-01-01T10:00:00Z'),
    updatedAt: new Date('2023-01-01T11:00:00Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getRepositoryToken(Event),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    eventsRepository = module.get(getRepositoryToken(Event));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of events', async () => {
      const mockEvents = [mockEvent, { ...mockEvent, id: 2, name: 'second-event' }];
      eventsRepository.find.mockReturnValue(mockEvents);

      const result = await service.findAll();

      expect(result).toEqual(mockEvents);
      expect(eventsRepository.find).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no events exist', async () => {
      eventsRepository.find.mockReturnValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(eventsRepository.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a single event', async () => {
      eventsRepository.findOne.mockReturnValue(mockEvent);

      const result = await service.findOne(1);

      expect(result).toEqual(mockEvent);
      expect(eventsRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException when event does not exist', async () => {
      eventsRepository.findOne.mockReturnValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('Event with ID 999 not found');
      expect(eventsRepository.findOne).toHaveBeenCalledWith({ where: { id: 999 } });
    });
  });

  describe('create', () => {
    const createEventData = {
      name: 'new-event',
      description: 'New event description',
      type: EventType.CROSSPROMO,
      priority: 3,
    };

    it('should successfully create and return a new event', async () => {
      const newEvent = { ...mockEvent, ...createEventData, id: 3 };
      eventsRepository.create.mockReturnValue(newEvent);
      eventsRepository.save.mockReturnValue(newEvent);

      const result = await service.create(createEventData);

      expect(result).toEqual(newEvent);
      expect(eventsRepository.create).toHaveBeenCalledWith(createEventData);
      expect(eventsRepository.save).toHaveBeenCalledWith(newEvent);
    });

    it('should handle partial event data creation', async () => {
      const partialEventData = {
        name: 'minimal-event',
        description: 'Minimal description',
      };
      const newEvent = { ...mockEvent, ...partialEventData, id: 4 };
      eventsRepository.create.mockReturnValue(newEvent);
      eventsRepository.save.mockReturnValue(newEvent);

      const result = await service.create(partialEventData);

      expect(result).toEqual(newEvent);
      expect(eventsRepository.create).toHaveBeenCalledWith(partialEventData);
      expect(eventsRepository.save).toHaveBeenCalledWith(newEvent);
    });
  });

  describe('update', () => {
    const updateEventData = {
      name: 'updated-event',
      description: 'Updated description',
      priority: 8,
    };

    it('should successfully update and return the event', async () => {
      const updatedEvent = { ...mockEvent, ...updateEventData };
      eventsRepository.update.mockReturnValue({ affected: 1 });
      eventsRepository.findOne.mockReturnValue(updatedEvent);

      const result = await service.update(1, updateEventData);

      expect(result).toEqual(updatedEvent);
      expect(eventsRepository.update).toHaveBeenCalledWith(1, updateEventData);
      expect(eventsRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException when trying to update non-existent event', async () => {
      eventsRepository.update.mockReturnValue({ affected: 1 });
      eventsRepository.findOne.mockReturnValue(null);

      await expect(service.update(999, updateEventData)).rejects.toThrow(NotFoundException);
      await expect(service.update(999, updateEventData)).rejects.toThrow('Event with ID 999 not found');
      expect(eventsRepository.update).toHaveBeenCalledWith(999, updateEventData);
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { name: 'new-name-only' };
      const updatedEvent = { ...mockEvent, name: 'new-name-only' };
      eventsRepository.update.mockReturnValue({ affected: 1 });
      eventsRepository.findOne.mockReturnValue(updatedEvent);

      const result = await service.update(1, partialUpdate);

      expect(result).toEqual(updatedEvent);
      expect(eventsRepository.update).toHaveBeenCalledWith(1, partialUpdate);
    });
  });

  describe('remove', () => {
    it('should successfully delete an existing event', async () => {
      eventsRepository.findOne.mockReturnValue(mockEvent);
      eventsRepository.delete.mockReturnValue({ affected: 1 });

      await service.remove(1);

      expect(eventsRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(eventsRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when trying to delete non-existent event', async () => {
      eventsRepository.findOne.mockReturnValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      await expect(service.remove(999)).rejects.toThrow('Event with ID 999 not found');
      expect(eventsRepository.findOne).toHaveBeenCalledWith({ where: { id: 999 } });
      expect(eventsRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully in findAll', async () => {
      const dbError = new Error('Database connection failed');
      eventsRepository.find.mockRejectedValue(dbError);

      await expect(service.findAll()).rejects.toThrow('Database connection failed');
    });

    it('should handle database errors gracefully in create', async () => {
      const dbError = new Error('Database constraint violation');
      eventsRepository.create.mockReturnValue(mockEvent);
      eventsRepository.save.mockRejectedValue(dbError);

      await expect(service.create({ name: 'test' })).rejects.toThrow('Database constraint violation');
    });
  });
});