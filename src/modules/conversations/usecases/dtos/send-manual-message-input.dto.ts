import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class SendManualMessageInputDto {
  @ApiProperty({
    description: 'Texto a enviar para o cliente no WhatsApp.',
    example: 'Olá! Como posso ajudar você hoje?',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  text: string;

  @ApiProperty({
    description:
      'Chave de idempotência para evitar envio duplicado em retries do cliente.',
    example: '6f9c7a7e-5d2f-4b7e-9f8f-2f37a9a1d2c3',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  idempotencyKey: string;
}
