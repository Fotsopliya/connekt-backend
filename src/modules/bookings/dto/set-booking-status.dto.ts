import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class SetBookingStatusDto {
  @ApiProperty({ enum: ['completed', 'no_show'] })
  @IsIn(['completed', 'no_show'])
  status: 'completed' | 'no_show';
}
