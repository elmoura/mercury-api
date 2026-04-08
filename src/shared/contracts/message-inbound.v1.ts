/**
 * Contrato `message.inbound.v1` — publicado pelo hermes-api e consumido pelo heracles-consumer.
 * Um único publish por mensagem inbound (exchange fanout → duas filas em M1-14).
 */
export const MESSAGE_INBOUND_SCHEMA_VERSION = 'message.inbound.v1' as const;

export type MessageInboundV1 = {
  schemaVersion: typeof MESSAGE_INBOUND_SCHEMA_VERSION;
  /** UUID v4 por publicação (correlação / logs). */
  eventId: string;
  organizationId: string;
  agentId: string;
  metaPhoneNumberId: string;
  metaMessageId: string;
  fromWaId: string;
  contactName?: string;
  timestampIso: string;
  messageType: string;
  text?: string;
  /** Payload bruto do item `messages[]` da Meta (auditoria / evolução). */
  rawMessage: Record<string, unknown>;
};

export function isMessageInboundV1(v: unknown): v is MessageInboundV1 {
  if (!v || typeof v !== 'object') {
    return false;
  }
  const o = v as MessageInboundV1;
  return (
    o.schemaVersion === MESSAGE_INBOUND_SCHEMA_VERSION &&
    typeof o.eventId === 'string' &&
    typeof o.organizationId === 'string' &&
    typeof o.agentId === 'string' &&
    typeof o.metaPhoneNumberId === 'string' &&
    typeof o.metaMessageId === 'string' &&
    typeof o.fromWaId === 'string'
  );
}
