import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl, MinLength } from 'class-validator';

export class ConnectMetaOauthInputDto {
  @ApiProperty({ description: 'authorization_code devolvido pela Meta' })
  @IsString()
  @MinLength(1)
  code: string;

  @ApiProperty({
    description: 'Redirect URI usada no início do OAuth',
    example: 'http://localhost:5173/oauth/meta/callback',
  })
  @IsString()
  redirectUri: string;

  @ApiProperty({
    description: 'State OAuth devolvido pela Meta',
    example: 'eyJub25jZSI6IjEyMyIsIm9yZyI6IjUwN2YxZj...==',
  })
  @IsString()
  @MinLength(1)
  state: string;
}
