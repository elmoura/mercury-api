import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';
import { AgentDocument, AgentEntity } from '../entities/agent.entity';

type CreateAgentInput = Omit<AgentEntity, '_id' | 'createdAt' | 'updatedAt'>;

@Injectable()
export class AgentEntityDatasource {
  constructor(
    @InjectModel(AgentEntity.name)
    private readonly agentModel: Model<AgentEntity>,
  ) {}

  async create(input: CreateAgentInput): Promise<AgentDocument> {
    const [agent] = await this.agentModel.create([input]);
    return agent;
  }

  async findById(id: Types.ObjectId): Promise<AgentDocument | null> {
    return this.agentModel.findById(id).exec();
  }

  async findByWhatsappPhoneInOrganization(
    organizationId: Types.ObjectId,
    whatsappPhone: string,
  ): Promise<AgentDocument | null> {
    return this.agentModel.findOne({ organizationId, whatsappPhone }).exec();
  }

  async findByMetaPhoneNumberId(
    metaPhoneNumberId: string,
  ): Promise<AgentDocument | null> {
    return this.agentModel.findOne({ metaPhoneNumberId }).exec();
  }

  async findByOrganizationIdPaginated(
    organizationId: Types.ObjectId,
    params: { page: number; pageSize: number; nameContains?: string },
  ): Promise<{ items: AgentDocument[]; total: number }> {
    const filter: Record<string, unknown> = { organizationId };
    const raw = params.nameContains?.trim();
    if (raw) {
      const esc = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.name = new RegExp(esc, 'i');
    }
    const skip = (params.page - 1) * params.pageSize;

    const [items, total] = await Promise.all([
      this.agentModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(params.pageSize)
        .exec(),
      this.agentModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async update(
    agentId: Types.ObjectId,
    data: UpdateQuery<AgentDocument>,
  ): Promise<AgentDocument | null> {
    return this.agentModel
      .findByIdAndUpdate(agentId, data, { returnDocument: 'after' })
      .exec();
  }

  async delete(agentId: Types.ObjectId): Promise<boolean> {
    const result = await this.agentModel.deleteOne({ _id: agentId }).exec();
    return result.deletedCount > 0;
  }
}
