/**
 * Extrai pares (metadata + mensagem) do payload WhatsApp Cloud API.
 * @see https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components
 */
export type MetaInboundMessageSlice = {
  metadata: {
    phone_number_id: string;
    display_phone_number?: string;
  };
  message: Record<string, unknown>;
  contacts?: Array<{
    wa_id?: string;
    profile?: { name?: string };
  }>;
};

export function parseMetaWhatsappWebhook(
  body: unknown,
): MetaInboundMessageSlice[] {
  if (!body || typeof body !== 'object') {
    return [];
  }
  const root = body as {
    entry?: Array<{
      changes?: Array<{
        value?: {
          metadata?: {
            phone_number_id?: string;
            display_phone_number?: string;
          };
          messages?: Array<Record<string, unknown>>;
          contacts?: MetaInboundMessageSlice['contacts'];
        };
      }>;
    }>;
  };
  const out: MetaInboundMessageSlice[] = [];
  const entries = root.entry ?? [];
  for (const ent of entries) {
    const changes = ent.changes ?? [];
    for (const ch of changes) {
      const value = ch.value;
      if (!value?.metadata?.phone_number_id || !value.messages?.length) {
        continue;
      }
      const metadata = {
        phone_number_id: value.metadata.phone_number_id,
        display_phone_number: value.metadata.display_phone_number,
      };
      for (const message of value.messages) {
        out.push({
          metadata,
          message,
          contacts: value.contacts,
        });
      }
    }
  }
  return out;
}

export function extractTextFromMetaMessage(
  message: Record<string, unknown>,
): string | undefined {
  if (
    message.type === 'text' &&
    message.text &&
    typeof message.text === 'object'
  ) {
    const t = message.text as { body?: string };
    return typeof t.body === 'string' ? t.body : undefined;
  }
  return undefined;
}
