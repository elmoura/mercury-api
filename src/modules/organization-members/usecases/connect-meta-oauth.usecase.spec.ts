import { Types } from 'mongoose';
import { config } from '@config/config';
import { OrganizationEntityDatasource } from '@modules/admin/organizations/datasources/organization-entity.datasource';
import { ConnectMetaOauthUsecase } from './connect-meta-oauth.usecase';

function encodeState(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64');
}

describe('ConnectMetaOauthUsecase', () => {
  const originalFetch = global.fetch;
  const organizationDatasourceMock = {
    findById: jest.fn(),
    updateById: jest.fn(),
  };

  const usecase = new ConnectMetaOauthUsecase(
    organizationDatasourceMock as unknown as OrganizationEntityDatasource,
  );

  const organizationId = new Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();
    organizationDatasourceMock.findById.mockResolvedValue({
      _id: new Types.ObjectId(organizationId),
      name: 'Org',
    });
    organizationDatasourceMock.updateById.mockResolvedValue({
      _id: new Types.ObjectId(organizationId),
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('deve conectar com sucesso quando state é válido', async () => {
    const state = encodeState({
      nonce: 'n1',
      org: organizationId,
      t: Date.now(),
    });

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'short-token',
          expires_in: 3600,
          token_type: 'bearer',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'long-token',
          expires_in: 5184000,
          token_type: 'bearer',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: 'biz_1' }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: 'waba_1' }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: 'phone-id-1',
              display_phone_number: '+55 11 99999-1234',
              verified_name: 'Empresa XPTO',
              quality_rating: 'GREEN',
              code_verification_status: 'VERIFIED',
              name_status: 'APPROVED',
            },
          ],
        }),
      }) as unknown as typeof fetch;

    const result = await usecase.execute({
      organizationId,
      code: 'code-ok',
      redirectUri: 'http://localhost:5173/oauth/meta/callback',
      state,
    });

    expect(result.connected).toBe(true);
    expect(result.facebookBusinessId).toBe('biz_1');
    expect(organizationDatasourceMock.updateById).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        whatsappBusinessToken: 'long-token',
        metaTokenType: 'bearer',
        facebookBusinessId: 'biz_1',
      }),
    );
    expect(organizationDatasourceMock.updateById).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        whatsappNumbers: [
          {
            metaPhoneNumberId: 'phone-id-1',
            displayPhoneNumber: '+5511999991234',
            verifiedName: 'Empresa XPTO',
            qualityRating: 'GREEN',
            codeVerificationStatus: 'VERIFIED',
            nameStatus: 'APPROVED',
          },
        ],
      }),
    );
  });

  it('usa token de curta duração quando troca por longa falha', async () => {
    const state = encodeState({
      nonce: 'n1',
      org: organizationId,
      t: Date.now(),
    });

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'short-only',
          expires_in: 7200,
          token_type: 'bearer',
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'invalid' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: 'biz_2' }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      }) as unknown as typeof fetch;

    const result = await usecase.execute({
      organizationId,
      code: 'code-ok',
      redirectUri: 'http://localhost:5173/oauth/meta/callback',
      state,
    });

    expect(result.connected).toBe(true);
    expect(organizationDatasourceMock.updateById).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        whatsappBusinessToken: 'short-only',
        metaTokenType: 'bearer',
      }),
    );
  });

  it('não falha callback quando listagem de números retorna erro', async () => {
    const state = encodeState({
      nonce: 'n1',
      org: organizationId,
      t: Date.now(),
    });

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'short-token',
          expires_in: 3600,
          token_type: 'bearer',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'long-token',
          expires_in: 5184000,
          token_type: 'bearer',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: 'biz_1' }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: 'waba_1' }] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'forbidden' } }),
      }) as unknown as typeof fetch;

    const result = await usecase.execute({
      organizationId,
      code: 'code-ok',
      redirectUri: 'http://localhost:5173/oauth/meta/callback',
      state,
    });

    expect(result.connected).toBe(true);
    expect(organizationDatasourceMock.updateById).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        whatsappBusinessToken: 'long-token',
      }),
    );
  });

  it('deve rejeitar state inválido', async () => {
    await expect(
      usecase.execute({
        organizationId,
        code: 'code-ok',
        redirectUri: 'http://localhost:5173/oauth/meta/callback',
        state: 'state-invalido',
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('deve rejeitar state expirado', async () => {
    const state = encodeState({
      nonce: 'n1',
      org: organizationId,
      t: Date.now() - (config.meta.oauthStateMaxAgeMs + 1000),
    });

    await expect(
      usecase.execute({
        organizationId,
        code: 'code-ok',
        redirectUri: 'http://localhost:5173/oauth/meta/callback',
        state,
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('deve devolver erro controlado quando Graph falha no token', async () => {
    const state = encodeState({
      nonce: 'n1',
      org: organizationId,
      t: Date.now(),
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: 'invalid_grant' } }),
    }) as unknown as typeof fetch;

    await expect(
      usecase.execute({
        organizationId,
        code: 'code-bad',
        redirectUri: 'http://localhost:5173/oauth/meta/callback',
        state,
      }),
    ).rejects.toMatchObject({ status: 400 });
  });
});
