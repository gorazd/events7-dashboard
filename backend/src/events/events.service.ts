import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../entities/event.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
  ) {}

  async findAll(): Promise<Event[]> {
    return this.eventsRepository.find();
  }

  async findOne(id: number): Promise<Event> {
    const event = await this.eventsRepository.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return event;
  }

  async create(eventData: Partial<Event>): Promise<Event> {
    const event = this.eventsRepository.create(eventData);
    return this.eventsRepository.save(event);
  }

  async update(id: number, eventData: Partial<Event>): Promise<Event> {
    await this.eventsRepository.update(id, eventData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const event = await this.findOne(id); // This will throw if not found
    await this.eventsRepository.delete(id);
  }
}