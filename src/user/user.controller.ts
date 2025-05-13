import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  InternalServerErrorException,
  Delete,
  Put,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  UpdatePatientsDetailsDto,
  ApplyForServiceProviderDto,
} from './dto/user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Service, ProviderType, Prisma } from '@prisma/client';
import { memoryStorage } from 'multer';



@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('signup')
  async signup(@Body('email') email: string) {
    console.log('Received email in controller for signup:', email); // Debug log
    return await this.userService.createUser(email);
  }

  @Post('login')
  async login(@Body('email') email: string) {
    console.log('Received email in controller for login:', email); // Debug log
    return await this.userService.login(email);
  }


  // const fileFilter = (req, file, callback) => {
  //   if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
  //     return callback(
  //       new BadRequestException('Only image files are allowed!'),
  //       false,
  //     );
  //   }
  //   callback(null, true);
  // };

  // @Post('updateUser')
  // @UseInterceptors(FileInterceptor('profilePic', { fileFilter }))
  // async updateUsersProfile(
  //   @UploadedFile() file: Express.Multer.File,
  //   @Body() dto: UpdatePatientsDetailsDto,
  // ) {
  //   const { address, ...res } = dto;
  //   console.log(file, address, res);

  //   return this.userService.updateUsersProfile({ address, ...res }, file);
  // }

  @Post('updateUser')
  @UseInterceptors(FileInterceptor('profilePic', { storage: memoryStorage() }))
  async updateUsersProfile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UpdatePatientsDetailsDto,
  ) {
    console.log('Received address:', dto.address); // Debug log
    const parsedAddress = typeof dto.address === 'string' ? JSON.parse(dto.address) : dto.address;
    console.log('Parsed address:', parsedAddress);
    const { address, ...res } = dto;
    console.log(file, address, res);

    return this.userService.updateUsersProfile({  address: parsedAddress, ...res }, file);
  }

  @Put('/delete/:userId')
  async deleteUser(@Param('userId') userId: string) {
    return this.userService.deleteUser(userId);
  }

  @Delete('/terminate/:userId')
  async terminateUser(@Param('userId') userId: string) {
    return this.userService.terminateUser(userId);
  }

  @Post('applyForServiceProvider')
  async createServiceProviderProfile(@Body() dto: ApplyForServiceProviderDto) {
    try {
      const serviceProviderProfile =
        await this.userService.createServiceProviderProfile(dto);

      return {
        message: 'Service provider profile created successfully',
        data: serviceProviderProfile,
      };
    } catch (error) {
      console.error('Error in createServiceProviderProfile:', error.message);
      throw error;
    }
  }

  @Get('doctors')
  async getDoctors() {
    return await this.userService.getApprovedDoctors();
  }

  @Get('getApprovedServiceProviders')
  async getApprovedServiceProviders() {
    return this.userService.getApprovedServiceProviders();
  }

  @Get('findServiceProvidersByHomeVisit')
  async findServiceProvidersByHomeVisit() {
    return this.userService.findServiceProvidersByHomeVisit();
  }

  // @Get('getPatients')
  // async getPatients() {
  //   return this.userService.getPatients();
  // }

  @Get('findServiceProvidersList')
  async findServiceProvidersList() {
    console.log();
    return this.userService.findServiceProvidersList();
  }

  @Get('findDoctorbyVideoConsultation')
  async findDoctorByVideoConsultation() {
    console.log();

    return this.userService.findDoctorByVideoConsultation();
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
  async addReview(
    @Body()
    dto: {
      serviceProviderId: string;
      userId: string;
      comment: string;
      serviceProviderType: ProviderType;
      score: number;
    },
  ) {
    console.log(dto);
    return this.userService.addReview(dto);
  }

  @Get('getPopularDoctors')
  async getPopularDoctors() {
    return this.userService.getPopularDoctors();
  }

  @Get('fetchUserById/:userId')
  async getUserById(@Param('userId') userId: string) {
    return this.userService.getUserById(userId);
  }

  @Get('fetchUserByEmail')
  async getUserByEmail(@Query('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    return this.userService.getUserByEmail(email);
  }

  @Get('fetchUserIdByEmail')
  async fetchUserIdByEmail(@Query('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    const user = await this.userService.fetchUserIdByEmail(email);
    return {
      id: user.id,
      userId: user.userId,
    };
  }


  @Get('getSchedule/:userId')
  async getSchedule(@Param(('userId')) userId: string) {
    console.log(userId);
    return this.userService.getSchedule(userId);
  }

}

// function findServiceProvidersByHomeVisit() {
//   throw new Error('Function not implemented.');
// }
// function getAppointmentsForPatients(arg0: any, userId: any, string: any) {
//   throw new Error('Function not implemented.');
// }
