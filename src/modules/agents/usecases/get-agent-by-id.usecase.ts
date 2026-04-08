import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AgentEntityDatasource } from '../datasources/agent-entity.datasource';
import { InvalidDataException } from '../exceptions/invalid-data.exception';
import { AgentOutputDto } from './dtos/agent-output.dto';
import { mapAgentDocumentToOutput } from './mappers/agent-read.mapper';

@Injectable()
export class GetAgentByIdUsecase {
  constructor(private readonly datasource: AgentEntityDatasource) {}

  async execute(
    organizationId: string,
    agentId: string,
  ): Promise<AgentOutputDto> {
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

    return mapAgentDocumentToOutput(doc);
  }
}
