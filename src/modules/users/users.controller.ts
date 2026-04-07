import { Body, Controller, Patch } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfirmAccountInputDto } from './usecases/dtos/confirm-account-input.dto';
import { ConfirmAccountOutputDto } from './usecases/dtos/confirm-account-output.dto';
import { ConfirmAccountUsecase } from './usecases/confirm-account.usecase';

@ApiTags('Usuários')
@Controller('users')
export class UsersController {
  constructor(private readonly confirmAccountUsecase: ConfirmAccountUsecase) {}

  @Patch('confirm-account')
  @ApiOperation({
    summary: 'Confirmar conta (definir senha e dados)',
    description:
      'Confirma convite ou fluxo legado usando `hash` (token ou hash MD5) e define senha; opcionalmente atualiza nome e telefone.',
  })
  @ApiBody({ type: ConfirmAccountInputDto })
  @ApiResponse({
    status: 200,
    description: 'Usuário confirmado (sem senha na resposta).',
    type: ConfirmAccountOutputDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async confirmAccount(
    @Body() body: ConfirmAccountInputDto,
  ): Promise<ConfirmAccountOutputDto> {
    return await this.confirmAccountUsecase.execute(body);
  }
}
