import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Md5HashService } from '../../shared/services/md5-hash.service';
import { OrganizationEntityDatasource } from '../admin/organizations/datasources/organization-entity.datasource';
import {
  OrganizationEntity,
  OrganizationSchema,
} from '../admin/organizations/entities/organization.entity';
import { UserEntityDatasource } from './datasources/user-entity.datasource';
import { UserEntity, UserSchema } from './entities/user.entity';
import { ConfirmAccountUsecase } from './usecases/confirm-account.usecase';
import { UsersController } from './users.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserEntity.name, schema: UserSchema },
      { name: OrganizationEntity.name, schema: OrganizationSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [
    UserEntityDatasource,
    OrganizationEntityDatasource,
    Md5HashService,
    ConfirmAccountUsecase,
  ],
  exports: [UserEntityDatasource, OrganizationEntityDatasource, Md5HashService],
})
export class UsersModule {}
