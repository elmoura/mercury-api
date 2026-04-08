import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { AgentEntityDatasource } from '../datasources/agent-entity.datasource';
import { InvalidDataException } from '../exceptions/invalid-data.exception';
import { ListAgentsOutputDto } from './dtos/agent-output.dto';
import { ListAgentsQueryDto } from './dtos/list-agents-query.dto';
import { mapAgentDocumentToOutput } from './mappers/agent-read.mapper';

@Injectable()
export class ListAgentsUsecase {
  constructor(private readonly datasource: AgentEntityDatasource) {}

  async execute(
    organizationId: string,
    query: ListAgentsQueryDto,
  ): Promise<ListAgentsOutputDto> {
    if (!Types.ObjectId.isValid(organizationId)) {
      throw new InvalidDataException('Identificador de organização inválido.');
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const orgObjectId = new Types.ObjectId(organizationId);
    const { items, total } =
      await this.datasource.findByOrganizationIdPaginated(orgObjectId, {
        page,
        pageSize,
        nameContains: query.name,
      });

    return {
      items: items.map(mapAgentDocumentToOutput),
      page,
      pageSize,
      total,
    };
  }
}
