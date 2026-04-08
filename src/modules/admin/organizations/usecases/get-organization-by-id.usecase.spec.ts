import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { OrganizationEntityDatasource } from '../datasources/organization-entity.datasource';
import { InvalidDataException } from '../exceptions/invalid-data.exception';
import { OrganizationPlanTypes } from '../entities/organization.entity';
import { GetOrganizationByIdUsecase } from './get-organization-by-id.usecase';

describe('GetOrganizationByIdUsecase', () => {
  const organizationDatasourceMock = {
    findById: jest.fn(),
  };

  let usecase: GetOrganizationByIdUsecase;

  beforeEach(() => {
    jest.clearAllMocks();
    usecase = new GetOrganizationByIdUsecase(
      organizationDatasourceMock as unknown as OrganizationEntityDatasource,
    );
  });

  it('deve lançar InvalidDataException quando o id não é ObjectId válido', async () => {
    await expect(usecase.execute('x')).rejects.toBeInstanceOf(
      InvalidDataException,
    );
    expect(organizationDatasourceMock.findById).not.toHaveBeenCalled();
  });

  it('deve lançar NotFoundException quando não existir', async () => {
    const id = new Types.ObjectId().toString();
    organizationDatasourceMock.findById.mockResolvedValue(null);

    await expect(usecase.execute(id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deve retornar detalhe quando existir', async () => {
    const oid = new Types.ObjectId();
    organizationDatasourceMock.findById.mockResolvedValue({
      _id: oid,
      name: 'Mercury',
      ownerId: new Types.ObjectId().toString(),
      planType: OrganizationPlanTypes.BUSINESS,
      get: (k: string) => {
        if (k === 'createdAt') {
          return new Date('2024-01-01T00:00:00.000Z');
        }
        if (k === 'updatedAt') {
          return new Date('2024-01-02T00:00:00.000Z');
        }
        return undefined;
      },
    });

    const out = await usecase.execute(oid.toString());

    expect(out._id).toBe(oid.toString());
    expect(out.name).toBe('Mercury');
    expect(out.planType).toBe(OrganizationPlanTypes.BUSINESS);
    expect(out.hasWhatsappIntegration).toBe(false);
    expect(out.whatsappTokenExpiresAt).toBeNull();
    expect(out.facebookBusinessId).toBeNull();
    expect(out.whatsappNumbers).toEqual([]);
    expect(out).not.toHaveProperty('whatsappBusinessToken');
  });

  it('não expõe whatsappBusinessToken mesmo quando persistido', async () => {
    const oid = new Types.ObjectId();
    organizationDatasourceMock.findById.mockResolvedValue({
      _id: oid,
      name: 'Venus',
      ownerId: null,
      planType: OrganizationPlanTypes.STARTER,
      whatsappBusinessToken: 'secret-token-must-not-leak',
      facebookBusinessId: 'biz-1',
      tokenExpiresAt: new Date('2025-06-01T12:00:00.000Z'),
      whatsappNumbers: ['5511999999999'],
      get: (k: string) => {
        if (k === 'createdAt') {
          return new Date('2024-01-01T00:00:00.000Z');
        }
        if (k === 'updatedAt') {
          return new Date('2024-01-02T00:00:00.000Z');
        }
        if (k === 'whatsappBusinessToken') {
          return 'secret-token-must-not-leak';
        }
        if (k === 'tokenExpiresAt') {
          return new Date('2025-06-01T12:00:00.000Z');
        }
        return undefined;
      },
    });

    const out = await usecase.execute(oid.toString());

    expect(out.hasWhatsappIntegration).toBe(true);
    expect(out.facebookBusinessId).toBe('biz-1');
    expect(out.whatsappTokenExpiresAt).toBe('2025-06-01T12:00:00.000Z');
    expect(out.whatsappNumbers).toEqual(['5511999999999']);
    expect(out).not.toHaveProperty('whatsappBusinessToken');
  });
});
