import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantJwtAuthGuard } from '@modules/auth/guards/tenant-jwt-auth.guard';
import { UsersModule } from '@modules/users/users.module';
import { ContactEntity, ContactSchema } from './entities/contact.entity';
import {
  ConversationEntity,
  ConversationSchema,
} from './entities/conversation.entity';
import { ConversationEntityDatasource } from './datasources/conversation-entity.datasource';
import { ListConversationsUsecase } from './usecases/list-conversations.usecase';
import { ConversationsController } from './conversations.controller';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: ConversationEntity.name, schema: ConversationSchema },
      { name: ContactEntity.name, schema: ContactSchema },
    ]),
  ],
  controllers: [ConversationsController],
  providers: [
    TenantJwtAuthGuard,
    ConversationEntityDatasource,
    ListConversationsUsecase,
  ],
})
export class ConversationsModule {}
