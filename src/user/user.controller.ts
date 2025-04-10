import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  Patch
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDetailsDto } from './dto/user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Service, ProviderType } from '@prisma/client';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}



@Post('signup')
async signup(@Body('email') email: string) {
  console.log('Received email in controller:', email); // Debug log
  return await this.userService.createUser(email);
}

@Post('updateUser')
  @UseInterceptors(FileInterceptor('profileImage'))
  async uploadDoctorProfile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UpdateUserDetailsDto
  ) {
    const { address, ...res } = dto;
    console.log(file, address, res);

    return this.userService.updatePatientsProfile({ address, ...res }, file);
  }

  @Post('applyForServiceProvider')
async createServiceProviderProfile(
  @Body('userId') userId: string,
  @Body('providerType') providerType: ProviderType,
) {
  try {
    const serviceProviderProfile = await this.userService.createServiceProviderProfile(
      userId,
      providerType,
    );

    return {
      message: 'Service provider profile created successfully',
      data: serviceProviderProfile,
    };
  } catch (error) {
    console.error('Error in createServiceProviderProfile:', error.message);
    throw error;
  }
}




  @Get('getApprovedServiceProviders')
  async getApprovedServiceProviders() {
    return this.userService.getApprovedServiceProviders();
  }

  @Get('findServiceProvidersByHomeVisit')
  async findServiceProvidersByHomeVisit() {
    return this.userService.findServiceProvidersByHomeVisit();
  }

  @Get('getPatients')
  async getPatients() {
    return this.userService.getPatients();
  }


@Get('findServiceProvidersList')
async findServiceProvidersList(@Query() dto: { speciality: string; address: string,service:Service }) {
  console.log(dto);
  return this.userService.findServiceProvidersList(dto);
}

  @Get('findDoctorbyVideoConsultation')
  async findDoctorByVideoConsultation(@Query() dto: { date: string; slot: string }) {
    console.log(dto);
    
    return this.userService.findDoctorByVideoConsultation(dto);
  }

  @Get('getServiceProvider/:username')
  async getServiceProvider(@Param('username') username: string) {
    console.log(username);
    return this.userService.getServiceProviderByUsername(username);
  }

  @Get('getAppointments/:userId')
  async getAppointsForPatients(@Param('userId') userId: string) {
    return this.userService.getAppointsForPatients(userId);
  }

  @Post('addReview')
  async addReview(@Body() dto: { serviceProviderId: string;
        userId: string;
        comment: string;
        serviceProviderType: ProviderType;
        score: number; }) {
    console.log(dto);
    return this.userService.addReview(dto);
  }

  @Get('getPopularDoctors')
  async getPopularDoctors() {
    return this.userService.getPopularDoctors();
  }
}

// function findServiceProvidersByHomeVisit() {
//   throw new Error('Function not implemented.');
// }
// function getAppointmentsForPatients(arg0: any, userId: any, string: any) {
//   throw new Error('Function not implemented.');
// }

