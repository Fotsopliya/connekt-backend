import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ example: '6c9e9cd7-9a61-43b6-9a40-9c1df4a9b1f3' })
  @IsString()
  @IsNotEmpty()
  tripId: string;

  @ApiPropertyOptional({ minimum: 1, example: 1 })
  @IsInt()
  @IsOptional()
  @Min(1)
  seats?: number = 1;
}
