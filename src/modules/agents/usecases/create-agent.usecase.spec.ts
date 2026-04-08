import { Types } from 'mongoose';
import { config } from '@config/config';
import { AgentEntityDatasource } from '../datasources/agent-entity.datasource';
import { CreateAgentUsecase } from './create-agent.usecase';

describe('CreateAgentUsecase', () => {
  const datasourceMock = {
    findByWhatsappPhoneInOrganization: jest.fn(),
    create: jest.fn(),
  };

  const usecase = new CreateAgentUsecase(
    datasourceMock as unknown as AgentEntityDatasource,
  );

  const organizationId = new Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();
    datasourceMock.findByWhatsappPhoneInOrganization.mockResolvedValue(null);
    datasourceMock.create.mockImplementation((input) =>
      Promise.resolve({
        _id: new Types.ObjectId(),
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  });

  it('deve criar agente com sucesso', async () => {
    const result = await usecase.execute(organizationId, {
      name: 'Agente A',
      description: 'Descrição',
      whatsappPhone: '+5511999999999',
      prompt: 'Prompt base',
    });

    expect(result.name).toBe('Agente A');
    expect(result.organizationId).toBe(organizationId);
    expect(datasourceMock.create).toHaveBeenCalled();
  });

  it('deve rejeitar prompt acima do limite', async () => {
    const prompt = 'x'.repeat(config.agents.promptMaxChars + 1);
    await expect(
      usecase.execute(organizationId, {
        name: 'Agente A',
        description: 'Descrição',
        whatsappPhone: '+5511999999999',
        prompt,
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('deve rejeitar whatsappPhone duplicado no tenant', async () => {
    datasourceMock.findByWhatsappPhoneInOrganization.mockResolvedValue({
      _id: new Types.ObjectId(),
    });
    await expect(
      usecase.execute(organizationId, {
        name: 'Agente A',
        description: 'Descrição',
        whatsappPhone: '+5511999999999',
        prompt: 'Prompt',
      }),
    ).rejects.toMatchObject({ status: 409 });
  });
});
