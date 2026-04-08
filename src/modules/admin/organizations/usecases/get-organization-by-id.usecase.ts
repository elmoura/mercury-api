import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { OrganizationEntityDatasource } from '../datasources/organization-entity.datasource';
import { InvalidDataException } from '../exceptions/invalid-data.exception';
import { OrganizationDetailOutputDto } from './dtos/organization-detail-output.dto';
import { mapOrganizationDocumentToDetail } from './mappers/organization-read.mapper';

@Injectable()
export class GetOrganizationByIdUsecase {
  constructor(
    private readonly organizationDatasource: OrganizationEntityDatasource,
  ) {}

  async execute(organizationId: string): Promise<OrganizationDetailOutputDto> {
    if (!Types.ObjectId.isValid(organizationId)) {
      throw new InvalidDataException('Identificador de organização inválido.');
    }

    const doc = await this.organizationDatasource.findById(
      new Types.ObjectId(organizationId),
    );

    if (!doc) {
      throw new NotFoundException('Organização não encontrada.');
    }

    return mapOrganizationDocumentToDetail(doc);
  }
}
