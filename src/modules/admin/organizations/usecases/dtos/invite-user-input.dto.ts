import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsOptional } from 'class-validator';
import { UserRoles } from '@modules/users/entities/user.entity';

export class InviteUserInputDto {
  @ApiProperty({ example: 'novo@empresa.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    enum: UserRoles,
    description: 'Padrão do convite se omitido.',
  })
  @IsOptional()
  @IsIn(Object.values(UserRoles))
  role?: UserRoles;
}
