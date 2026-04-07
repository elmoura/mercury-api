import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiNoContentResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateOrganizationInputDto } from './usecases/dtos/create-organization-input.dto';
import { CreateOrganizationOutputDto } from './usecases/dtos/create-organization-output.dto';
import { InviteUserInputDto } from './usecases/dtos/invite-user-input.dto';
import { CreateOrganizationUsecase } from './usecases/create-organization.usecase';
import { InviteUserUsecase } from './usecases/invite-user.usecase';

@ApiTags('Organizações (admin)')
@Controller()
export class OrganizationsController {
  constructor(
    private readonly createOrganizationUsecase: CreateOrganizationUsecase,
    private readonly inviteUserUsecase: InviteUserUsecase,
  ) {}

  @Post('admin/organizations')
  @HttpCode(201)
  @ApiOperation({ summary: 'Criar organização e usuário owner' })
  @ApiBody({ type: CreateOrganizationInputDto })
  @ApiResponse({
    status: 201,
    description: 'Organização e owner criados.',
    type: CreateOrganizationOutputDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async create(
    @Body() body: CreateOrganizationInputDto,
  ): Promise<CreateOrganizationOutputDto> {
    return await this.createOrganizationUsecase.execute(body);
  }

  @Post('organizations/:organizationId/invite-user')
  @HttpCode(204)
  @ApiOperation({ summary: 'Convidar usuário por e-mail' })
  @ApiParam({
    name: 'organizationId',
    description: 'ID da organização (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({ type: InviteUserInputDto })
  @ApiNoContentResponse({ description: 'Convite enviado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async inviteUser(
    @Param('organizationId') organizationId: string,
    @Body() body: InviteUserInputDto,
  ): Promise<void> {
    await this.inviteUserUsecase.execute({
      organizationId,
      email: body.email,
      role: body.role,
    });
  }
}
