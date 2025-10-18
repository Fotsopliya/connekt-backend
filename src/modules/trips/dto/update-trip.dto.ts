import {
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTripDto {
  @ApiPropertyOptional({ maxLength: 100, example: 'Yaoundé' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  departureCity?: string;

  @ApiPropertyOptional({ maxLength: 100, example: 'Douala' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  arrivalCity?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    example: '2025-10-20T08:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  departureTime?: string;

  @ApiPropertyOptional({ minimum: 1, example: 4 })
  @IsInt()
  @IsOptional()
  @Min(1)
  seatsTotal?: number;

  @ApiPropertyOptional({ minimum: 0, example: 3 })
  @IsInt()
  @IsOptional()
  @Min(0)
  seatsLeft?: number;

  @ApiPropertyOptional({ minimum: 0.01, example: 15.5 })
  @IsPositive()
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({
    maxLength: 1000,
    example: 'Pas de bagages volumineux.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;
}
