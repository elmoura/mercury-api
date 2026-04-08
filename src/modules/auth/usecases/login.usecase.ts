import { Injectable, UnauthorizedException } from '@nestjs/common';
import { config } from '@config/config';
import { Md5HashService } from '@shared/services/md5-hash.service';
import { UserEntityDatasource } from '@modules/users/datasources/user-entity.datasource';
import { AccountStatus } from '@modules/users/entities/user.entity';
import { TenantJwtService } from '../tenant-jwt.service';
import { LoginInputDto } from './dtos/login-input.dto';
import { LoginOutputDto } from './dtos/login-output.dto';

@Injectable()
export class LoginUsecase {
  constructor(
    private readonly userDatasource: UserEntityDatasource,
    private readonly md5HashService: Md5HashService,
    private readonly tenantJwt: TenantJwtService,
  ) {}

  async execute(input: LoginInputDto): Promise<LoginOutputDto> {
    const email = input.email.toLowerCase().trim();
    const user = await this.userDatasource.findByEmail(email);

    if (!user?.password) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const passwordPlain = `${config.security.passwordMd5Salt}${input.password}`;
    const passwordOk = this.md5HashService.decrypt(
      user.password,
      passwordPlain,
    );
    if (!passwordOk) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (user.accountStatus !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const accessToken = this.tenantJwt.signAccessToken(
      user._id.toString(),
      user.organizationId.toString(),
    );

    return {
      accessToken,
      tokenType: 'Bearer',
    };
  }
}
