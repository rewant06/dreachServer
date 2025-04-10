import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from '../prisma.module'; // Import PrismaModule
import { UtilsService } from '../utils/utils.service';
import { StorageService } from '../storage/storage.service';

@Module({
  imports: [PrismaModule], // Add PrismaModule here
  controllers: [UserController],
  providers: [UserService, UtilsService, StorageService],
})
export class UserModule {}