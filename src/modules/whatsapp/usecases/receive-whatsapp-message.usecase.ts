import { Injectable } from '@nestjs/common';

@Injectable()
export class ReceiveWhatsappMessageUsecase {
  constructor() {}

  execute(input: any) {
    // Recebe mensagem do WhatsApp
    // Salva mensagem no banco de dados, segmentado pelo orgId e numero que recebeu a mensagem
    // Envia mensagem para o Mistral LLM para processamento
    // Envia mensagem de resposta para o WhatsApp

    return input;
  }
}
