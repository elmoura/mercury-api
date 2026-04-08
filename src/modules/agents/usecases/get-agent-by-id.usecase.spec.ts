import { Types } from 'mongoose';
import { AgentEntityDatasource } from '../datasources/agent-entity.datasource';
import { GetAgentByIdUsecase } from './get-agent-by-id.usecase';

describe('GetAgentByIdUsecase', () => {
  const datasourceMock = {
    findById: jest.fn(),
  };

  const usecase = new GetAgentByIdUsecase(
    datasourceMock as unknown as AgentEntityDatasource,
  );

  const organizationA = new Types.ObjectId();
  const organizationB = new Types.ObjectId();
  const agentId = new Types.ObjectId();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar agente quando pertence ao mesmo tenant', async () => {
    datasourceMock.findById.mockResolvedValue({
      _id: agentId,
      organizationId: organizationA,
      name: 'Agente A',
      description: 'Desc',
      whatsappPhone: '+5511999999999',
      prompt: 'Prompt',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await usecase.execute(
      organizationA.toString(),
      agentId.toString(),
    );
    expect(result._id).toBe(agentId.toString());
  });

  it('deve retornar 404 para isolamento entre tenants', async () => {
    datasourceMock.findById.mockResolvedValue({
      _id: agentId,
      organizationId: organizationB,
      name: 'Agente B',
      description: 'Desc',
      whatsappPhone: '+5511888888888',
      prompt: 'Prompt',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      usecase.execute(organizationA.toString(), agentId.toString()),
    ).rejects.toMatchObject({ status: 404 });
  });
});
