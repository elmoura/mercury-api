import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RabbitMqModule } from '@/shared/rabbitmq/rabbitmq.module';
import { config } from './config/config';
import { AuthModule } from './modules/auth/auth.module';
import { TenantJwtModule } from './modules/auth/tenant-jwt.module';
import { OrganizationsModule } from './modules/admin/organizations/organizations.module';
import { AgentsModule } from './modules/agents/agents.module';
import { OrganizationMembersModule } from './modules/organization-members/organization-members.module';
import { UsersModule } from './modules/users/users.module';
import { WhatsappModule } from '@modules/whatsapp/whatsapp.module';
import { ConversationsModule } from '@modules/conversations/conversations.module';

@Module({
  imports: [
    RabbitMqModule,
    TenantJwtModule,
    AuthModule,
    WhatsappModule,
    MongooseModule.forRoot(config.mongoUri),
    OrganizationsModule,
    AgentsModule,
    UsersModule,
    OrganizationMembersModule,
    ConversationsModule,
  ],
  controllers: [],
})
export class AppModule {}
