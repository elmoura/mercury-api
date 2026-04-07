import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountStatus, UserRoles } from '../../entities/user.entity';

/** Resposta pública do usuário após confirmação (sem senha). */
export class ConfirmAccountOutputDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  organizationId: string;

  @ApiProperty({ enum: UserRoles })
  role: UserRoles;

  @ApiProperty({ enum: AccountStatus })
  accountStatus: AccountStatus;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiPropertyOptional()
  createdAt?: string;

  @ApiPropertyOptional()
  updatedAt?: string;
}
