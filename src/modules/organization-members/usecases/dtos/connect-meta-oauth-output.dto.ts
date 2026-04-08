import { ApiProperty } from '@nestjs/swagger';

/** Resposta do callback OAuth: nunca inclui o `access_token` em claro. */
export class ConnectMetaOauthOutputDto {
  @ApiProperty()
  connected: boolean;

  @ApiProperty({ nullable: true })
  facebookBusinessId: string | null;

  @ApiProperty({ nullable: true, description: 'ISO 8601' })
  tokenExpiresAt: string | null;
}
