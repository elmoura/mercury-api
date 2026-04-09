import { OrganizationDocument } from '../../entities/organization.entity';
import {
  OrganizationDetailOutputDto,
  OrganizationWhatsappNumberDto,
} from '../dtos/organization-detail-output.dto';
import { OrganizationListItemDto } from '../dtos/list-organizations-output.dto';

function timestampToIso(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value).toISOString();
  }
  return new Date().toISOString();
}

export function mapOrganizationDocumentToListItem(
  doc: OrganizationDocument,
): OrganizationListItemDto {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    ownerId: doc.ownerId != null ? String(doc.ownerId) : null,
    planType: doc.planType,
    createdAt: timestampToIso(doc.get('createdAt')),
    updatedAt: timestampToIso(doc.get('updatedAt')),
  };
}

function dateFieldToIso(value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

function mapWhatsappNumbers(value: unknown): OrganizationWhatsappNumberDto[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const mapped: OrganizationWhatsappNumberDto[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') {
      continue;
    }
    const item = raw as Record<string, unknown>;
    const metaPhoneNumberId =
      typeof item.metaPhoneNumberId === 'string'
        ? item.metaPhoneNumberId.trim()
        : '';
    const displayPhoneNumber =
      typeof item.displayPhoneNumber === 'string'
        ? item.displayPhoneNumber.trim()
        : '';

    if (!metaPhoneNumberId || !displayPhoneNumber) {
      continue;
    }

    mapped.push({
      metaPhoneNumberId,
      displayPhoneNumber,
      verifiedName:
        typeof item.verifiedName === 'string' ? item.verifiedName : undefined,
      qualityRating:
        typeof item.qualityRating === 'string' ? item.qualityRating : undefined,
      codeVerificationStatus:
        typeof item.codeVerificationStatus === 'string'
          ? item.codeVerificationStatus
          : undefined,
      nameStatus:
        typeof item.nameStatus === 'string' ? item.nameStatus : undefined,
    });
  }

  return mapped;
}

/**
 * Mapeamento para GET detalhe: nunca incluir `whatsappBusinessToken`.
 */
export function mapOrganizationDocumentToDetail(
  doc: OrganizationDocument,
): OrganizationDetailOutputDto {
  const base = mapOrganizationDocumentToListItem(doc);
  const rawToken =
    doc.get?.('whatsappBusinessToken') ?? doc.whatsappBusinessToken;
  const hasWhatsappIntegration =
    typeof rawToken === 'string' && rawToken.trim().length > 0;

  return {
    ...base,
    hasWhatsappIntegration,
    whatsappTokenExpiresAt: dateFieldToIso(
      doc.get?.('tokenExpiresAt') ?? doc.tokenExpiresAt,
    ),
    facebookBusinessId: doc.facebookBusinessId ?? null,
    whatsappNumbers: mapWhatsappNumbers(
      doc.get?.('whatsappNumbers') ?? doc.whatsappNumbers,
    ),
    whatsappTokenLastRefreshedAt: dateFieldToIso(
      doc.get?.('tokenLastRefreshedAt') ?? doc.tokenLastRefreshedAt,
    ),
  };
}
