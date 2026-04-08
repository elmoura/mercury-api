import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantJwtAuthGuard } from '@modules/auth/guards/tenant-jwt-auth.guard';
import { TenantOrgAdminGuard } from '@modules/auth/guards/tenant-org-admin.guard';
import { OrganizationEntityDatasource } from '@modules/admin/organizations/datasources/organization-entity.datasource';
import {
  OrganizationEntity,
  OrganizationSchema,
} from '@modules/admin/organizations/entities/organization.entity';
import { UserEntityDatasource } from '@modules/users/datasources/user-entity.datasource';
import { UserEntity, UserSchema } from '@modules/users/entities/user.entity';
import { AgentsController } from './agents.controller';
import { AgentEntityDatasource } from './datasources/agent-entity.datasource';
import { AgentEntity, AgentSchema } from './entities/agent.entity';
import { CreateAgentUsecase } from './usecases/create-agent.usecase';
import { DeleteAgentUsecase } from './usecases/delete-agent.usecase';
import { GetAgentByIdUsecase } from './usecases/get-agent-by-id.usecase';
import { ListAgentsUsecase } from './usecases/list-agents.usecase';
import { UpdateAgentUsecase } from './usecases/update-agent.usecase';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AgentEntity.name, schema: AgentSchema },
      { name: UserEntity.name, schema: UserSchema },
      { name: OrganizationEntity.name, schema: OrganizationSchema },
    ]),
  ],
  controllers: [AgentsController],
  providers: [
    TenantJwtAuthGuard,
    TenantOrgAdminGuard,
    UserEntityDatasource,
    OrganizationEntityDatasource,
    AgentEntityDatasource,
    CreateAgentUsecase,
    ListAgentsUsecase,
    GetAgentByIdUsecase,
    UpdateAgentUsecase,
    DeleteAgentUsecase,
  ],
})
export class AgentsModule {}
