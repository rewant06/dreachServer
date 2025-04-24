import {
    IsBoolean,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    IsEnum,
    IsArray,
    IsDate,
    IsInt,
    ValidateNested,
    
  } from 'class-validator';
  
  import { BloodGroup, Gender, Service, Status, WeekDay, RecurrenceType, ProviderType } from '@prisma/client';
import { Type } from 'class-transformer';





  export class UpdateServiceProviderDetailsDto {
    @IsOptional()
    @IsString()
    name: string;
  
    // @IsOptional()
    // @IsEnum(ProviderType)
    // providerType: ProviderType;
  
    @IsOptional()
    @IsEnum(Gender)
    gender: Gender;
  
    // @IsOptional()
    // @IsEnum(Status)
    // status: Status;
  
    @IsOptional()
    @IsNumber()
    age: number;
  
    @IsOptional()
    @IsString()
    dob: string;
  
    @IsOptional()
    @IsEnum(BloodGroup)
    bloodGroup?: BloodGroup;
  
    @IsOptional()
    @IsString()
    phone: string;
  
    @IsOptional()
    @IsNumber()
    fee: number;
  
    @IsOptional()
    @IsNumber()
    experience: number;
  
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    specialization?: string[];
  
    @IsOptional()
    @IsArray()
    @IsEnum(Service, { each: true })
    service?: Service[];
  
    @IsOptional()
    @IsString()
    description: string;
  
    @IsString()
    userId: string;
  
    @IsString()
    providerId: string;
  }
  
  
  
  
  // export class UpdateSheduleDto{
  //   @IsString()
  //   doctorProfileId: string;
  
  //   @IsObject()
  //   schedules: {
  //     OnlineShedule:[],
  //     DeskShedule:[],
  //     HomeShedule:[]
  //   };
  // }
  
  class ClinicInfoDto {
    @IsString()
    id: string;
  
    @IsString()
    clinicName: string;
  
    @IsString()
    addressId: string;
  
    @IsString()
    contact: string;
  
    @IsArray()
    @IsString({ each: true })
    images: string[];
  
    @IsOptional()
    @IsString()
    createdAt?: string;
  
    @IsOptional()
    @IsString()
    updatedAt?: string;
  }


export class CreateSlotDto {
  @IsString()
  id: string;

  @IsDate()
  slotDate: Date;

  @IsDate()
  startTime: Date;

  @IsDate()
  endTime: Date;

  @IsBoolean()
  @IsOptional()
  isBooked?: boolean;

  @IsString()
  scheduleId: string;

  @IsString()
  clinicInfoId: string;

  @IsDate()
  @IsOptional()
  bookedAt?: Date;

  @IsDate()
  @IsOptional()
  updatedAt?: Date;
}


export class UpdateScheduleDto {
  @IsString()
  id: string;

  @IsString()
  userId: string;

  @IsDate()
  @IsOptional()
  date?: Date;

  @IsEnum(WeekDay)
  @IsOptional()
  dayOfWeek?: WeekDay;

  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @IsEnum(RecurrenceType)
  @IsOptional()
  recurrenceType?: RecurrenceType;

  @IsDate()
  startTime: Date;

  @IsDate()
  endTime: Date;

  @IsInt()
  slotDuration: number;

  @IsString()
  location: string;

  @IsOptional()
  isAvailable?: boolean;

  @IsEnum(Service)
  service: Service;

  @IsEnum(Status)
  @IsOptional()
  status?: Status;

  @IsString()
  providerId: string;

  @ValidateNested()
  @Type(() => ClinicInfoDto)
  clinicInfoDto?: ClinicInfoDto;
}

// export class AppointmentDto {
//   @IsString()
//   id: string;

//   @IsEnum(Service, { each: true })
//   service: Service[];

//   @IsEnum(Status)
//   status: Status;

//   @IsDate()
//   appointmentTime: Date;

//   @IsDate()
//   @IsOptional()
//   bookedAt?: Date;

//   @IsString()
//   @IsOptional()
//   reason?: string;

//   @IsBoolean()
//   @IsOptional()
//   isForOthers?: boolean;

//   @IsString()
//   @IsOptional()
//   slotId?: string;

//   @IsString()
//   userId: string;

//   @IsString()
//   serviceProviderId: string;

//   @IsString()
//   patientId: string;

//   @IsDate()
//   @IsOptional()
//   createdAt?: Date;

//   @IsDate()
//   @IsOptional()
//   updatedAt?: Date;
// }


export class BookAppointmentDto {
  @IsString()
  slotId: string;

  @IsString()
  serviceProviderId: string;

  @IsString()
  userId: string;

  @IsDate()
  appointmentTime: Date;

  @IsEnum(Service)
  service: Service;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @IsOptional()
  isForOthers?: boolean;

  @IsString()
  patientId: string;
}

export class integratedBookAppointmentDTO {
  @IsString()
  homeNursingId: string; // ID of the Nursing provider for HomeCare

  @IsString()
  videoDoctorId: string; // ID of the Doctor provider for VideoConsultation

  @IsString()
  userId: string; // ID of the user booking the appointments

  @IsString()
  h_apptDate: string; // Date for the HomeCare appointment (e.g., '2025-04-07')

  @IsString()
  h_slot: string; // Time for the HomeCare appointment (e.g., '10:00')

  @IsString()
  v_apptDate: string; // Date for the VideoConsultation appointment (e.g., '2025-04-07')

  @IsString()
  v_slot: string; // Time for the VideoConsultation appointment (e.g., '10:45')

  @IsOptional()
  @IsString()
  reason?: string; // Optional reason for the appointments
}