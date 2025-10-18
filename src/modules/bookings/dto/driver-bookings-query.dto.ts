import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class DriverBookingsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by tripId',
    example: '6c9e9cd7-9a61-43b6-9a40-9c1df4a9b1f3',
  })
  @IsOptional()
  @IsString()
  tripId?: string;
}
