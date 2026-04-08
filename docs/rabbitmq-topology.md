# RabbitMQ — inbound WhatsApp (M1-10 / M1-14)

## Variáveis de ambiente

| Variável | Descrição | Exemplo |
| --- | --- | --- |
| `RABBITMQ_URL` | URI AMQP (hermes-api e heracles-consumer) | `amqp://guest:guest@localhost:5672` |
| `RABBITMQ_WHATSAPP_INBOUND_EXCHANGE` | Nome da exchange fanout | `whatsapp.inbound.fanout` (default) |
| `RABBITMQ_QUEUE_WHATSAPP_INBOUND_PERSIST` | Fila persistência | `q.whatsapp.inbound.persist` |
| `RABBITMQ_QUEUE_WHATSAPP_INBOUND_AI` | Fila resposta IA | `q.whatsapp.inbound.ai.reply` |

## Topologia

```mermaid
flowchart TB
  Hermes[hermes_api_webhook]
  Ex[whatsapp_inbound_fanout]
  Q1[q_whatsapp_inbound_persist]
  Q2[q_whatsapp_inbound_ai_reply]
  H1[heracles_persist_consumer]
  H2[heracles_ai_consumer]

  Hermes -->|um publish JSON message_inbound_v1| Ex
  Ex --> Q1
  Ex --> Q2
  Q1 --> H1
  Q2 --> H2
```

- Exchange **fanout**: uma publicação replica a mensagem para **todas** as filas com bind (routing key vazia `""`).
- **Um único publish** por mensagem inbound Meta no `hermes-api` (após normalização).

## Contrato `message.inbound.v1`

O domínio está definido em [`src/shared/contracts/message-inbound.v1.ts`](../src/shared/contracts/message-inbound.v1.ts).

Na fila, o **`ClientProxy` RMQ** (`@nestjs/microservices`) envia o envelope Nest com `pattern: "message.inbound.v1"` e `data` = payload do contrato. Exemplo:

```json
{
  "pattern": "message.inbound.v1",
  "data": { "schemaVersion": "message.inbound.v1", "eventId": "...", "...": "..." }
}
```

Fixtures: [`test/fixtures/message-inbound.v1.example.json`](../test/fixtures/message-inbound.v1.example.json) (domínio) e [`test/fixtures/message-inbound.nest-envelope.example.json`](../test/fixtures/message-inbound.nest-envelope.example.json) (envelope na fila).

## Resolução de agente

O webhook usa `metadata.phone_number_id` da Meta. O agente deve ter `metaPhoneNumberId` configurado (API de agentes) para encaminhar o evento.
