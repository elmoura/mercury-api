import { BadGatewayException, Injectable, Logger } from '@nestjs/common';

type GraphSendTextResponse = {
  messages?: Array<{ id?: string }>;
};

@Injectable()
export class WhatsappGraphService {
  private readonly logger = new Logger(WhatsappGraphService.name);

  async sendText(input: {
    accessToken: string;
    phoneNumberId: string;
    toWaId: string;
    body: string;
  }): Promise<{ metaMessageId: string }> {
    const to = input.toWaId.replace(/\D/g, '');
    const url = `https://graph.facebook.com/v22.0/${input.phoneNumberId}/messages`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: input.body },
      }),
    });

    const data = (await res
      .json()
      .catch(() => ({}))) as GraphSendTextResponse & { error?: unknown };
    if (!res.ok) {
      this.logger.error(
        JSON.stringify({
          msg: 'whatsapp_send_failed',
          status: res.status,
          response: data,
        }),
      );
      throw new BadGatewayException('Falha ao enviar mensagem para a Meta.');
    }

    const metaMessageId = data.messages?.[0]?.id;
    if (!metaMessageId || typeof metaMessageId !== 'string') {
      throw new BadGatewayException('Meta não retornou identificador da mensagem.');
    }

    return { metaMessageId };
  }
}
