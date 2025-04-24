/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,

  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsEnum,

  ValidateNested,
  IsArray,
} from 'class-validator';

import { BloodGroup, Gender, ProviderType, Service } from '@prisma/client';



export class ApplyForServiceProviderDto {
  @IsString()
  userId: string;

  @IsEnum(ProviderType)
  providerType: ProviderType;

  @IsEnum(Service)
  service: Service[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialization?: string[]; 

  @IsOptional()
  @IsNumber()
  fee?: number; // Optional fee

  @IsNumber()
  experience: number; // Required experience

  @IsOptional()
  @IsString()
  description?: string; // Optional description

  @IsOptional()
  @IsString()
  document?: string; // Optional description

  @IsString()
  registrationNumber: string;
}

export class createUserDto {
  @IsString()
  name: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}



export class AddressDto{
  @IsOptional()
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  state: string;

  @IsOptional()
  @IsString()
  country: string;

  @IsOptional()
  @IsString()
  pincode: string;
}

export class UpdateUserDetailsDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialization: string[]; // Updated to handle `String[]`


  @IsOptional()
  @IsString()
  dob: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;
  
  @IsOptional()
  @IsEnum(BloodGroup)
  bloodGroup?: BloodGroup;


  @IsOptional()
  @IsNumber()
  fee: number; // Fee for the service provider

  @IsOptional()
  @IsNumber()
  experience: number; // Years of experience

  @IsOptional()
  @IsString()
  description: string; // Description of the service provider

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto; // Address details

  @IsString()
userId: string; // User ID to identify the service provider
}


export class UpdatePatientsDetailsDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  age?: number;

  @IsOptional()
  @IsString()
  dob?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsEnum(BloodGroup)
  bloodGroup?: BloodGroup;

  @ValidateNested()
  @IsOptional()
  @Type(() => AddressDto)
  address?: AddressDto;

  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  phone?: string;
}


export class bookAppointmentDTO {
  @IsString()
  serviceProviderId: string;

  @IsString()
  userId: string;

  @IsString()
  slotId: string;

  @IsString()
  appointmentSlotTime: string;

  @IsString()
  service: string;

  @IsObject()
  currentLocation: {
    lat: number;
    long: number;
  };

  @IsOptional()
  @IsString()
  reason: string;

  @IsBoolean()
  isForOthers: boolean = false;

}

export class hybridBookAppointmentDTO {
  @IsString()
  HomeCareId: string;

  @IsString()
  VideoConsultationId: string;

  @IsString()
  userId: string;

  @IsString()
  h_apptDate: string;

  @IsString()
  h_slot: string;

  @IsString()
  v_apptDate: string;

  @IsString()
  v_slot: string;

  @IsObject()
  currentLocation: {
    lat: number;
    long: number;
  };

  @IsBoolean()
  isForOthers: boolean = false;;


}
