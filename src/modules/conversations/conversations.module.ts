import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantJwtAuthGuard } from '@modules/auth/guards/tenant-jwt-auth.guard';
import { UsersModule } from '@modules/users/users.module';
import {
  OrganizationEntity,
  OrganizationSchema,
} from '@modules/admin/organizations/entities/organization.entity';
import { AgentEntity, AgentSchema } from '@modules/agents/entities/agent.entity';
import { ContactEntity, ContactSchema } from './entities/contact.entity';
import {
  ConversationEntity,
  ConversationSchema,
} from './entities/conversation.entity';
import { MessageEntity, MessageSchema } from './entities/message.entity';
import { ConversationEntityDatasource } from './datasources/conversation-entity.datasource';
import { MessageEntityDatasource } from './datasources/message-entity.datasource';
import { ListConversationsUsecase } from './usecases/list-conversations.usecase';
import { ConversationsController } from './conversations.controller';
import { SendManualMessageUsecase } from './usecases/send-manual-message.usecase';
import { WhatsappGraphService } from './services/whatsapp-graph.service';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: ConversationEntity.name, schema: ConversationSchema },
      { name: ContactEntity.name, schema: ContactSchema },
      { name: MessageEntity.name, schema: MessageSchema },
      { name: OrganizationEntity.name, schema: OrganizationSchema },
      { name: AgentEntity.name, schema: AgentSchema },
    ]),
  ],
  controllers: [ConversationsController],
  providers: [
    TenantJwtAuthGuard,
    ConversationEntityDatasource,
    MessageEntityDatasource,
    WhatsappGraphService,
    ListConversationsUsecase,
    SendManualMessageUsecase,
  ],
})
export class ConversationsModule {}
