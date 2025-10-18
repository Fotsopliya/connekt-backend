import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ example: '6c9e9cd7-9a61-43b6-9a40-9c1df4a9b1f3' })
  @IsString()
  @IsNotEmpty()
  tripId: string;

  @ApiProperty({ example: 'a6f4e1c2-0a09-4b5a-8eaf-98f1c7a3c1b2' })
  @IsString()
  @IsNotEmpty()
  recipientId: string;

  @ApiProperty({
    maxLength: 1000,
    example: 'Bonjour, est-ce que je peux prendre un bagage ?',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;
}
