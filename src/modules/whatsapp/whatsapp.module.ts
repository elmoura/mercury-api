import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgentEntityDatasource } from '@modules/agents/datasources/agent-entity.datasource';
import {
  AgentEntity,
  AgentSchema,
} from '@modules/agents/entities/agent.entity';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappVerificationChallengeUsecase } from './usecases/whatsapp-verification-challenge.usecase';
import { ReceiveWhatsappMessageUsecase } from './usecases/receive-whatsapp-message.usecase';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AgentEntity.name, schema: AgentSchema },
    ]),
  ],
  controllers: [WhatsappController],
  providers: [
    WhatsappVerificationChallengeUsecase,
    AgentEntityDatasource,
    ReceiveWhatsappMessageUsecase,
  ],
})
export class WhatsappModule {}
