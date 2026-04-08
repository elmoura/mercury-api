import {
  extractTextFromMetaMessage,
  parseMetaWhatsappWebhook,
} from './parse-meta-whatsapp-webhook';

describe('parseMetaWhatsappWebhook', () => {
  it('extrai metadata e mensagens', () => {
    const body = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WABA_ID',
          changes: [
            {
              field: 'messages',
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '15551234567',
                  phone_number_id: '123456789',
                },
                contacts: [
                  {
                    profile: { name: 'Jane' },
                    wa_id: '5511999999999',
                  },
                ],
                messages: [
                  {
                    from: '5511999999999',
                    id: 'wamid.xxx',
                    timestamp: '1700000000',
                    type: 'text',
                    text: { body: 'Oi' },
                  },
                ],
              },
            },
          ],
        },
      ],
    };
    const slices = parseMetaWhatsappWebhook(body);
    expect(slices).toHaveLength(1);
    expect(slices[0].metadata.phone_number_id).toBe('123456789');
    expect(slices[0].message.id).toBe('wamid.xxx');
    expect(extractTextFromMetaMessage(slices[0].message)).toBe('Oi');
  });
});
