import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthService } from './auth/auth.service';
import { AuthModule } from './auth/auth.module';
import { AuthController } from './auth/auth.controller';
import { JwtService } from '@nestjs/jwt';
import {ServiceProvidersModule } from './service-providers/service-providers.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { PrismaModule } from './prisma.module'; // Import PrismaModule
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { UtilsModule } from './utils/utils.module';
import { UtilsService } from './utils/utils.service';
import { StorageService } from './storage/storage.service';
import { MulterModule } from '@nestjs/platform-express';
import { AdminController } from './admin/admin.controller';
import { AdminModule } from './admin/admin.module';
import { AdminService } from './admin/admin.service';


@Module({
  imports: [PrismaModule, AuthModule, ServiceProvidersModule , ServiceProvidersModule, UserModule,ConfigModule.forRoot(), UtilsModule, MulterModule.register({
    dest: './uploads', // Set your upload directory
  }), AdminModule],

  controllers: [UserController, AuthController, AdminController],
  providers: [AuthService,PrismaService,UserService,JwtService,UtilsService, StorageService,AdminService],
})
export class AppModule {}
