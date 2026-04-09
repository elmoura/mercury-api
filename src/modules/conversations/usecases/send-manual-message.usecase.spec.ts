import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { MessageEntityDatasource } from '../datasources/message-entity.datasource';
import { SendManualMessageUsecase } from './send-manual-message.usecase';
import { WhatsappGraphService } from '../services/whatsapp-graph.service';

describe('SendManualMessageUsecase', () => {
  const conversationModel = {
    findOne: jest.fn(),
  };
  const contactModel = {
    findOne: jest.fn(),
  };
  const organizationModel = {
    findById: jest.fn(),
  };
  const agentModel = {
    findOne: jest.fn(),
  };
  const messageDatasource = {
    findOutboundByIdempotency: jest.fn(),
    createOutbound: jest.fn(),
  };
  const whatsappGraph = {
    sendText: jest.fn(),
  };

  let usecase: SendManualMessageUsecase;
  const organizationId = new Types.ObjectId();
  const conversationId = new Types.ObjectId();
  const agentId = new Types.ObjectId();
  const contactId = new Types.ObjectId();

  beforeEach(() => {
    jest.clearAllMocks();
    usecase = new SendManualMessageUsecase(
      conversationModel as never,
      contactModel as never,
      organizationModel as never,
      agentModel as never,
      messageDatasource as unknown as MessageEntityDatasource,
      whatsappGraph as unknown as WhatsappGraphService,
    );

    messageDatasource.findOutboundByIdempotency.mockResolvedValue(null);
    conversationModel.findOne.mockResolvedValue({
      _id: conversationId,
      organizationId,
      agentId,
      contactId,
    });
    organizationModel.findById.mockResolvedValue({
      _id: organizationId,
      whatsappBusinessToken: 'meta-token',
    });
    contactModel.findOne.mockResolvedValue({
      _id: contactId,
      waId: '5511999999999',
    });
    agentModel.findOne.mockResolvedValue({
      _id: agentId,
      metaPhoneNumberId: 'phone-id-1',
    });
    whatsappGraph.sendText.mockResolvedValue({ metaMessageId: 'wamid-1' });
    messageDatasource.createOutbound.mockResolvedValue({
      metaMessageId: 'wamid-1',
      conversationId,
      createdAt: new Date('2026-04-09T10:00:00.000Z'),
    });
  });

  it('envia e persiste mensagem outbound', async () => {
    const out = await usecase.execute({
      organizationId: organizationId.toString(),
      conversationId: conversationId.toString(),
      text: '  Olá  ',
      idempotencyKey: 'key-1',
    });

    expect(whatsappGraph.sendText).toHaveBeenCalledWith(
      expect.objectContaining({
        phoneNumberId: 'phone-id-1',
        toWaId: '5511999999999',
        body: 'Olá',
      }),
    );
    expect(messageDatasource.createOutbound).toHaveBeenCalled();
    expect(out.deduplicated).toBe(false);
    expect(out.messageId).toBe('wamid-1');
  });

  it('retorna deduplicated quando já existe idempotencyKey', async () => {
    messageDatasource.findOutboundByIdempotency.mockResolvedValue({
      metaMessageId: 'wamid-existing',
      conversationId,
      createdAt: new Date('2026-04-09T09:00:00.000Z'),
    });

    const out = await usecase.execute({
      organizationId: organizationId.toString(),
      conversationId: conversationId.toString(),
      text: 'Olá',
      idempotencyKey: 'key-1',
    });

    expect(whatsappGraph.sendText).not.toHaveBeenCalled();
    expect(out.deduplicated).toBe(true);
    expect(out.messageId).toBe('wamid-existing');
  });

  it('falha quando organização não tem token', async () => {
    organizationModel.findById.mockResolvedValue({
      _id: organizationId,
      whatsappBusinessToken: '',
    });

    await expect(
      usecase.execute({
        organizationId: organizationId.toString(),
        conversationId: conversationId.toString(),
        text: 'Olá',
        idempotencyKey: 'key-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('falha quando conversa não pertence à organização', async () => {
    conversationModel.findOne.mockResolvedValue(null);

    await expect(
      usecase.execute({
        organizationId: organizationId.toString(),
        conversationId: conversationId.toString(),
        text: 'Olá',
        idempotencyKey: 'key-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
