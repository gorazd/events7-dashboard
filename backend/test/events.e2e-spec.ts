import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { EventType } from '../src/entities/event.entity';
import { DataSource } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsModule } from '../src/events/events.module';
import { Event } from '../src/entities/event.entity';

describe('Events API (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Event],
          synchronize: true,
        }),
        EventsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe()); // Enable validation for DTOs
    await app.init();

    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean the database before each test
    await dataSource.query('DELETE FROM event');
    // Reset auto-increment counter
    await dataSource.query('DELETE FROM sqlite_sequence WHERE name="event"');
  });

  describe('GET /events', () => {
    it('should return empty array when no events exist', () => {
      return request(app.getHttpServer())
        .get('/events')
        .expect(200)
        .expect([]);
    });

    it('should return all events when events exist', async () => {
      // Create test events directly in the database
      await dataSource.query(`
        INSERT INTO event (name, description, type, priority, createdAt, updatedAt) 
        VALUES 
        ('test-event-1', 'First test event', 'liveops', 5, datetime('now'), datetime('now')),
        ('test-event-2', 'Second test event', 'crosspromo', 8, datetime('now'), datetime('now'))
      `);

      const response = await request(app.getHttpServer())
        .get('/events')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        id: 1,
        name: 'test-event-1',
        description: 'First test event',
        type: 'liveops',
        priority: 5,
      });
      expect(response.body[1]).toMatchObject({
        id: 2,
        name: 'test-event-2',
        description: 'Second test event',
        type: 'crosspromo',
        priority: 8,
      });
    });
  });

  describe('GET /events/:id', () => {
    it('should return a single event by id', async () => {
      await dataSource.query(`
        INSERT INTO event (name, description, type, priority, createdAt, updatedAt) 
        VALUES ('single-event', 'Single event description', 'app', 3, datetime('now'), datetime('now'))
      `);

      const response = await request(app.getHttpServer())
        .get('/events/1')
        .expect(200);

      expect(response.body).toMatchObject({
        id: 1,
        name: 'single-event',
        description: 'Single event description',
        type: 'app',
        priority: 3,
      });
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should return 404 when event does not exist', () => {
      return request(app.getHttpServer())
        .get('/events/999')
        .expect(404)
        .expect({
          statusCode: 404,
          message: 'Event with ID 999 not found',
          error: 'Not Found',
        });
    });

    it('should handle invalid id format', () => {
      return request(app.getHttpServer())
        .get('/events/invalid-id')
        .expect(404); // NestJS converts invalid number params to 404
    });
  });

  describe('POST /events', () => {
    const validEventData = {
      name: 'new-test-event',
      description: 'New test event description',
      type: EventType.LIVEOPS,
      priority: 7,
    };

    it('should create a new event with valid data', () => {
      return request(app.getHttpServer())
        .post('/events')
        .send(validEventData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toMatchObject({
            id: 1,
            name: 'new-test-event',
            description: 'New test event description',
            type: 'liveops',
            priority: 7,
          });
          expect(res.body).toHaveProperty('createdAt');
          expect(res.body).toHaveProperty('updatedAt');
        });
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/events')
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('name should not be empty');
          expect(res.body.message).toContain('description should not be empty');
          expect(res.body.message).toContain('type should not be empty');
          expect(res.body.message).toContain('priority should not be empty');
        });
    });

    it('should validate name format (kebab-case)', () => {
      return request(app.getHttpServer())
        .post('/events')
        .send({
          ...validEventData,
          name: 'Invalid Name With Spaces',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('name must be in kebab-case format');
        });
    });

    it('should validate event type enum', () => {
      return request(app.getHttpServer())
        .post('/events')
        .send({
          ...validEventData,
          type: 'invalid-type',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual(expect.arrayContaining(['type must be one of the following values: crosspromo, liveops, app, ads']));
        });
    });

    it('should validate priority range (0-10)', async () => {
      // Test priority too low
      await request(app.getHttpServer())
        .post('/events')
        .send({
          ...validEventData,
          priority: -1,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('priority must not be less than 0');
        });

      // Test priority too high
      await request(app.getHttpServer())
        .post('/events')
        .send({
          ...validEventData,
          priority: 11,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('priority must not be greater than 10');
        });
    });

    it('should create events with all valid event types', async () => {
      const eventTypes = [EventType.CROSSPROMO, EventType.LIVEOPS, EventType.APP, EventType.ADS];

      for (let i = 0; i < eventTypes.length; i++) {
        const eventData = {
          name: `event-${i + 1}`,
          description: `Event ${i + 1} description`,
          type: eventTypes[i],
          priority: i + 1,
        };

        await request(app.getHttpServer())
          .post('/events')
          .send(eventData)
          .expect(201)
          .expect((res) => {
            expect(res.body.type).toBe(eventTypes[i]);
          });
      }
    });

    it('should handle duplicate names (should be allowed)', async () => {
      const eventData = {
        name: 'duplicate-name',
        description: 'First event',
        type: EventType.APP,
        priority: 5,
      };

      // Create first event
      await request(app.getHttpServer())
        .post('/events')
        .send(eventData)
        .expect(201);

      // Create second event with same name (should succeed)
      await request(app.getHttpServer())
        .post('/events')
        .send({
          ...eventData,
          description: 'Second event with same name',
        })
        .expect(201);
    });
  });

  describe('PATCH /events/:id', () => {
    let eventId: number;

    beforeEach(async () => {
      // Create a test event before each update test
      const result = await dataSource.query(`
        INSERT INTO event (name, description, type, priority, createdAt, updatedAt) 
        VALUES ('existing-event', 'Existing event description', 'liveops', 5, datetime('now'), datetime('now'))
      `);
      eventId = 1; // SQLite starts auto-increment at 1
    });

    it('should update an existing event', () => {
      const updateData = {
        name: 'updated-event-name',
        description: 'Updated description',
        priority: 9,
      };

      return request(app.getHttpServer())
        .patch(`/events/${eventId}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            id: eventId,
            name: 'updated-event-name',
            description: 'Updated description',
            type: 'liveops', // Should remain unchanged
            priority: 9,
          });
        });
    });

    it('should allow partial updates', () => {
      return request(app.getHttpServer())
        .patch(`/events/${eventId}`)
        .send({ priority: 10 })
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            id: eventId,
            name: 'existing-event', // Should remain unchanged
            description: 'Existing event description', // Should remain unchanged
            type: 'liveops', // Should remain unchanged
            priority: 10, // Should be updated
          });
        });
    });

    it('should validate updated fields', () => {
      return request(app.getHttpServer())
        .patch(`/events/${eventId}`)
        .send({
          name: 'Invalid Name Format',
          priority: 15,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('name must be in kebab-case format');
          expect(res.body.message).toContain('priority must not be greater than 10');
        });
    });

    it('should return 404 when updating non-existent event', () => {
      return request(app.getHttpServer())
        .patch('/events/999')
        .send({ priority: 8 })
        .expect(404)
        .expect({
          statusCode: 404,
          message: 'Event with ID 999 not found',
          error: 'Not Found',
        });
    });
  });

  describe('DELETE /events/:id', () => {
    let eventId: number;

    beforeEach(async () => {
      await dataSource.query(`
        INSERT INTO event (name, description, type, priority, createdAt, updatedAt) 
        VALUES ('event-to-delete', 'Event to be deleted', 'app', 3, datetime('now'), datetime('now'))
      `);
      eventId = 1;
    });

    it('should delete an existing event', async () => {
      await request(app.getHttpServer())
        .delete(`/events/${eventId}`)
        .expect(200);

      // Verify the event is actually deleted
      await request(app.getHttpServer())
        .get(`/events/${eventId}`)
        .expect(404);
    });

    it('should return 404 when deleting non-existent event', () => {
      return request(app.getHttpServer())
        .delete('/events/999')
        .expect(404)
        .expect({
          statusCode: 404,
          message: 'Event with ID 999 not found',
          error: 'Not Found',
        });
    });

    it('should handle deletion of already deleted event', async () => {
      // Delete the event first
      await request(app.getHttpServer())
        .delete(`/events/${eventId}`)
        .expect(200);

      // Try to delete it again
      await request(app.getHttpServer())
        .delete(`/events/${eventId}`)
        .expect(404);
    });
  });

  describe('Full CRUD workflow', () => {
    it('should support complete event lifecycle', async () => {
      const originalEvent = {
        name: 'lifecycle-event',
        description: 'Event for testing full lifecycle',
        type: EventType.CROSSPROMO,
        priority: 6,
      };

      // 1. Create event
      const createResponse = await request(app.getHttpServer())
        .post('/events')
        .send(originalEvent)
        .expect(201);

      const eventId = createResponse.body.id;
      expect(eventId).toBeDefined();

      // 2. Read the created event
      await request(app.getHttpServer())
        .get(`/events/${eventId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject(originalEvent);
        });

      // 3. Update the event
      const updateData = {
        name: 'updated-lifecycle-event',
        priority: 9,
      };

      await request(app.getHttpServer())
        .patch(`/events/${eventId}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            ...originalEvent,
            ...updateData,
          });
        });

      // 4. Verify update persisted
      await request(app.getHttpServer())
        .get(`/events/${eventId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            ...originalEvent,
            ...updateData,
          });
        });

      // 5. Delete the event
      await request(app.getHttpServer())
        .delete(`/events/${eventId}`)
        .expect(200);

      // 6. Verify deletion
      await request(app.getHttpServer())
        .get(`/events/${eventId}`)
        .expect(404);
    });
  });
});