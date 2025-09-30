import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Event, EventType } from '../entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { NotFoundException } from '@nestjs/common';

// Mock EventsService
const mockEventsService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('EventsController', () => {
  let controller: EventsController;
  let eventsService: typeof mockEventsService;

  const mockEvent: Event = {
    id: 1,
    name: 'test-event',
    description: 'Test description',
    type: EventType.LIVEOPS,
    priority: 5,
    createdAt: new Date('2023-01-01T10:00:00Z'),
    updatedAt: new Date('2023-01-01T11:00:00Z'),
  };

  const mockEvents: Event[] = [
    mockEvent,
    {
      id: 2,
      name: 'second-event',
      description: 'Second description',
      type: EventType.CROSSPROMO,
      priority: 8,
      createdAt: new Date('2023-01-02T10:00:00Z'),
      updatedAt: new Date('2023-01-02T11:00:00Z'),
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
    eventsService = module.get(EventsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of events', async () => {
      eventsService.findAll.mockResolvedValue(mockEvents);

      const result = await controller.findAll();

      expect(result).toEqual(mockEvents);
      expect(eventsService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no events exist', async () => {
      eventsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
      expect(eventsService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should propagate service errors', async () => {
      const error = new Error('Database error');
      eventsService.findAll.mockRejectedValue(error);

      await expect(controller.findAll()).rejects.toThrow('Database error');
      expect(eventsService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a single event', async () => {
      eventsService.findOne.mockResolvedValue(mockEvent);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockEvent);
      expect(eventsService.findOne).toHaveBeenCalledWith(1);
    });

    it('should propagate NotFoundException from service', async () => {
      const notFoundError = new NotFoundException('Event with ID 999 not found');
      eventsService.findOne.mockRejectedValue(notFoundError);

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(controller.findOne(999)).rejects.toThrow('Event with ID 999 not found');
      expect(eventsService.findOne).toHaveBeenCalledWith(999);
    });

    it('should handle string id parameter correctly', async () => {
      eventsService.findOne.mockResolvedValue(mockEvent);

      const result = await controller.findOne('1' as any); // Simulating string param

      expect(result).toEqual(mockEvent);
      expect(eventsService.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('create', () => {
    const createEventDto: CreateEventDto = {
      name: 'new-event',
      description: 'New event description',
      type: EventType.APP,
      priority: 3,
    };

    it('should create and return a new event', async () => {
      const newEvent = { ...mockEvent, ...createEventDto, id: 3 };
      eventsService.create.mockResolvedValue(newEvent);

      const result = await controller.create(createEventDto);

      expect(result).toEqual(newEvent);
      expect(eventsService.create).toHaveBeenCalledWith(createEventDto);
    });

    it('should handle validation errors from DTO', async () => {
      const invalidDto = {
        name: '', // Invalid: empty name
        description: 'Valid description',
        type: EventType.LIVEOPS,
        priority: 15, // Invalid: priority > 10
      } as CreateEventDto;

      const validationError = new Error('Validation failed');
      eventsService.create.mockRejectedValue(validationError);

      await expect(controller.create(invalidDto)).rejects.toThrow('Validation failed');
      expect(eventsService.create).toHaveBeenCalledWith(invalidDto);
    });

    it('should propagate database errors from service', async () => {
      const dbError = new Error('Database constraint violation');
      eventsService.create.mockRejectedValue(dbError);

      await expect(controller.create(createEventDto)).rejects.toThrow('Database constraint violation');
      expect(eventsService.create).toHaveBeenCalledWith(createEventDto);
    });
  });

  describe('update', () => {
    const updateEventDto: UpdateEventDto = {
      name: 'updated-event',
      description: 'Updated description',
      priority: 7,
    };

    it('should update and return the event', async () => {
      const updatedEvent = { ...mockEvent, ...updateEventDto };
      eventsService.update.mockResolvedValue(updatedEvent);

      const result = await controller.update(1, updateEventDto);

      expect(result).toEqual(updatedEvent);
      expect(eventsService.update).toHaveBeenCalledWith(1, updateEventDto);
    });

    it('should handle partial updates', async () => {
      const partialUpdate: UpdateEventDto = { name: 'new-name-only' };
      const updatedEvent = { ...mockEvent, name: 'new-name-only' };
      eventsService.update.mockResolvedValue(updatedEvent);

      const result = await controller.update(1, partialUpdate);

      expect(result).toEqual(updatedEvent);
      expect(eventsService.update).toHaveBeenCalledWith(1, partialUpdate);
    });

    it('should propagate NotFoundException when updating non-existent event', async () => {
      const notFoundError = new NotFoundException('Event with ID 999 not found');
      eventsService.update.mockRejectedValue(notFoundError);

      await expect(controller.update(999, updateEventDto)).rejects.toThrow(NotFoundException);
      expect(eventsService.update).toHaveBeenCalledWith(999, updateEventDto);
    });

    it('should convert string id parameter to number', async () => {
      const updatedEvent = { ...mockEvent, ...updateEventDto };
      eventsService.update.mockResolvedValue(updatedEvent);

      const result = await controller.update('1' as any, updateEventDto); // String id

      expect(result).toEqual(updatedEvent);
      expect(eventsService.update).toHaveBeenCalledWith(1, updateEventDto); // Should be converted to number
    });

    it('should handle empty update DTO', async () => {
      const emptyUpdate: UpdateEventDto = {};
      eventsService.update.mockResolvedValue(mockEvent);

      const result = await controller.update(1, emptyUpdate);

      expect(result).toEqual(mockEvent);
      expect(eventsService.update).toHaveBeenCalledWith(1, emptyUpdate);
    });
  });

  describe('remove', () => {
    it('should delete an existing event', async () => {
      eventsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(1);

      expect(result).toBeUndefined();
      expect(eventsService.remove).toHaveBeenCalledWith(1);
    });

    it('should propagate NotFoundException when deleting non-existent event', async () => {
      const notFoundError = new NotFoundException('Event with ID 999 not found');
      eventsService.remove.mockRejectedValue(notFoundError);

      await expect(controller.remove(999)).rejects.toThrow(NotFoundException);
      expect(eventsService.remove).toHaveBeenCalledWith(999);
    });

    it('should handle string id parameter correctly', async () => {
      eventsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('1' as any);

      expect(result).toBeUndefined();
      expect(eventsService.remove).toHaveBeenCalledWith('1');
    });

    it('should propagate database errors from service', async () => {
      const dbError = new Error('Foreign key constraint violation');
      eventsService.remove.mockRejectedValue(dbError);

      await expect(controller.remove(1)).rejects.toThrow('Foreign key constraint violation');
      expect(eventsService.remove).toHaveBeenCalledWith(1);
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle service throwing generic errors', async () => {
      const genericError = new Error('Unexpected error');
      eventsService.findAll.mockRejectedValue(genericError);

      await expect(controller.findAll()).rejects.toThrow('Unexpected error');
    });

    it('should handle service returning null/undefined', async () => {
      eventsService.findOne.mockResolvedValue(null);

      const result = await controller.findOne(1);

      expect(result).toBeNull();
      expect(eventsService.findOne).toHaveBeenCalledWith(1);
    });
  });
});