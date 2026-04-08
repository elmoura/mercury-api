import { ApiProperty } from '@nestjs/swagger';
import { OrganizationListItemDto } from './list-organizations-output.dto';

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
    type: [String],
    description: 'Números WhatsApp associados quando sincronizados.',
  })
  whatsappNumbers: string[];

  @ApiProperty({
    nullable: true,
    description:
      'Última vez em que o token foi renovado (ex.: job em background), ISO 8601.',
  })
  whatsappTokenLastRefreshedAt: string | null;
}
