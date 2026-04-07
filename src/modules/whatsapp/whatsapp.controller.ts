import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WhatsappVerificationChallengeInputDto } from './usecases/dto/whatsapp-verification-challenge.input';
import { WhatsappVerificationChallengeUsecase } from './usecases/whatsapp-verification-challenge.usecase';
import { ReceiveWhatsappMessageUsecase } from './usecases/receive-whatsapp-message.usecase';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsappController {
  constructor(
    private readonly whatsappVerificationChallengeUsecase: WhatsappVerificationChallengeUsecase,
    private readonly receiveWhatsappMessageUsecase: ReceiveWhatsappMessageUsecase,
  ) {}

  @Get('webhook')
  @ApiOperation({
    summary: 'Verificação do webhook (challenge)',
    description:
      'Endpoint usado pela Meta no cadastro do webhook: devolve o valor de `hub.challenge` quando o `hub.verify_token` confere.',
  })
  @ApiQuery({ name: 'hub.mode', required: true, example: 'subscribe' })
  @ApiQuery({ name: 'hub.challenge', required: true })
  @ApiQuery({ name: 'hub.verify_token', required: true })
  @ApiResponse({
    status: 200,
    description: 'Texto plano: valor do challenge a ser retornado à Meta.',
    schema: { type: 'string' },
  })
  verifyWebhook(@Query() query: WhatsappVerificationChallengeInputDto) {
    return this.whatsappVerificationChallengeUsecase.execute(query);
  }

  @Post('webhook')
  @ApiOperation({
    summary: 'Receber eventos do WhatsApp Cloud API',
    description:
      'Payload de webhook da Meta (mensagens, status, etc.). Estrutura conforme a documentação oficial do WhatsApp Cloud API.',
  })
  @ApiBody({
    description: 'Corpo JSON enviado pela Meta (formato WhatsApp Cloud API).',
    schema: {
      type: 'object',
      additionalProperties: true,
      example: {
        object: 'whatsapp_business_account',
        entry: [],
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Ecoa o payload recebido (comportamento atual do usecase).',
  })
  receiveMessage(@Body() body: Record<string, unknown>) {
    return this.receiveWhatsappMessageUsecase.execute(body);
  }
}
