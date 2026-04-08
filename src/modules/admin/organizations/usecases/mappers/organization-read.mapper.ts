import { OrganizationDocument } from '../../entities/organization.entity';
import { OrganizationDetailOutputDto } from '../dtos/organization-detail-output.dto';
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
    whatsappNumbers: Array.isArray(doc.whatsappNumbers)
      ? [...doc.whatsappNumbers]
      : [],
    whatsappTokenLastRefreshedAt: dateFieldToIso(
      doc.get?.('tokenLastRefreshedAt') ?? doc.tokenLastRefreshedAt,
    ),
  };
}
