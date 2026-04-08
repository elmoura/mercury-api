import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConversationStatus } from '../../entities/conversation.entity';

export class ConversationSummaryOutputDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  organizationId: string;

  @ApiProperty()
  agentId: string;

  @ApiProperty()
  contactId: string;

  @ApiPropertyOptional({ nullable: true })
  contactDisplayName: string | null;

  @ApiPropertyOptional({ nullable: true })
  contactWaId: string | null;

  @ApiProperty({ enum: ConversationStatus })
  status: ConversationStatus;

  @ApiPropertyOptional({ nullable: true })
  lastMessagePreview: string | null;

  @ApiProperty()
  updatedAt: string;
}

export class ListConversationsOutputDto {
  @ApiProperty({ type: [ConversationSummaryOutputDto] })
  items: ConversationSummaryOutputDto[];

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  total: number;
}
