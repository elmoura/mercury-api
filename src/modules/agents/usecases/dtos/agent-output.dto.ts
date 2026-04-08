import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AgentOutputDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  _id: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  organizationId: string;

  @ApiProperty({ example: 'Agente Comercial' })
  name: string;

  @ApiProperty({ example: 'Atende leads e qualifica oportunidades.' })
  description: string;

  @ApiProperty({ example: '+5511999999999' })
  whatsappPhone: string;

  @ApiPropertyOptional({
    description: 'phone_number_id Meta, se configurado.',
    nullable: true,
  })
  metaPhoneNumberId: string | null;

  @ApiProperty()
  prompt: string;

  @ApiProperty({ description: 'ISO 8601' })
  createdAt: string;

  @ApiProperty({ description: 'ISO 8601' })
  updatedAt: string;
}

export class ListAgentsOutputDto {
  @ApiProperty({ type: [AgentOutputDto] })
  items: AgentOutputDto[];

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  pageSize: number;

  @ApiProperty({ example: 3 })
  total: number;
}
