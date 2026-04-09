import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { config } from '@config/config';
import { OrganizationEntityDatasource } from '@modules/admin/organizations/datasources/organization-entity.datasource';
import { Types } from 'mongoose';
import { ConnectMetaOauthOutputDto } from './dtos/connect-meta-oauth-output.dto';

type ExchangeTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
};

type GraphBusinessesResponse = {
  data?: Array<{ id?: string }>;
};

type GraphWhatsappBusinessAccountsResponse = {
  data?: Array<{ id?: string }>;
};

type GraphPhoneNumbersResponse = {
  data?: Array<{
    id?: string;
    display_phone_number?: string;
    verified_name?: string;
    quality_rating?: string;
    code_verification_status?: string;
    name_status?: string;
  }>;
};

type DecodedOauthState = {
  org?: string;
  t?: number;
};

@Injectable()
export class ConnectMetaOauthUsecase {
  private readonly logger = new Logger(ConnectMetaOauthUsecase.name);

  constructor(
    private readonly organizationDatasource: OrganizationEntityDatasource,
  ) {}

  async execute(input: {
    organizationId: string;
    code: string;
    redirectUri: string;
    state: string;
  }): Promise<ConnectMetaOauthOutputDto> {
    if (!Types.ObjectId.isValid(input.organizationId)) {
      throw new BadRequestException('Identificador de organização inválido.');
    }

    if (!config.meta.appId || !config.meta.appSecret) {
      throw new BadRequestException(
        'Meta OAuth não configurado (META_APP_ID / META_APP_SECRET).',
      );
    }

    this.validateState(input.state, input.organizationId);

    const organizationId = new Types.ObjectId(input.organizationId);
    const organization =
      await this.organizationDatasource.findById(organizationId);
    if (!organization) {
      throw new NotFoundException('Organização não encontrada.');
    }

    const shortLived = await this.exchangeCode({
      code: input.code,
      redirectUri: input.redirectUri,
    });
    const shortToken = shortLived.access_token;
    if (!shortToken) {
      throw new BadRequestException(
        'Não foi possível obter token de acesso da Meta.',
      );
    }

    const longLived = await this.exchangeForLongLivedUserToken(shortToken);

    const accessToken = longLived?.access_token ?? shortToken;
    const expiresIn = Number(
      longLived?.expires_in ?? shortLived.expires_in ?? 0,
    );
    const tokenType =
      typeof longLived?.token_type === 'string'
        ? longLived.token_type
        : typeof shortLived.token_type === 'string'
          ? shortLived.token_type
          : undefined;

    const tokenExpiresAt =
      Number.isFinite(expiresIn) && expiresIn > 0
        ? new Date(Date.now() + expiresIn * 1000)
        : undefined;

    const facebookBusinessId = await this.resolveFirstBusinessId(accessToken);

    const updated = await this.organizationDatasource.updateById(
      organizationId,
      {
        whatsappBusinessToken: accessToken,
        metaTokenType: tokenType?.trim() || undefined,
        facebookBusinessId: facebookBusinessId ?? undefined,
        tokenExpiresAt,
        tokenLastRefreshedAt: new Date(),
      },
    );

    if (!updated) {
      throw new BadRequestException(
        'Falha ao persistir conexão Meta na organização.',
      );
    }

    await this.trySyncWhatsappNumbers({
      organizationId: input.organizationId,
      accessToken,
      facebookBusinessId,
    });

    return {
      connected: true,
      facebookBusinessId: facebookBusinessId ?? null,
      tokenExpiresAt: tokenExpiresAt?.toISOString() ?? null,
    };
  }

  private async exchangeCode(input: {
    code: string;
    redirectUri: string;
  }): Promise<ExchangeTokenResponse> {
    const params = new URLSearchParams({
      client_id: config.meta.appId,
      client_secret: config.meta.appSecret,
      redirect_uri: input.redirectUri,
      code: input.code,
    });

    const response = await fetch(
      `https://graph.facebook.com/v22.0/oauth/access_token?${params.toString()}`,
    );
    const data = (await response
      .json()
      .catch(() => ({}))) as ExchangeTokenResponse;
    if (!response.ok) {
      throw new BadRequestException('Falha ao trocar code por token na Meta.');
    }
    return data;
  }

  /**
   * Troca o token de curta duração pelo de longa duração (recomendado para WhatsApp Cloud).
   * @see https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived
   */
  private async exchangeForLongLivedUserToken(
    shortLivedToken: string,
  ): Promise<ExchangeTokenResponse | null> {
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: config.meta.appId,
      client_secret: config.meta.appSecret,
      fb_exchange_token: shortLivedToken,
    });

    const response = await fetch(
      `https://graph.facebook.com/v22.0/oauth/access_token?${params.toString()}`,
    );
    const data = (await response
      .json()
      .catch(() => ({}))) as ExchangeTokenResponse;

    if (!response.ok || !data.access_token) {
      return null;
    }

    return data;
  }

  private async resolveFirstBusinessId(
    accessToken: string,
  ): Promise<string | null> {
    const params = new URLSearchParams({
      access_token: accessToken,
      fields: 'id',
      limit: '1',
    });

    const response = await fetch(
      `https://graph.facebook.com/v22.0/me/businesses?${params.toString()}`,
    );
    if (!response.ok) {
      return null;
    }
    const data = (await response
      .json()
      .catch(() => ({}))) as GraphBusinessesResponse;
    const first = data.data?.[0];
    return typeof first?.id === 'string' ? first.id : null;
  }

  /**
   * Decisão técnica M1-20 (Graph API):
   * 1) /me/businesses -> facebookBusinessId
   * 2) /{business-id}/owned_whatsapp_business_accounts -> wabaId
   * 3) /{waba-id}/phone_numbers -> números (display_phone_number)
   *
   * Política de falha: erro na listagem não aborta OAuth após token já persistido.
   */
  private async trySyncWhatsappNumbers(input: {
    organizationId: string;
    accessToken: string;
    facebookBusinessId: string | null;
  }): Promise<void> {
    if (!input.facebookBusinessId) {
      this.logger.warn(
        JSON.stringify({
          msg: 'meta_numbers_sync_skipped',
          organizationId: input.organizationId,
          reason: 'facebook_business_id_not_found',
        }),
      );
      return;
    }

    try {
      const wabaId = await this.resolveFirstWhatsappBusinessAccountId({
        accessToken: input.accessToken,
        facebookBusinessId: input.facebookBusinessId,
      });

      if (!wabaId) {
        this.logger.warn(
          JSON.stringify({
            msg: 'meta_numbers_sync_skipped',
            organizationId: input.organizationId,
            reason: 'waba_not_found_or_forbidden',
            facebookBusinessId: input.facebookBusinessId,
          }),
        );
        return;
      }

      const numbers = await this.listWhatsappPhoneNumbers({
        accessToken: input.accessToken,
        wabaId,
      });

      await this.organizationDatasource.updateById(
        new Types.ObjectId(input.organizationId),
        { whatsappNumbers: numbers },
      );
    } catch (error: unknown) {
      this.logger.warn(
        JSON.stringify({
          msg: 'meta_numbers_sync_failed',
          organizationId: input.organizationId,
          reason: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  }

  private async resolveFirstWhatsappBusinessAccountId(input: {
    accessToken: string;
    facebookBusinessId: string;
  }): Promise<string | null> {
    const params = new URLSearchParams({
      access_token: input.accessToken,
      fields: 'id',
      limit: '1',
    });

    const response = await this.fetchWithTimeout(
      `https://graph.facebook.com/v22.0/${input.facebookBusinessId}/owned_whatsapp_business_accounts?${params.toString()}`,
    );
    if (!response.ok) {
      return null;
    }

    const data = (await response
      .json()
      .catch(() => ({}))) as GraphWhatsappBusinessAccountsResponse;
    const first = data.data?.[0];
    return typeof first?.id === 'string' ? first.id : null;
  }

  private async listWhatsappPhoneNumbers(input: {
    accessToken: string;
    wabaId: string;
  }): Promise<
    Array<{
      metaPhoneNumberId: string;
      displayPhoneNumber: string;
      verifiedName?: string;
      qualityRating?: string;
      codeVerificationStatus?: string;
      nameStatus?: string;
    }>
  > {
    const params = new URLSearchParams({
      access_token: input.accessToken,
      fields:
        'id,display_phone_number,verified_name,quality_rating,code_verification_status,name_status',
      limit: '50',
    });

    const response = await this.fetchWithTimeout(
      `https://graph.facebook.com/v22.0/${input.wabaId}/phone_numbers?${params.toString()}`,
    );
    if (!response.ok) {
      return [];
    }

    const data = (await response
      .json()
      .catch(() => ({}))) as GraphPhoneNumbersResponse;
    const values = data.data ?? [];

    const normalized = values
      .map((item) => {
        const metaPhoneNumberId =
          typeof item.id === 'string' ? item.id.trim() : '';
        const displayPhoneNumber = this.normalizePhoneNumber(
          item.display_phone_number,
        );
        if (!metaPhoneNumberId || !displayPhoneNumber) {
          return null;
        }
        return {
          metaPhoneNumberId,
          displayPhoneNumber,
          verifiedName:
            typeof item.verified_name === 'string'
              ? item.verified_name
              : undefined,
          qualityRating:
            typeof item.quality_rating === 'string'
              ? item.quality_rating
              : undefined,
          codeVerificationStatus:
            typeof item.code_verification_status === 'string'
              ? item.code_verification_status
              : undefined,
          nameStatus:
            typeof item.name_status === 'string' ? item.name_status : undefined,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    const uniqueByMetaId = new Map<string, (typeof normalized)[number]>();
    for (const item of normalized) {
      uniqueByMetaId.set(item.metaPhoneNumberId, item);
    }

    return [...uniqueByMetaId.values()];
  }

  private normalizePhoneNumber(raw: string | undefined): string | null {
    if (!raw) {
      return null;
    }
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      return null;
    }
    return `+${digits}`;
  }

  private async fetchWithTimeout(url: string, timeoutMs = 7000): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private validateState(rawState: string, organizationId: string): void {
    let decoded: DecodedOauthState = {};
    try {
      const json = Buffer.from(rawState, 'base64').toString('utf-8');
      decoded = JSON.parse(json) as DecodedOauthState;
    } catch {
      throw new BadRequestException('State OAuth inválido.');
    }

    if (decoded.org !== organizationId) {
      throw new BadRequestException('State OAuth inválido.');
    }

    const issuedAt = Number(decoded.t ?? 0);
    if (!Number.isFinite(issuedAt) || issuedAt <= 0) {
      throw new BadRequestException('State OAuth inválido.');
    }

    if (Date.now() - issuedAt > config.meta.oauthStateMaxAgeMs) {
      throw new BadRequestException('State OAuth expirado.');
    }
  }
}
