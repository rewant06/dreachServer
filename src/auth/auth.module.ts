import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { UserService } from 'src/user/user.service';
import { PrismaService } from 'src/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UtilsService } from 'src/utils/utils.service';
import { StorageService } from 'src/storage/storage.service';

@Module({
  controllers: [AuthController],
  providers:[UserService,PrismaService,JwtService,AuthService,UtilsService,StorageService]
})
export class AuthModule {}
