import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ModerateMessageDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  moderated: boolean;
}
