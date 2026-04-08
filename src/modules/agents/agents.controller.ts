import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { TenantJwtAuthGuard } from '@modules/auth/guards/tenant-jwt-auth.guard';
import { CreateAgentUsecase } from './usecases/create-agent.usecase';
import { DeleteAgentUsecase } from './usecases/delete-agent.usecase';
import { GetAgentByIdUsecase } from './usecases/get-agent-by-id.usecase';
import { ListAgentsUsecase } from './usecases/list-agents.usecase';
import { UpdateAgentUsecase } from './usecases/update-agent.usecase';
import {
  AgentOutputDto,
  ListAgentsOutputDto,
} from './usecases/dtos/agent-output.dto';
import { CreateAgentInputDto } from './usecases/dtos/create-agent-input.dto';
import { ListAgentsQueryDto } from './usecases/dtos/list-agents-query.dto';
import { UpdateAgentInputDto } from './usecases/dtos/update-agent-input.dto';

@ApiTags('Agentes (tenant)')
@ApiBearerAuth('tenant-jwt')
@Controller('organizations/:organizationId/agents')
@UseGuards(TenantJwtAuthGuard)
export class AgentsController {
  constructor(
    private readonly createAgentUsecase: CreateAgentUsecase,
    private readonly listAgentsUsecase: ListAgentsUsecase,
    private readonly getAgentByIdUsecase: GetAgentByIdUsecase,
    private readonly updateAgentUsecase: UpdateAgentUsecase,
    private readonly deleteAgentUsecase: DeleteAgentUsecase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar agente no tenant' })
  @ApiParam({ name: 'organizationId', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ type: CreateAgentInputDto })
  @ApiResponse({ status: 201, type: AgentOutputDto })
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido' })
  @ApiNotFoundResponse({ description: 'Organização não encontrada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Conflito de whatsappPhone' })
  async create(
    @Param('organizationId') organizationId: string,
    @Body() body: CreateAgentInputDto,
  ): Promise<AgentOutputDto> {
    return await this.createAgentUsecase.execute(organizationId, body);
  }

  @Get()
  @ApiOperation({ summary: 'Listar agentes da organização (paginado)' })
  @ApiParam({ name: 'organizationId', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, type: ListAgentsOutputDto })
  async list(
    @Param('organizationId') organizationId: string,
    @Query() query: ListAgentsQueryDto,
  ): Promise<ListAgentsOutputDto> {
    return await this.listAgentsUsecase.execute(organizationId, query);
  }

  @Get(':agentId')
  @ApiOperation({ summary: 'Obter agente por id no tenant' })
  @ApiParam({ name: 'organizationId', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'agentId', example: '507f1f77bcf86cd799439012' })
  @ApiResponse({ status: 200, type: AgentOutputDto })
  @ApiNotFoundResponse({ description: 'Agente não encontrado' })
  async getById(
    @Param('organizationId') organizationId: string,
    @Param('agentId') agentId: string,
  ): Promise<AgentOutputDto> {
    return await this.getAgentByIdUsecase.execute(organizationId, agentId);
  }

  @Patch(':agentId')
  @ApiOperation({ summary: 'Atualizar agente no tenant' })
  @ApiParam({ name: 'organizationId', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'agentId', example: '507f1f77bcf86cd799439012' })
  @ApiBody({ type: UpdateAgentInputDto })
  @ApiResponse({ status: 200, type: AgentOutputDto })
  @ApiNotFoundResponse({ description: 'Agente não encontrado' })
  @ApiResponse({ status: 409, description: 'Conflito de whatsappPhone' })
  async update(
    @Param('organizationId') organizationId: string,
    @Param('agentId') agentId: string,
    @Body() body: UpdateAgentInputDto,
  ): Promise<AgentOutputDto> {
    return await this.updateAgentUsecase.execute(organizationId, agentId, body);
  }

  @Delete(':agentId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remover agente no tenant' })
  @ApiParam({ name: 'organizationId', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'agentId', example: '507f1f77bcf86cd799439012' })
  @ApiNoContentResponse({ description: 'Agente removido' })
  @ApiNotFoundResponse({ description: 'Agente não encontrado' })
  async delete(
    @Param('organizationId') organizationId: string,
    @Param('agentId') agentId: string,
  ): Promise<void> {
    await this.deleteAgentUsecase.execute(organizationId, agentId);
  }
}
