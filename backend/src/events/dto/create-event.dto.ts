import { IsEnum, IsInt, IsNotEmpty, IsString, Max, Min, Matches } from 'class-validator';
import { EventType } from '../../entities/event.entity';

export class CreateEventDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'name must be in kebab-case format',
  })
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsEnum(EventType)
  type: EventType;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(10)
  priority: number;
}