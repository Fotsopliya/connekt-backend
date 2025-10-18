import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTripDto {
  @ApiProperty({ maxLength: 100, example: 'Yaoundé' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  departureCity: string;

  @ApiProperty({ maxLength: 100, example: 'Douala' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  arrivalCity: string;

  @ApiProperty({ format: 'date-time', example: '2025-10-20T08:00:00.000Z' })
  @IsDateString()
  departureTime: string;

  @ApiProperty({ minimum: 1, example: 4 })
  @IsInt()
  @Min(1)
  seatsTotal: number;

  @ApiProperty({ minimum: 0, example: 3 })
  @IsInt()
  @Min(0)
  seatsLeft: number;

  @ApiProperty({ minimum: 0.01, example: 15.5 })
  @IsPositive()
  price: number;

  @ApiPropertyOptional({
    maxLength: 1000,
    example: 'Pas de bagages volumineux.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: '6c9e9cd7-9a61-43b6-9a40-9c1df4a9b1f3' })
  @IsString()
  @IsNotEmpty()
  vehicleId: string;
}
