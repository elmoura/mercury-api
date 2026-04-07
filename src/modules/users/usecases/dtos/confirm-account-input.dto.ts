import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * `hash` aceita:
 * - token do convite (base64url com payload JSON `u`, `o`, `c`, `e`), igual ao query `token` do link de convite;
 * - hash legado da criação de organização (`userId.orgId.assinatura` MD5).
 */
export class ConfirmAccountInputDto {
  @ApiProperty({
    description:
      'Token de convite (base64url) ou hash legado `userId.orgId.assinatura` (MD5).',
  })
  @IsString()
  @IsNotEmpty()
  hash: string;

  @ApiProperty({ minLength: 8, description: 'Nova senha (mín. 8 caracteres).' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @ApiPropertyOptional()
  @IsString()
  @MinLength(1)
  lastName?: string;

  @ApiPropertyOptional({ minLength: 8 })
  @IsString()
  @MinLength(8)
  phoneNumber?: string;
}
