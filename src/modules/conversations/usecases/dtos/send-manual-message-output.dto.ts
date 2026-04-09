import { ApiProperty } from '@nestjs/swagger';

export class SendManualMessageOutputDto {
  @ApiProperty()
  messageId: string;

  @ApiProperty()
  conversationId: string;

  @ApiProperty({ example: 'outbound' })
  direction: 'outbound';

  @ApiProperty({ description: 'ISO 8601' })
  sentAt: string;

  @ApiProperty()
  idempotencyKey: string;

  @ApiProperty({
    description: 'Indica se resposta veio de deduplicação idempotente.',
  })
  deduplicated: boolean;
}
