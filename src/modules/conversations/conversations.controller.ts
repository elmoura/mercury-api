import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TenantJwtAuthGuard } from '@modules/auth/guards/tenant-jwt-auth.guard';
import { ListConversationsUsecase } from './usecases/list-conversations.usecase';
import { ListConversationsQueryDto } from './usecases/dtos/list-conversations-query.dto';
import { ListConversationsOutputDto } from './usecases/dtos/conversation-summary-output.dto';

@ApiTags('Conversas (tenant)')
@ApiBearerAuth('tenant-jwt')
@Controller('organizations/:organizationId/conversations')
@UseGuards(TenantJwtAuthGuard)
export class ConversationsController {
  constructor(
    private readonly listConversationsUsecase: ListConversationsUsecase,
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
}
