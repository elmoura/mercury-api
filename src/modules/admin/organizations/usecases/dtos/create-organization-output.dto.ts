import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrganizationPlanTypes } from '../../entities/organization.entity';
import { UserRoles } from '../../../../users/entities/user.entity';

class OrganizationOwnerOutputDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  _id: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  organizationId: string;

  @ApiProperty({ enum: UserRoles })
  role: UserRoles;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional({
    description: 'Não exposto em fluxos públicos; pode vir vazio.',
  })
  password?: string;

  @ApiProperty()
  phoneNumber: string;
}

export class CreateOrganizationOutputDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  _id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  ownerId: string;

  @ApiProperty({ enum: OrganizationPlanTypes })
  planType: OrganizationPlanTypes;

  @ApiProperty({ type: OrganizationOwnerOutputDto })
  owner: OrganizationOwnerOutputDto;
}
