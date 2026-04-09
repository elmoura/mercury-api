import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { TenantJwtAuthGuard } from '@modules/auth/guards/tenant-jwt-auth.guard';
import { ListConversationsUsecase } from './usecases/list-conversations.usecase';
import { ListConversationsQueryDto } from './usecases/dtos/list-conversations-query.dto';
import { ListConversationsOutputDto } from './usecases/dtos/conversation-summary-output.dto';
import { SendManualMessageUsecase } from './usecases/send-manual-message.usecase';
import { SendManualMessageInputDto } from './usecases/dtos/send-manual-message-input.dto';
import { SendManualMessageOutputDto } from './usecases/dtos/send-manual-message-output.dto';

@ApiTags('Conversas (tenant)')
@ApiBearerAuth('tenant-jwt')
@Controller('organizations/:organizationId/conversations')
@UseGuards(TenantJwtAuthGuard)
export class ConversationsController {
  constructor(
    private readonly listConversationsUsecase: ListConversationsUsecase,
    private readonly sendManualMessageUsecase: SendManualMessageUsecase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar conversas por agente (filtro de status opcional)',
  })
  @ApiParam({ name: 'organizationId', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, type: ListConversationsOutputDto })
  async list(
    @Param('organizationId') organizationId: string,
    @Query() query: ListConversationsQueryDto,
  ): Promise<ListConversationsOutputDto> {
    return await this.listConversationsUsecase.execute(organizationId, query);
  }

  @Post(':conversationId/messages')
  @ApiOperation({
    summary: 'Enviar mensagem manual de texto para uma conversa',
  })
  @ApiParam({ name: 'organizationId', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'conversationId', example: '507f1f77bcf86cd799439012' })
  @ApiBody({ type: SendManualMessageInputDto })
  @ApiResponse({ status: 201, type: SendManualMessageOutputDto })
  @ApiResponse({
    status: 400,
    description: 'Payload inválido, org sem token ou agente sem phone_number_id.',
  })
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido.' })
  @ApiForbiddenResponse({
    description: 'Usuário sem acesso ao tenant da organização.',
  })
  @ApiNotFoundResponse({
    description: 'Conversa, agente ou contato não encontrados.',
  })
  @ApiResponse({
    status: 502,
    description: 'Falha no envio para a API da Meta.',
  })
  async sendManualMessage(
    @Param('organizationId') organizationId: string,
    @Param('conversationId') conversationId: string,
    @Body() body: SendManualMessageInputDto,
  ): Promise<SendManualMessageOutputDto> {
    return await this.sendManualMessageUsecase.execute({
      organizationId,
      conversationId,
      text: body.text,
      idempotencyKey: body.idempotencyKey,
    });
  }
}
