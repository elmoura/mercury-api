import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AgentEntityDatasource } from '../datasources/agent-entity.datasource';
import { InvalidDataException } from '../exceptions/invalid-data.exception';

@Injectable()
export class DeleteAgentUsecase {
  constructor(private readonly datasource: AgentEntityDatasource) {}

  async execute(organizationId: string, agentId: string): Promise<void> {
    if (!Types.ObjectId.isValid(organizationId)) {
      throw new InvalidDataException('Identificador de organização inválido.');
    }
    if (!Types.ObjectId.isValid(agentId)) {
      throw new InvalidDataException('Identificador de agente inválido.');
    }

    const doc = await this.datasource.findById(new Types.ObjectId(agentId));
    if (!doc || doc.organizationId.toString() !== organizationId) {
      throw new NotFoundException('Agente não encontrado.');
    }

    await this.datasource.delete(new Types.ObjectId(agentId));
  }
}
