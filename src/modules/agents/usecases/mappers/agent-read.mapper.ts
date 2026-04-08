import type { AgentDocument } from '@modules/agents/entities/agent.entity';
import { AgentOutputDto } from '../dtos/agent-output.dto';

export function mapAgentDocumentToOutput(doc: AgentDocument): AgentOutputDto {
  return {
    _id: doc._id.toString(),
    organizationId: doc.organizationId.toString(),
    name: doc.name,
    description: doc.description,
    whatsappPhone: doc.whatsappPhone,
    metaPhoneNumberId: doc.metaPhoneNumberId ?? null,
    prompt: doc.prompt,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
