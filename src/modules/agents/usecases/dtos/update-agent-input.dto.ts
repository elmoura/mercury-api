import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateAgentInputDto {
  @ApiPropertyOptional({ example: 'Agente Comercial Senior' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    example: 'Atende leads enterprise e faz qualificação.',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    example: '+5511988887777',
    description: 'Formato E.164',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'whatsappPhone deve estar em formato E.164.',
  })
  whatsappPhone?: string;

  @ApiPropertyOptional({
    description:
      'Identificador Meta `phone_number_id` do número Business WhatsApp associado a este agente.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  metaPhoneNumberId?: string;

  @ApiPropertyOptional({
    description: 'Prompt base do agente (texto livre).',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  prompt?: string;
}
