import { ConflictException, Injectable } from '@nestjs/common';
import { config } from '@config/config';
import { AgentEntityDatasource } from '../datasources/agent-entity.datasource';
import { InvalidDataException } from '../exceptions/invalid-data.exception';
import { AgentOutputDto } from './dtos/agent-output.dto';
import { CreateAgentInputDto } from './dtos/create-agent-input.dto';
import { mapAgentDocumentToOutput } from './mappers/agent-read.mapper';
import { Types } from 'mongoose';

@Injectable()
export class CreateAgentUsecase {
  constructor(private readonly datasource: AgentEntityDatasource) {}

  async execute(
    organizationId: string,
    input: CreateAgentInputDto,
  ): Promise<AgentOutputDto> {
    if (!Types.ObjectId.isValid(organizationId)) {
      throw new InvalidDataException('Identificador de organização inválido.');
    }
    const prompt = input.prompt.trim();
    if (prompt.length > config.agents.promptMaxChars) {
      throw new InvalidDataException(
        `Prompt excede o limite de ${config.agents.promptMaxChars} caracteres.`,
      );
    }

    const orgObjectId = new Types.ObjectId(organizationId);
    const whatsappPhone = input.whatsappPhone.trim();
    const exists = await this.datasource.findByWhatsappPhoneInOrganization(
      orgObjectId,
      whatsappPhone,
    );
    if (exists) {
      throw new ConflictException(
        'Já existe agente com este número de WhatsApp na organização.',
      );
    }

    const metaPhoneNumberId = input.metaPhoneNumberId?.trim();
    if (metaPhoneNumberId) {
      const taken =
        await this.datasource.findByMetaPhoneNumberId(metaPhoneNumberId);
      if (taken) {
        throw new ConflictException(
          'Já existe agente com este metaPhoneNumberId.',
        );
      }
    }

    const created = await this.datasource.create({
      organizationId: orgObjectId,
      name: input.name.trim(),
      description: input.description.trim(),
      whatsappPhone,
      metaPhoneNumberId: metaPhoneNumberId || undefined,
      prompt,
    });

    return mapAgentDocumentToOutput(created);
  }
}
