import { Body, Controller, Post, Get, Param, UseInterceptors, UploadedFile,Query } from '@nestjs/common';
import { ProviderService } from './service-providers.service';
import {UpdateServiceProviderDetailsDto, integratedBookAppointmentDTO, UpdateScheduleDto} from './dto/dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Service} from '@prisma/client'
import { formatISO } from 'date-fns';
import { retry } from 'rxjs';

@Controller('provider')
export class ServiceProvidersController {
  constructor(
    private readonly providerService: ProviderService,
  ) {}

  ///////////////////POST///////////////////////////////////////////////////////////

  @Post('updateServiceProvider')
async updateServiceProvider(
  @Body('userId') userId: string,
  @Body('providerId') providerId: string,
  @Body() serviceProvider: UpdateServiceProviderDetailsDto,
) {
  console.log(serviceProvider);
  return await this.providerService.updateServiceProviderDetails(userId, providerId, serviceProvider);
}
  

  @Post('updateSchedule')
    async  updateScheduleDetails(updateSchedule: UpdateScheduleDto) {
      console.log(updateSchedule);
      return await this.providerService.updateScheduleDetails(updateSchedule);
    }

  @Post('uploadProviderProfile')
  @UseInterceptors(FileInterceptor('profileImage'))
  async uploadProviderProfile(@UploadedFile() file: Express.Multer.File, @Body() dto:{userId: string}, ) {
    console.log(file, dto);
    return await this.providerService.uploadProviderProfile(dto.userId, file);

  }

  @Post('checkProviderAvailability')
  async checkProviderAvailability(
    @Body() dto: {providerId: string,
      date: string,
      slot: string,
      service: Service},
    ) {
      return await this.providerService.checkProviderAvailability( 
        dto.providerId,
        dto.date,
        dto.slot,
        dto.service,
      
      );
    }

  @Post('integreatedCheckProviderAvailability')
    async integratedCareCheckProviderAvailability(@Body() dto: {
      homeVisitNursingId: string;
      h_apptDate: string;
      h_slotTime: string;
      videoDoctorId: string; 
      v_apptDate: string;
      v_slotTime: string;
    }) {
      return await this.providerService.integratedCareCheckProviderAvailability(dto); // Corrected method name
    }

  @Post('bookAppointment')
    async bookAppointment(@Body() dto: any) {
    console.log(dto, formatISO(new Date(dto.appointmentSlotDate))); 
    return await this.providerService.bookAppointment(dto);
}

@Post('integratedBookAppointment')
async IntegratedBookAppointment(@Body() dto: integratedBookAppointmentDTO) {
  console.log(dto);
  return await this.providerService.IntegratedBookAppointment(dto); 
}

@Post('actionOnPatients')
async actionOnPatients(@Body() dto: {
  serviceProviderId: string; 
  userId: string;
  action: 'APPROVED' | 'REJECTED' | 'CANCELLED';
  apptId: string;
}, ) {
  return await this.providerService.actionOnPatients(dto)
}

@Post('addMedicalRecord')
@UseInterceptors(FileInterceptor('file'))
async addMedicalRecord(
  @UploadedFile() file: Express.Multer.File,
  @Body() dto: {
    patientId: string;
    providerId: string;
    description: string;
    diagnosis: string;
    prescription: string;
  },
) {
  console.log(file, dto);
  return await this.providerService.addMedicalRecord(
    dto.patientId,
    dto.providerId,
    file,
    dto.description,
    dto.diagnosis, // Pass the diagnosis argument
    dto.prescription, // Pass the prescription argument
  );
}

@Post('addDocument')
@UseInterceptors(FileInterceptor('document'))
async addDocuments(
  @UploadedFile() file: Express.Multer.File,
  @Body() dto: { providerId: string },
) {
  return await this.providerService.addDocuments(dto.providerId, file);
}

@Post('removeDocument')
async removeDocuments(@Body('providerId') providerId: string) {
  return await this.providerService.removeDocuments(providerId);
}

////////////////////////GET///////////////////////////////////////////////////////////

  @Get('getProviderById/:providerId')
  async getProviderById(@Param('providerId') providerId: string) {
    return await this.providerService.getProviderById(providerId);
  }


  @Get('getSchedule/:userId')
  async getSchedule(@Param(('userId')) userId: string) {
    console.log(userId);
    return this.providerService.getSchedule(userId);
  }

  getLocalTimezone() {
    const currentDateInServerTimeZone = new Date();

    const istOffsetMilliseconds = 5.5 * 60 * 60 * 1000;
    const s = new Date(
      currentDateInServerTimeZone.getTime() + istOffsetMilliseconds,
    );
    return s;
  }

  @Get('getServiceProvider')
async getServiceProvider(@Query() dto: { username: string; userId: string; date: string; clientCurrentTimezone: string }) {
  const payload = {
    username: dto.username,
    userId: dto.userId,
    date: dto.date,
    clientCurrentTimezone: this.getLocalTimezone(),
  };
  return await this.providerService.getServiceProvider(payload);
}

@Get('getScheduleByHomeCare')
async getScheduleByHomeCare(
  @Query() dto:{
    username: string,
  userId?: string,
  },) {

    return await this.providerService.getScheduleByHomeCare(dto.username, this.getLocalTimezone(), dto.userId)
  }

  @Get('getPatients/:providerId')
  async getPatients(@Param('providerId') providerId: string) {
    return await this.providerService.getPatients(providerId);
  }

  @Get('getPatientMedicalByProvider')
  async getPatientsMedicalByProvider(
    @Query() dto: {pid: string, providerId?: string },) {
      return await this.providerService.getPatientsMedicalByProvider(dto.pid, dto.providerId);
    }

  @Get('getPatientsMedicalBySelf')
  async getPatientsMedicalBySelf(@Query() dto: {userId: string},) {
    return await this.providerService.getPatientsMedicalBySelf(dto.userId);
  }

  @Get('getPatientsInfo')
  async getPatientsInfo(@Query('pid') pid: string) {
    return await this.providerService.getPatientsInfo(pid);
  }

}