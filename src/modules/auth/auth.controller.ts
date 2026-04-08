import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoginInputDto } from './usecases/dtos/login-input.dto';
import { LoginOutputDto } from './usecases/dtos/login-output.dto';
import { LoginUsecase } from './usecases/login.usecase';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly loginUsecase: LoginUsecase) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login',
    description:
      'Autentica por e-mail e senha (mesmo hash MD5 do fluxo de confirmação de conta) e devolve JWT de tenant (`sub` + `org`).',
  })
  @ApiBody({ type: LoginInputDto })
  @ApiResponse({
    status: 200,
    description: 'Token emitido',
    type: LoginOutputDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Credenciais inválidas ou conta inativa',
  })
  async login(@Body() body: LoginInputDto): Promise<LoginOutputDto> {
    return await this.loginUsecase.execute(body);
  }
}
