import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { UserRoles } from '@modules/users/entities/user.entity';
import { TenantJwtAuthGuard } from '@modules/auth/guards/tenant-jwt-auth.guard';
import { TenantOrgAdminGuard } from '@modules/auth/guards/tenant-org-admin.guard';
import { GetOrganizationByIdUsecase } from '@modules/admin/organizations/usecases/get-organization-by-id.usecase';
import { ListOrganizationUsersUsecase } from '@modules/admin/organizations/usecases/list-organization-users.usecase';
import { ConnectMetaOauthUsecase } from './usecases/connect-meta-oauth.usecase';
import { OrganizationMembersController } from './organization-members.controller';
import { RemoveOrganizationMemberUsecase } from './usecases/remove-organization-member.usecase';
import { UpdateOrganizationMemberRoleUsecase } from './usecases/update-organization-member-role.usecase';

describe('OrganizationMembersController', () => {
  let controller: OrganizationMembersController;

  const updateRoleMock = { execute: jest.fn() };
  const removeMemberMock = { execute: jest.fn() };
  const getOrganizationByIdMock = { execute: jest.fn() };
  const listOrganizationUsersMock = { execute: jest.fn() };
  const connectMetaOauthMock = { execute: jest.fn() };

  const orgId = '507f1f77bcf86cd799439011';
  const userId = '507f1f77bcf86cd799439012';
  const actorId = new Types.ObjectId();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationMembersController],
      providers: [
        {
          provide: GetOrganizationByIdUsecase,
          useValue: getOrganizationByIdMock,
        },
        {
          provide: ListOrganizationUsersUsecase,
          useValue: listOrganizationUsersMock,
        },
        {
          provide: ConnectMetaOauthUsecase,
          useValue: connectMetaOauthMock,
        },
        {
          provide: UpdateOrganizationMemberRoleUsecase,
          useValue: updateRoleMock,
        },
        {
          provide: RemoveOrganizationMemberUsecase,
          useValue: removeMemberMock,
        },
      ],
    })
      .overrideGuard(TenantJwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantOrgAdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(OrganizationMembersController);
  });

  it('deve chamar updateMemberRole com actorUserId', async () => {
    updateRoleMock.execute.mockResolvedValue({
      _id: userId,
      email: 'a@b.com',
      role: UserRoles.ADMIN,
    });

    const req = {
      tenantUser: { _id: actorId },
    } as Express.Request & { tenantUser: { _id: Types.ObjectId } };

    const result = await controller.updateMemberRole(req, orgId, userId, {
      role: UserRoles.ADMIN,
    });

    expect(updateRoleMock.execute).toHaveBeenCalledWith({
      organizationId: orgId,
      targetUserId: userId,
      actorUserId: actorId.toString(),
      role: UserRoles.ADMIN,
    });
    expect(result.role).toBe(UserRoles.ADMIN);
  });

  it('deve concluir oauth da meta', async () => {
    connectMetaOauthMock.execute.mockResolvedValue({
      connected: true,
      facebookBusinessId: '123',
      tokenExpiresAt: null,
    });

    const result = await controller.connectMetaOauth(orgId, {
      code: 'abc',
      redirectUri: 'http://localhost:5173/oauth/meta/callback',
      state: Buffer.from(
        JSON.stringify({ nonce: 'n1', org: orgId, t: Date.now() }),
      ).toString('base64'),
    });
    expect(connectMetaOauthMock.execute).toHaveBeenCalledWith({
      organizationId: orgId,
      code: 'abc',
      redirectUri: 'http://localhost:5173/oauth/meta/callback',
      state: expect.any(String),
    });
    expect(result.connected).toBe(true);
  });

  it('deve buscar detalhes da organização', async () => {
    getOrganizationByIdMock.execute.mockResolvedValue({
      _id: orgId,
      name: 'Acme',
    });

    const result = await controller.getOrganizationById(orgId);
    expect(getOrganizationByIdMock.execute).toHaveBeenCalledWith(orgId);
    expect(result._id).toBe(orgId);
  });

  it('deve listar usuários da organização com paginação', async () => {
    listOrganizationUsersMock.execute.mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
    });

    const result = await controller.listOrganizationUsers(orgId, {
      page: 1,
      pageSize: 20,
    });
    expect(listOrganizationUsersMock.execute).toHaveBeenCalledWith(orgId, {
      page: 1,
      pageSize: 20,
    });
    expect(result.total).toBe(0);
  });

  it('deve chamar removeMember com actorUserId', async () => {
    removeMemberMock.execute.mockResolvedValue(undefined);

    const req = {
      tenantUser: { _id: actorId },
    } as Express.Request & { tenantUser: { _id: Types.ObjectId } };

    await controller.removeMember(req, orgId, userId);

    expect(removeMemberMock.execute).toHaveBeenCalledWith({
      organizationId: orgId,
      targetUserId: userId,
      actorUserId: actorId.toString(),
    });
  });
});
