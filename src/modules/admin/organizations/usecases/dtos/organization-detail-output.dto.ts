import { ApiProperty } from '@nestjs/swagger';
import { OrganizationListItemDto } from './list-organizations-output.dto';

export class OrganizationWhatsappNumberDto {
  @ApiProperty({
    description: 'ID do número na Meta (phone_number_id).',
  })
  metaPhoneNumberId: string;

  @ApiProperty({
    description: 'Número de exibição normalizado (E.164 simplificado).',
  })
  displayPhoneNumber: string;

  @ApiProperty({ nullable: true })
  verifiedName?: string;

  @ApiProperty({ nullable: true })
  qualityRating?: string;

  @ApiProperty({ nullable: true })
  codeVerificationStatus?: string;

  @ApiProperty({ nullable: true })
  nameStatus?: string;
}

/**
 * Detalhe de organização (tenant ou admin): inclui estado da integração Meta/WhatsApp **sem** expor o segredo do token.
 */
export class OrganizationDetailOutputDto extends OrganizationListItemDto {
  @ApiProperty({
    description:
      'Indica se existe token WhatsApp Business persistido (o valor do token nunca é devolvido por esta API).',
  })
  hasWhatsappIntegration: boolean;

  @ApiProperty({
    nullable: true,
    description: 'Expiração do token de acesso quando conhecida (ISO 8601).',
  })
  whatsappTokenExpiresAt: string | null;

  @ApiProperty({
    nullable: true,
    description: 'ID de negócio Meta quando disponível.',
  })
  facebookBusinessId: string | null;

  @ApiProperty({
    type: [OrganizationWhatsappNumberDto],
    description: 'Números WhatsApp sincronizados da Meta.',
  })
  whatsappNumbers: OrganizationWhatsappNumberDto[];

  @ApiProperty({
    nullable: true,
    description:
      'Última vez em que o token foi renovado (ex.: job em background), ISO 8601.',
  })
  whatsappTokenLastRefreshedAt: string | null;
}
