import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ProviderType } from '@prisma/client';


@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('getAllUsers')
  async getAllUsers() {
    return await this.adminService.getAllUsers();
  }

  @Get('getUnverifiedProvider')
  async getUnVerifiedProvider() {
    return this.adminService.getUnVerifiedProvider();
  }

  @Get('getAppointments')
  async getAppointments() {
    return this.adminService.getAppointments();
  }

  @Post('actionOnProvider')
  async actionOnUser(
    @Body('userId') userId: string,
    @Body('action') action: string,
    @Body('providerType') providerType: ProviderType,
  ) {
    return this.adminService.actionOnProvider(userId, action, providerType);
  }

  
}
