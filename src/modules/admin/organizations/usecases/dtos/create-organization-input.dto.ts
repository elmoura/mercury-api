import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { OrganizationPlanTypes } from '../../entities/organization.entity';

class OwnerInputDto {
  @ApiProperty({ example: 'Ana' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Silva' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'ana@empresa.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '+5511999999999',
    description: 'Telefone BR (E.164).',
  })
  @IsPhoneNumber('BR')
  phoneNumber: string;
}

export class CreateOrganizationInputDto {
  @ApiProperty({ example: 'Mercury' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    enum: OrganizationPlanTypes,
    example: OrganizationPlanTypes.BUSINESS,
  })
  @IsEnum(OrganizationPlanTypes)
  planType: OrganizationPlanTypes;

  @ApiProperty({ type: OwnerInputDto })
  @ValidateNested()
  @Type(() => OwnerInputDto)
  owner: OwnerInputDto;
}
