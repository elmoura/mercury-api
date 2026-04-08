import { UnauthorizedException } from '@nestjs/common';
import { Types } from 'mongoose';
import { Md5HashService } from '@shared/services/md5-hash.service';
import { UserEntityDatasource } from '@modules/users/datasources/user-entity.datasource';
import { AccountStatus, UserRoles } from '@modules/users/entities/user.entity';
import { TenantJwtService } from '../tenant-jwt.service';
import { LoginUsecase } from './login.usecase';

describe('LoginUsecase', () => {
  const userId = new Types.ObjectId();
  const organizationId = new Types.ObjectId();

  const userDatasourceMock = {
    findByEmail: jest.fn(),
  };

  const md5HashServiceMock = {
    decrypt: jest.fn(),
  };

  const tenantJwtMock = {
    signAccessToken: jest.fn(),
  };

  let usecase: LoginUsecase;

  beforeEach(() => {
    jest.clearAllMocks();
    usecase = new LoginUsecase(
      userDatasourceMock as unknown as UserEntityDatasource,
      md5HashServiceMock as unknown as Md5HashService,
      tenantJwtMock as unknown as TenantJwtService,
    );
  });

  it('deve retornar JWT quando credenciais e estado da conta estão corretos', async () => {
    userDatasourceMock.findByEmail.mockResolvedValue({
      _id: userId,
      organizationId,
      password: 'hash-armazenado',
      accountStatus: AccountStatus.ACTIVE,
      role: UserRoles.MEMBER,
    });
    md5HashServiceMock.decrypt.mockReturnValue(true);
    tenantJwtMock.signAccessToken.mockReturnValue('jwt-token');

    const result = await usecase.execute({
      email: ' Ana@Exemplo.COM ',
      password: 'senha1234',
    });

    expect(userDatasourceMock.findByEmail).toHaveBeenCalledWith(
      'ana@exemplo.com',
    );
    expect(md5HashServiceMock.decrypt).toHaveBeenCalled();
    expect(tenantJwtMock.signAccessToken).toHaveBeenCalledWith(
      userId.toString(),
      organizationId.toString(),
    );
    expect(result).toEqual({
      accessToken: 'jwt-token',
      tokenType: 'Bearer',
    });
  });

  it('deve lançar Unauthorized quando utilizador não existe', async () => {
    userDatasourceMock.findByEmail.mockResolvedValue(null);

    await expect(
      usecase.execute({ email: 'x@y.com', password: 'senha1234' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('deve lançar Unauthorized quando senha não confere', async () => {
    userDatasourceMock.findByEmail.mockResolvedValue({
      _id: userId,
      organizationId,
      password: 'hash',
      accountStatus: AccountStatus.ACTIVE,
    });
    md5HashServiceMock.decrypt.mockReturnValue(false);

    await expect(
      usecase.execute({ email: 'a@b.com', password: 'errada1234' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('deve lançar Unauthorized quando conta não está ativa', async () => {
    userDatasourceMock.findByEmail.mockResolvedValue({
      _id: userId,
      organizationId,
      password: 'hash',
      accountStatus: AccountStatus.PENDING_CONFIRMATION,
    });
    md5HashServiceMock.decrypt.mockReturnValue(true);

    await expect(
      usecase.execute({ email: 'a@b.com', password: 'senha1234' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('deve lançar Unauthorized quando não há password no documento', async () => {
    userDatasourceMock.findByEmail.mockResolvedValue({
      _id: userId,
      organizationId,
      accountStatus: AccountStatus.ACTIVE,
    });

    await expect(
      usecase.execute({ email: 'a@b.com', password: 'senha1234' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
