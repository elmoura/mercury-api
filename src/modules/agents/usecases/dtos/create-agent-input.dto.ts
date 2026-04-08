import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAgentInputDto {
  @ApiProperty({ example: 'Agente Comercial' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 'Atende leads e qualifica oportunidades.' })
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  description: string;

  @ApiProperty({
    example: '+5511999999999',
    description: 'Formato E.164',
  })
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'whatsappPhone deve estar em formato E.164.',
  })
  whatsappPhone: string;

  @ApiPropertyOptional({
    description:
      'Identificador Meta `phone_number_id` do número Business WhatsApp associado a este agente.',
    example: '106540522029767',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  metaPhoneNumberId?: string;

  @ApiProperty({
    description: 'Prompt base do agente (texto livre).',
    example: 'Você é um agente comercial cordial e objetivo...',
  })
  @IsString()
  @MinLength(1)
  prompt: string;
}
