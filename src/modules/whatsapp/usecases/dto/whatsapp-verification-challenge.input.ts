import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class WhatsappVerificationChallengeInputDto {
  @ApiProperty({
    name: 'hub.challenge',
    description: 'Valor que a API deve ecoar na resposta (verificação Meta).',
  })
  @IsString()
  @IsNotEmpty()
  'hub.challenge': string;

  @ApiProperty({
    name: 'hub.mode',
    description: 'Modo de assinatura (ex.: subscribe).',
    example: 'subscribe',
  })
  @IsString()
  @IsNotEmpty()
  'hub.mode': string;

  @ApiProperty({
    name: 'hub.verify_token',
    description: 'Token configurado no app e na Meta para validar o webhook.',
  })
  @IsString()
  @IsNotEmpty()
  'hub.verify_token': string;
}
