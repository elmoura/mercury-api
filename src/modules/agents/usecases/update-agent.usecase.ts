import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { config } from '@config/config';
import { Types } from 'mongoose';
import { AgentEntityDatasource } from '../datasources/agent-entity.datasource';
import { InvalidDataException } from '../exceptions/invalid-data.exception';
import { AgentOutputDto } from './dtos/agent-output.dto';
import { UpdateAgentInputDto } from './dtos/update-agent-input.dto';
import { mapAgentDocumentToOutput } from './mappers/agent-read.mapper';

@Injectable()
export class UpdateAgentUsecase {
  constructor(private readonly datasource: AgentEntityDatasource) {}

  async execute(
    organizationId: string,
    agentId: string,
    input: UpdateAgentInputDto,
  ): Promise<AgentOutputDto> {
    if (!Types.ObjectId.isValid(organizationId)) {
      throw new InvalidDataException('Identificador de organização inválido.');
    }
    if (!Types.ObjectId.isValid(agentId)) {
      throw new InvalidDataException('Identificador de agente inválido.');
    }

    const target = await this.datasource.findById(new Types.ObjectId(agentId));
    if (!target || target.organizationId.toString() !== organizationId) {
      throw new NotFoundException('Agente não encontrado.');
    }

    const updateData: Record<string, unknown> = {};
    if (typeof input.name === 'string') {
      updateData.name = input.name.trim();
    }
    if (typeof input.description === 'string') {
      updateData.description = input.description.trim();
    }
    if (typeof input.prompt === 'string') {
      const prompt = input.prompt.trim();
      if (prompt.length > config.agents.promptMaxChars) {
        throw new InvalidDataException(
          `Prompt excede o limite de ${config.agents.promptMaxChars} caracteres.`,
        );
      }
      updateData.prompt = prompt;
    }
    if (typeof input.whatsappPhone === 'string') {
      const whatsappPhone = input.whatsappPhone.trim();
      const conflict = await this.datasource.findByWhatsappPhoneInOrganization(
        new Types.ObjectId(organizationId),
        whatsappPhone,
      );
      if (conflict && conflict._id.toString() !== agentId) {
        throw new ConflictException(
          'Já existe agente com este número de WhatsApp na organização.',
        );
      }
      updateData.whatsappPhone = whatsappPhone;
    }
    if (input.metaPhoneNumberId !== undefined) {
      const mid = input.metaPhoneNumberId.trim();
      if (mid) {
        const other = await this.datasource.findByMetaPhoneNumberId(mid);
        if (other && other._id.toString() !== agentId) {
          throw new ConflictException(
            'Já existe agente com este metaPhoneNumberId.',
          );
        }
        updateData.metaPhoneNumberId = mid;
      } else {
        updateData.$unset = { metaPhoneNumberId: '' };
      }
    }

    const updated = await this.datasource.update(
      new Types.ObjectId(agentId),
      updateData,
    );
    if (!updated) {
      throw new InvalidDataException('Não foi possível atualizar o agente.');
    }

    return mapAgentDocumentToOutput(updated);
  }
}
