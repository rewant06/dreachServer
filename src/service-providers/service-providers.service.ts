/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException } from '@nestjs/common'; 
import { UpdateServiceProviderDetailsDto, UpdateScheduleDto, AppointmentDto, integratedBookAppointmentDTO } from './dto/dto';
import { PrismaService } from 'src/prisma.service';
import { StorageService } from 'src/storage/storage.service';
// import * as sharp from 'sharp';
import { format, formatISO } from 'date-fns';
import { Service} from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as sharp from 'sharp';
import { Readable } from 'stream';



@Injectable()
export class ProviderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  private generateMediaId(): string {
    return uuidv4(); // Generate a unique ID
  }
  async updateServiceProviderDetails(userId: string, providerId: string, updateData: UpdateServiceProviderDetailsDto) {
    console.log('Received userId:', userId);
    console.log('Received providerId:', providerId);
    console.log('Update Data:', updateData);
  
    // Check if the user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      console.error(`User not found with ID: ${userId}`);
      throw new NotFoundException('User not found');
    }
  
    // Check if the service provider exists
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { providerId: providerId },
    });
    if (!provider) {
      console.error(`Service provider not found with ID: ${providerId}`);
      throw new NotFoundException('Service provider not found');
    }
  
    console.log('Service provider found:', provider);
  
    // Update the user profile
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: updateData.name,
        dob: updateData.dob ? new Date(updateData.dob) : undefined,
        bloodGroup: updateData.bloodGroup,
        phone: updateData.phone,
        gender: updateData.gender,
      },
    });
  
    // Update the service provider profile
    const updatedProvider = await this.prisma.serviceProvider.update({
      where: { providerId: providerId },
      data: {
        specialization: updateData.specialization ?? [],
        fee: updateData.fee ?? null,
        experience: updateData.experience ?? null,
        description: updateData.description ?? null,
        status: updateData.status ?? provider.status,
        service: updateData.service ?? [],
        age: updateData.age ?? null,
        providerType: updateData.providerType ?? provider.providerType,
      },
    });
  
    console.log('Updated User:', updatedUser);
    console.log('Updated Service Provider:', updatedProvider);
  
    return {
      message: 'Service provider updated successfully',
      user: updatedUser,
      provider: updatedProvider,
    };
  }
  





  async updateScheduleDetails(updateSchedule: UpdateScheduleDto) {
    try {
      // Find the existing schedule by serviceProviderId
      const schedule = await this.prisma.schedule.findUnique({
        where: {
          id: updateSchedule.id, // Use the schedule ID to find the existing schedule
        },
      });
  
      if (schedule) {
        // Update the existing schedule
        const updatedSchedule = await this.prisma.schedule.update({
          where: {
            id: updateSchedule.id,
          },
          data: {
            date: updateSchedule.date,
            dayOfWeek: updateSchedule.dayOfWeek,
            isRecurring: updateSchedule.isRecurring,
            recurrenceType: updateSchedule.recurrenceType,
            startTime: updateSchedule.startTime,
            endTime: updateSchedule.endTime,
            slotDuration: updateSchedule.slotDuration,
            location: updateSchedule.location,
            isAvailable: updateSchedule.isAvailable,
            service: updateSchedule.service,
            status: updateSchedule.status,
          },
        });
  
        console.log('Schedule updated:', updatedSchedule);
        return updatedSchedule;
      } else {
        // Create a new schedule if it doesn't exist
        const newSchedule = await this.prisma.schedule.create({
          data: {
            id: updateSchedule.id,
            date: updateSchedule.date,
            dayOfWeek: updateSchedule.dayOfWeek,
            isRecurring: updateSchedule.isRecurring,
            recurrenceType: updateSchedule.recurrenceType,
            startTime: updateSchedule.startTime,
            endTime: updateSchedule.endTime,
            slotDuration: updateSchedule.slotDuration,
            location: updateSchedule.location,
            isAvailable: updateSchedule.isAvailable,
            service: updateSchedule.service,
            status: updateSchedule.status,
            providerId: updateSchedule.providerId, // Ensure providerId is included
            userId: updateSchedule.userId, // Ensure userId is included
            serviceProviders: {
              connect: { id: updateSchedule.providerId },
            },
          },
        });
  
        console.log('New schedule created:', newSchedule);
        return newSchedule;
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      throw new InternalServerErrorException('Failed to update schedule');
    }
  }



  //get Provider by id

  async getProviderById(providerId: string) {
    try {
      const provider = await this.prisma.serviceProvider.findUnique({
        where: {
          providerId: providerId,
        },
        include: {
          user: true,
        },
      });

      if (!provider) throw new NotFoundException('User not found');
      return provider;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.log(error);
      throw new InternalServerErrorException('Internal Server Error!');
    }
  }

  async getSchedule(userId: string) {
    try {
      // Find the service provider by userId
      const provider = await this.prisma.serviceProvider.findUnique({
        where: {
          userId: userId, // Use userId to find the service provider
        },
      });
  
      if (!provider) {
        throw new NotFoundException('Service provider not found');
      }
  
      // Fetch schedules for all services
      const schedules = await this.prisma.schedule.findMany({
        where: {
          serviceProviderId: provider.id, // Use the provider's ID to find schedules
        },
        include: {
          slots: true, // Include slots for each schedule
        },
      });
  
      if (!schedules || schedules.length === 0) {
        // Return default response if no schedules are found
        return {
          serviceProvider: {
            services: {
              HomeCare: [],
              VideoConsultation: [],
              OndeskAppointment: [],
              IntegratedCare: [],
              CollaborativeCare: [],
              LabTest: [],
            },
          },
        };
      }
  
      // Organize schedules by service type
      const organizedSchedules: Record<string, Array<{
        id: string;
        date: Date | null;
        dayOfWeek: string | null;
        isRecurring: boolean;
        recurrenceType: string | null;
        startTime: Date;
        endTime: Date;
        slotDuration: number;
        location: string;
        isAvailable: boolean;
        status: string;
        slots: Array<{
          id: string;
          startTime: Date;
          endTime: Date;
          isAvailable: boolean;
        }>;
      }>> = {
        HomeCare: [],
        VideoConsultation: [],
        OndeskAppointment: [],
        IntegratedCare: [],
        CollaborativeCare: [],
        LabTest: [],
      };
  
      schedules.forEach((schedule) => {
        if (schedule.service in organizedSchedules) {
          organizedSchedules[schedule.service].push({
            id: schedule.id,
            date: schedule.date,
            dayOfWeek: schedule.dayOfWeek,
            isRecurring: schedule.isRecurring,
            recurrenceType: schedule.recurrenceType,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            slotDuration: schedule.slotDuration,
            location: schedule.location,
            isAvailable: schedule.isAvailable,
            status: schedule.status,
            slots: schedule.slots.map(slot => ({
              id: slot.id,
              startTime: slot.startTime,
              endTime: slot.endTime,
              isAvailable: !slot.isBooked, // Assuming isAvailable is the inverse of isBooked
            })),
          });
        }
      });
  
      console.log('Schedules found:', organizedSchedules);
  
      return {
        serviceProvider: {
          services: organizedSchedules,
        },
      };
    } catch (error) {
      console.error('Error fetching schedule:', error);
      throw new InternalServerErrorException('Failed to fetch schedule');
    }
  }

  async getServiceProvider(dto: { username: string; userId: string; date: string; clientCurrentTimezone: Date }) {
    try {
      const serviceProvider = await this.prisma.user.findFirst({
        where: {
          username: dto.username,
          role: {
            in: ['Doctor', 'Hospital', 'Lab', 'Nursing', 'DoctorsAssistant'], // Query multiple roles
          },
        },
        include: {
          serviceProvider: true, // Include the related service provider details
        },
      });
  
      if (!serviceProvider) {
        throw new NotFoundException('Service provider not found');
      }
  
      return serviceProvider;
    } catch (error) {
      console.error('Error fetching service provider profile:', error);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }
  //////////////////////////////////////////////////////////////////////////////////////////////////////////


  async getServiceProviderDetails(
    username: string,
    clientCurrentTimezone: Date,
    userId?: string,
  ) {
    const today = clientCurrentTimezone.toISOString().split('T')[0];
  
    try {
      const startDate = clientCurrentTimezone;
      const numDays = 10;
  
      const slotDetails: Array<{ date: string; availableSlots: string[]; bookedSlots: string[] }> = [];
      const provider = await this.prisma.user.findUnique({
        where: {
          username: username,
        },
        include: {
          serviceProvider: {
            include: {
              schedule: true,
            },
          },
        },
      });
  
      const serviceProvider = provider?.serviceProvider?.[0]; // Access the first service provider
  
      if (!provider || !serviceProvider || serviceProvider.status !== 'APPROVED') {
        throw new UnauthorizedException('Unauthorized Access');
      }
  
      for (let i = 0; i < numDays; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateOnly = format(currentDate, 'yyyy-MM-dd');
        const isoDate = formatISO(new Date(dateOnly));
  
        const appointments = await this.prisma.appointment.findMany({
          where: {
            serviceProviderId: serviceProvider.id,
            appointmentTime: {
              gte: new Date(isoDate),
              lt: new Date(new Date(isoDate).setDate(new Date(isoDate).getDate() + 1)),
            },
            status: { in: ['APPROVED', 'PENDING'] },
          },
          select: {
            appointmentTime: true,
          },
        });
  
        const bookedSlots = appointments.map(
          (appointment) => appointment.appointmentTime.toISOString(),
        );
  
        const currentDateTime = clientCurrentTimezone;
        const currentHours = currentDateTime.getHours();
        const currentMinutes = currentDateTime.getMinutes();
  
        const schedules = serviceProvider.schedule || [];
        const availableSlots = schedules
          .filter((schedule) => schedule.isAvailable)
          .flatMap((schedule) => {
            const startTime = new Date(schedule.startTime);
            const endTime = new Date(schedule.endTime);
            const slots: string[] = [];
            while (startTime < endTime) {
              const slotTime = new Date(startTime);
              slots.push(slotTime.toISOString());
              startTime.setMinutes(startTime.getMinutes() + schedule.slotDuration);
            }
            return slots;
          })
          .filter((slot) => {
            const slotDate = new Date(slot);
            if (
              slotDate.toISOString().split('T')[0] === today &&
              (slotDate.getHours() < currentHours ||
                (slotDate.getHours() === currentHours &&
                  slotDate.getMinutes() < currentMinutes))
            ) {
              return false;
            }
            return !bookedSlots.includes(slot);
          });
  
        slotDetails.push({
          date: isoDate,
          availableSlots: availableSlots,
          bookedSlots: bookedSlots,
        });
      }
  
      let bookedByCurrentUser;
      if (userId) {
        bookedByCurrentUser = await this.prisma.appointment.findFirst({
          where: {
            serviceProviderId: serviceProvider.id,
            userId: userId,
            appointmentTime: {
              gte: new Date(today),
            },
          },
        });
      }
  
      const isServiceProviderAppointedEver = await this.prisma.appointment.findFirst({
        where: {
          serviceProviderId: serviceProvider.id,
          status: 'APPROVED',
        },
      });
  
      return {
        slotDetails,
        serviceProvider: provider,
        isBookedByCurrentUser: !!bookedByCurrentUser,
        status: bookedByCurrentUser?.status,
        isServiceProviderAppointedEver: !!isServiceProviderAppointedEver,
      };
    } catch (error) {
      console.error('Error fetching service provider details:', error);
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  async getScheduleByHomeCare(
    username: string,
    clientCurrentTimezone: Date,
    userId?: string
  ) {
    const today = clientCurrentTimezone.toISOString().split('T')[0];
    try {
      const startDate = clientCurrentTimezone;
      const numDays = 10;
  
      const slotDetails: Array<{
        date: string;
        availableSlotsHome: string[];
        bookedSlots: string[];
      }> = [];
  
      const provider = await this.prisma.user.findUnique({
        where: {
          username: username,
        },
        include: {
          serviceProvider: {
            include: {
              schedule: true,
            },
          },
        },
      });
  
      // Ensure provider and serviceProvider exist
      const serviceProvider = provider?.serviceProvider?.[0]; // Access the first service provider
      if (!provider || !serviceProvider || serviceProvider.status !== 'APPROVED') {
        throw new UnauthorizedException('Unauthorized Access');
      }
  
      // Check if provider is of type Nursing or Lab
      if (
        serviceProvider.providerType !== 'Nursing' &&
        serviceProvider.providerType !== 'Lab'
      ) {
        throw new UnauthorizedException(
          'This service is only available for Nursing or Lab providers'
        );
      }
  
      // Check if provider offers HomeCare service
      if (
        !serviceProvider.service ||
        !Array.isArray(serviceProvider.service) ||
        !serviceProvider.service.includes('HomeCare')
      ) {
        throw new UnauthorizedException(
          'This provider does not offer HomeCare services'
        );
      }
  
      // Iterate through the next 10 days to generate slot details
      for (let i = 0; i < numDays; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateOnly = format(currentDate, 'yyyy-MM-dd');
        const isoDate = formatISO(new Date(dateOnly));
  
        // Find appointments for this date
        const appointments = await this.prisma.appointment.findMany({
          where: {
            serviceProviderId: serviceProvider.id,
            appointmentTime: {
              gte: new Date(isoDate),
              lt: new Date(new Date(isoDate).setDate(new Date(isoDate).getDate() + 1)),
            },
            service: {
              hasSome: ['HomeCare'],
            },
            status: { in: ['APPROVED', 'PENDING'] },
          },
          select: {
            appointmentTime: true,
          },
        });
  
        const bookedSlots = appointments.map((appointment) =>
          appointment.appointmentTime.toISOString()
        );
  
        const currentDateTime = clientCurrentTimezone;
        const currentHours = currentDateTime.getHours();
        const currentMinutes = currentDateTime.getMinutes();
  
        // Filter schedules for HomeCare service type
        const schedules = serviceProvider.schedule || [];
        const homeCareSchedules = schedules.filter(
          (schedule) =>
            schedule.service === 'HomeCare' && schedule.isAvailable
        );
  
        // Generate available slots from schedules
        const availableSlotsHome = homeCareSchedules.flatMap((schedule) => {
          const startTime = new Date(schedule.startTime);
          const endTime = new Date(schedule.endTime);
          const slots: string[] = [];
  
          // Clone startTime to avoid modifying the original
          const slotTime = new Date(startTime);
  
          while (slotTime < endTime) {
            const timeSlot = new Date(slotTime);
  
            // Skip past slots for today
            if (
              timeSlot.toISOString().split('T')[0] === today &&
              (timeSlot.getHours() < currentHours ||
                (timeSlot.getHours() === currentHours &&
                  timeSlot.getMinutes() < currentMinutes))
            ) {
              slotTime.setMinutes(slotTime.getMinutes() + schedule.slotDuration);
              continue;
            }
  
            // Skip booked slots
            if (!bookedSlots.includes(timeSlot.toISOString())) {
              slots.push(timeSlot.toISOString());
            }
  
            slotTime.setMinutes(slotTime.getMinutes() + schedule.slotDuration);
          }
  
          return slots;
        });
  
        // Sort the slots by time
        const sortedSlots = availableSlotsHome.sort((a, b) => {
          const aDate = new Date(a);
          const bDate = new Date(b);
          return aDate.getTime() - bDate.getTime();
        });
  
        slotDetails.push({
          date: isoDate,
          availableSlotsHome: sortedSlots,
          bookedSlots: bookedSlots,
        });
      }
  
      let bookedByCurrentUser;
      if (userId) {
        bookedByCurrentUser = await this.prisma.appointment.findFirst({
          where: {
            serviceProviderId: serviceProvider.id,
            userId: userId,
            service: {
              hasSome: ['HomeCare'],
            },
            appointmentTime: {
              gte: new Date(today),
            },
          },
        });
      }
  
      const isProviderAppointedEver = await this.prisma.appointment.findFirst({
        where: {
          serviceProviderId: serviceProvider.id,
          service: {
            hasSome: ['HomeCare'],
          },
          status: 'APPROVED',
        },
      });
  
      return {
        slotDetails,
        serviceProvider: provider,
        isBookedByCurrentUser: !!bookedByCurrentUser,
        status: bookedByCurrentUser?.status,
        isProviderAppointedEver: !!isProviderAppointedEver,
      };
    } catch (error) {
      console.error('Error fetching home care schedule:', error);
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////

  async getSlotsByVideoConsult(
    username: string,
    selectedDateByClient: string,
    clientCurrentTimezone: Date,
    userId?: string,
    slots?: string,
  ) {
    try {
      // Fetch the doctor by username and ensure providerType is 'Doctor'
      const doctor = await this.prisma.serviceProvider.findFirst({
        where: {
          user: {
            username: username,
          },
          providerType: 'Doctor', // Ensure the provider is a doctor
        },
        include: {
          schedule: {
            include: {
              slots: true, // Include slots for the schedule
            },
          },
        },
      });
  
      if (!doctor) throw new UnauthorizedException('Unauthorized Access');
  
      const selectedDate = new Date(selectedDateByClient);
      const isoDate = formatISO(selectedDate); // Convert to ISO format
  
      console.log(selectedDate, selectedDateByClient, isoDate);
  
      // Get all appointments for the given date using ISO date
      const appointments = await this.prisma.appointment.findMany({
        where: {
          serviceProviderId: doctor.id,
          appointmentTime: {
            gte: new Date(selectedDate.setHours(0, 0, 0, 0)), // Start of the day
            lt: new Date(selectedDate.setHours(23, 59, 59, 999)), // End of the day
          },
        },
        select: {
          appointmentTime: true,
        },
      });
  
      // Extract booked slots
      const bookedSlots = appointments.map(
        (appointment) => appointment.appointmentTime.toISOString().split('T')[1]?.slice(0, 5),
      );
  
      // Parse the given slot time
      if (!slots) {
        throw new InternalServerErrorException('Slot is undefined');
      }
      const givenSlotHr = parseInt(slots.split(':')[0]);
      const givenSlotMin = parseInt(slots.split(':')[1]);
      const totalSlotTime = givenSlotHr * 60 + givenSlotMin + 30;
  
      // const currentDateTime = clientCurrentTimezone;
      // Filter available slots
      const availableSlots = doctor.schedule
        ?.flatMap((schedule) => schedule.slots)
        .filter((slot) => {
          const slotTime = slot.startTime.toISOString().split('T')[1]?.slice(0, 5);
          const slotHr = parseInt(slotTime.split(':')[0]);
          const slotMin = parseInt(slotTime.split(':')[1]);
          const slotTotalMin = slotHr * 60 + slotMin;
  
          // Exclude slots that are booked or outside the allowed time range
          if (
            bookedSlots.includes(slotTime) ||
            slotTotalMin < totalSlotTime ||
            slotTotalMin > totalSlotTime + 30
          ) {
            return false;
          }
          return true;
        });
  
      // Sort available slots by time
      const sortedAvailableSlots = availableSlots?.sort((a, b) => {
        const aTime = a.startTime.getTime();
        const bTime = b.startTime.getTime();
        return aTime - bTime;
      });
  
      console.log(sortedAvailableSlots);
  
      const today = clientCurrentTimezone.toISOString().split('T')[0];
  
      let bookedByCurrentUser;
      if (userId) {
        bookedByCurrentUser = await this.prisma.appointment.findFirst({
          where: {
            serviceProviderId: doctor.id,
            userId: userId,
            appointmentTime: {
              gte: new Date(today),
            },
          },
        });
      }
  
      return {
        availableSlots: sortedAvailableSlots,
        doctor,
        isBookedByCurrentUser: !!bookedByCurrentUser,
        status: bookedByCurrentUser?.status,
        isDoctorAppointedEver: !!bookedByCurrentUser,
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Internal Server Error!');
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////

  async checkProviderAvailability(
    providerId: string,
    date: string,
    slot: string,
    service: Service, // Use the Service enum
  ) {
    try {
      console.log(`Checking availability for provider: ${providerId}, date: ${date}, slot: ${slot}, service: ${service}`);
  
      // Fetch appointments for the given provider, date, and service
      const appointments = await this.prisma.appointment.findMany({
        where: {
          serviceProviderId: providerId,
          appointmentTime: {
            gte: new Date(new Date(date).setHours(0, 0, 0, 0)), // Start of the day
            lt: new Date(new Date(date).setHours(23, 59, 59, 999)), // End of the day
          },
          service: { has: service }, // Match the service (e.g., VideoConsultation, HomeCare)
          status: { in: ['APPROVED', 'PENDING'] },
        },
        select: {
          appointmentTime: true,
        },
      });
  
      console.log(`Appointments found: ${appointments.length}`);
  
      // Extract booked slots
      const bookedSlots = appointments.map(
        (appointment) => appointment.appointmentTime.toISOString().split('T')[1]?.slice(0, 5),
      );
  
      console.log(`Booked slots: ${JSON.stringify(bookedSlots)}`);
  
      // Fetch the provider's details and schedules
      const provider = await this.prisma.serviceProvider.findUnique({
        where: {
          id: providerId,
        },
        select: {
          name: true, // Include the name field
          schedule: {
            include: {
              slots: true, // Include slots for the schedule
            },
          },
          providerType: true,
          fee: true,
          id: true,
          user: {
            select: {
              name: true,
              address: true,
              profilePic: true,
            },
          },
        },
      });
      
      if (!provider) {
        throw new NotFoundException('Provider not found');
      }
      
      console.log(`Provider details fetched: ${provider.name}`);
  
      // Filter available slots based on the service
      const availableSlots = provider.schedule
        ?.filter((schedule) => schedule.service === service) // Match the service field
        .flatMap((schedule) => schedule.slots)
        .filter((slot) => !bookedSlots.includes(slot.startTime.toISOString().split('T')[1]?.slice(0, 5)));
  
      console.log(`Available slots: ${availableSlots?.length}`);
  
      return {
        provider,
        isAvailable: availableSlots?.some((s) => s.startTime.toISOString().split('T')[1]?.slice(0, 5) === slot),
        availableSlots,
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  async integratedCareCheckProviderAvailability(dto: {
  homeVisitNursingId: string;
  h_apptDate: string;
  h_slotTime: string;
  videoDoctorId: string;
  v_apptDate: string;
  v_slotTime: string;
}) {
  try {
    // Check availability for VideoConsultation (Doctor)
    const videoAppointments = await this.prisma.appointment.findMany({
      where: {
        serviceProviderId: dto.videoDoctorId,
        appointmentTime: {
          gte: new Date(new Date(dto.v_apptDate).setHours(0, 0, 0, 0)), // Start of the day
          lt: new Date(new Date(dto.v_apptDate).setHours(23, 59, 59, 999)), // End of the day
        },
        service: { has: 'VideoConsultation' },
        status: { in: ['APPROVED', 'PENDING'] },
      },
      select: {
        appointmentTime: true,
      },
    });

    const videoBookedSlots = videoAppointments.map(
      (appointment) => appointment.appointmentTime.toISOString().split('T')[1]?.slice(0, 5),
    );

    const videoDoctor = await this.prisma.serviceProvider.findUnique({
  where: {
    id: dto.videoDoctorId,
  },
  select: {
    schedule: {
      include: {
        slots: true,
      },
    },
    providerType: true,
    fee: true,
    id: true,
    user: {
      select: {
        name: true,
        address: true,
        profilePic: true,
      },
    },
  },
});

if (!videoDoctor) {
  throw new NotFoundException('Video consultation doctor not found');
}

const videoAvailableSlots = videoDoctor.schedule
  ?.filter((schedule) => schedule.service === 'VideoConsultation')
  .flatMap((schedule) => schedule.slots)
  .filter((slot) => !videoBookedSlots.includes(slot.startTime.toISOString().split('T')[1]?.slice(0, 5)));

    // Check availability for HomeCare (Nursing)
// Removed unused variable 'homeAppointments'

const homeAppointments = await this.prisma.appointment.findMany({
  where: {
    serviceProviderId: dto.homeVisitNursingId,
    appointmentTime: {
      gte: new Date(new Date(dto.h_apptDate).setHours(0, 0, 0, 0)), // Start of the day
      lt: new Date(new Date(dto.h_apptDate).setHours(23, 59, 59, 999)), // End of the day
    },
    service: { has: 'HomeCare' },
    status: { in: ['APPROVED', 'PENDING'] },
  },
  select: {
    appointmentTime: true,
  },
});

const homeBookedSlots = homeAppointments.map(
  (appointment) => appointment.appointmentTime.toISOString().split('T')[1]?.slice(0, 5),
);

const homeNursing = await this.prisma.serviceProvider.findUnique({
  where: {
    id: dto.homeVisitNursingId,
  },
  select: {
    schedule: {
      include: {
        slots: true,
      },
    },
    providerType: true,
    fee: true,
    id: true,
    user: {
      select: {
        name: true,
        address: true,
        profilePic: true,
      },
    },
  },
});

if (!homeNursing) {
  throw new NotFoundException('Home care nursing provider not found');
}

const homeAvailableSlots = homeNursing.schedule
  ?.filter((schedule) => schedule.service === 'HomeCare')
  .flatMap((schedule) => schedule.slots)
  .filter((slot) => !homeBookedSlots.includes(slot.startTime.toISOString().split('T')[1]?.slice(0, 5)));

    // Check if both slots are available
    const isVideoAvailable = videoAvailableSlots.some(
      (slot) => slot.startTime.toISOString().split('T')[1]?.slice(0, 5) === dto.v_slotTime,
    );

    const isHomeVisitAvailable = homeAvailableSlots.some(
      (slot) => slot.startTime.toISOString().split('T')[1]?.slice(0, 5) === dto.h_slotTime,
    );

    // Validate time dependency (HomeCare must be at least 30 minutes before VideoConsultation)
    const homeSlotTime = new Date(`${dto.h_apptDate}T${dto.h_slotTime}`);
    const videoSlotTime = new Date(`${dto.v_apptDate}T${dto.v_slotTime}`);
    const timeDifference = (videoSlotTime.getTime() - homeSlotTime.getTime()) / (1000 * 60); // Difference in minutes

    const isTimeDependencySatisfied = timeDifference >= 30;

    const { schedule: s1, ...videoDoctorDetails } = videoDoctor;
    const { schedule: s2, ...homeNursingDetails } = homeNursing;

    return {
      homeNursing: homeNursingDetails,
      videoDoctor: videoDoctorDetails,
      isVideoDoctorAvailable: isVideoAvailable,
      isHomeVisitNursingAvailable: isHomeVisitAvailable,
      isTimeDependencySatisfied,
    };
  } catch (error) {
    console.error(error);
    throw new InternalServerErrorException('Internal Server Error');
  }
}

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  async checkProviderAvailableShedule(
    providerId: string,
    date: string,
    slot: string,
    serviceType: Service, // Use the Service enum
  ) {
    try {
      console.log('Checking schedule for:', { providerId, date, serviceType, slot });
  
      // Fetch appointments for the given provider, date, and service type
      const appointments = await this.prisma.appointment.findMany({
        where: {
          serviceProviderId: providerId,
          appointmentTime: {
            gte: new Date(new Date(date).setHours(0, 0, 0, 0)), // Start of the day
            lt: new Date(new Date(date).setHours(23, 59, 59, 999)), // End of the day
          },
          service: { has: serviceType }, // Match the service type (e.g., HomeCare, VideoConsultation)
          status: { in: ['APPROVED', 'PENDING'] },
        },
        select: {
          appointmentTime: true,
        },
      });
  
      console.log('Appointments found:', appointments);
  
      // Extract booked slots
      const bookedSlots = appointments.map(
        (appointment) => appointment.appointmentTime.toISOString().split('T')[1]?.slice(0, 5),
      );
  
      console.log('Booked slots:', bookedSlots);
  
      // Fetch the provider's schedules
      const provider = await this.prisma.serviceProvider.findUnique({
        where: {
          id: providerId,
        },
        select: {
          schedule: {
            include: {
              slots: true, // Include slots for the schedule
            },
          },
          providerType: true,
          fee: true,
          user: {
            select: {
              name: true,
              address: true,
              profilePic: true,
            },
          },
        },
      });
  
      if (!provider) {
        throw new NotFoundException('Provider not found');
      }
  
      console.log('Provider details fetched:', provider);
  
      // Filter available slots based on the service type
      const availableSlots = provider.schedule
        ?.filter((schedule) => schedule.service === serviceType) // Match the service field
        .flatMap((schedule) => schedule.slots)
        .filter((slot) => !bookedSlots.includes(slot.startTime.toISOString().split('T')[1]?.slice(0, 5)));
  
      console.log('Available slots:', availableSlots);
  
      // Check if the given slot is available
      const isSlotAvailable = availableSlots?.some(
        (s) => s.startTime.toISOString().split('T')[1]?.slice(0, 5) === slot,
      );
  
      console.log('Is slot available:', isSlotAvailable);
  
      return isSlotAvailable;
    } catch (error) {
      console.error('Error checking provider schedule:', error);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  async uploadProviderProfile(userId: string, file?: Express.Multer.File) {
    try {
      if (file) {
        // Fetch the user and ensure they exist
        const user = await this.prisma.user.findUnique({
          where: {
            id: userId,
          },
          include: {
            serviceProvider: true, // Include the related service provider details
          },
        });

        if (!user) throw new UnauthorizedException('Unauthorized Access');

        // Check if the user is associated with a service provider
        const serviceProvider = user.serviceProvider?.[0]; // Access the first service provider
        if (!serviceProvider) {
          throw new NotFoundException('Service provider not found for this user');
        }

        // Delete the existing profile picture if it exists
        const profileId = user.profilePic;
        if (profileId) {
          await this.storageService.delete('providerProfile/' + profileId);
        }

        // Generate a new media ID and process the uploaded file
        const mediaId = this.generateMediaId();
        const filebuffer = await sharp(file.buffer)
          .webp({ quality: 80 }) // Adjust quality as needed
          .toBuffer();

        // Save the processed file to storage
        const p = await this.storageService.save(
          'providerProfile/' + mediaId,
          'image/webp', // Set the mimetype for WebP
          filebuffer,
          [{ mediaId: mediaId }],
        );

        // Update the user's profile picture
        const update = await this.prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            profilePic: p.mediaId,
          },
        });

        return update.profilePic ?? null;
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }
  
  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }


  convertTimeToMinutes(time) {
    // Split the time into hours, minutes, and am/pm
    const [hourStr, minuteStr] = time.split(':');
    let hour = parseInt(hourStr, 10);
    let minute = parseInt(minuteStr, 10);

    // Adjust the hour for PM times
    if (time.toLowerCase().includes('pm') && hour !== 12) {
      hour += 12;
    }

    // Calculate the total minutes past midnight
    const totalMinutes = hour * 60 + minute;
    return totalMinutes;
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////////////

  async bookAppointment(dto: AppointmentDto) {
    try {
      console.log('Booking appointment for:', dto.service);
  
      // Check if the provider is available for the given schedule
      const checkAvailability = await this.checkProviderAvailableShedule(
        dto.serviceProviderId,
        dto.appointmentTime.toISOString().split('T')[0], // Extract date from appointmentTime
        dto.appointmentTime.toISOString().split('T')[1]?.slice(0, 5), // Extract time from appointmentTime
        dto.service[0], // Assuming the first service type is used for availability check
      );
  
      console.log('Availability check result:', checkAvailability);
  
      if (!checkAvailability) {
        throw new BadRequestException('Slot not available');
      }

      if (!dto.slotId) {
        throw new BadRequestException('Slot ID is required');
      }
  
      // Create the appointment
      const appointment = await this.prisma.appointment.create({
        data: {
          serviceProviderId: dto.serviceProviderId,
          userId: dto.userId,
          appointmentTime: dto.appointmentTime,
          service: dto.service,
          reason: dto.reason,
          status: dto.status || 'PENDING', // Default to 'PENDING' if not provided
          isForOthers: dto.isForOthers || false,
          slotId: dto.slotId,
          patientId: dto.patientId,
          bookedAt: dto.bookedAt || new Date(),
        },
      });
  
      console.log('Appointment created:', appointment);
  
      return appointment;
    } catch (error) {
      console.error('Error booking appointment:', error);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   async IntegratedBookAppointment(dto: integratedBookAppointmentDTO) {
    try {
      console.log(
        dto,
        'iso',
        formatISO(new Date(dto.h_apptDate)),
        formatISO(dto.v_apptDate),
        new Date(dto.h_apptDate),
        new Date(dto.v_apptDate),
      );
  
      // Check availability for HomeCare (Nursing)
      const checkHomeCareAvailability = await this.checkProviderAvailableShedule(
        dto.homeNursingId,
        dto.h_apptDate,
        dto.h_slot,
        'HomeCare',
      );
  
      // Check availability for VideoConsultation (Doctor)
      const checkVideoConsultAvailability = await this.checkProviderAvailableShedule(
        dto.videoDoctorId,
        dto.v_apptDate,
        dto.v_slot,
        'VideoConsultation',
      );
  
      console.log(checkHomeCareAvailability, checkVideoConsultAvailability);
  
      if (!checkHomeCareAvailability || !checkVideoConsultAvailability) {
        throw new BadRequestException('One or both slots are not available');
      }
  
      // Validate time dependency: HomeCare must be at least 30 minutes before VideoConsultation
      const homeSlotTime = new Date(`${dto.h_apptDate}T${dto.h_slot}`);
      const videoSlotTime = new Date(`${dto.v_apptDate}T${dto.v_slot}`);
      const timeDifference = (videoSlotTime.getTime() - homeSlotTime.getTime()) / (1000 * 60); // Difference in minutes
  
      if (timeDifference < 30) {
        throw new BadRequestException(
          'HomeCare slot must be at least 30 minutes before VideoConsultation slot',
        );
      }
  
      // Create both appointments in a transaction
      const appointments = await this.prisma.$transaction([
        this.prisma.appointment.create({
          data: {
            serviceProviderId: dto.homeNursingId,
            userId: dto.userId,
            appointmentTime: homeSlotTime,
            service: ['HomeCare'],
            status: 'PENDING',
            reason: dto.reason,
            slotId: 'home-slot-id', // Replace with the actual slot ID
            patientId: 'patient-id', // Replace with the actual patient ID
          },
        }),
        this.prisma.appointment.create({
          data: {
            serviceProviderId: dto.videoDoctorId,
            userId: dto.userId,
            appointmentTime: videoSlotTime,
            service: ['VideoConsultation'],
            status: 'PENDING',
            reason: dto.reason,
            slotId: 'video-slot-id', // Replace with the actual slot ID
            patientId: 'patient-id', // Replace with the actual patient ID
          },
        }),
      ]);
  
      if (!appointments || appointments.length !== 2) {
        throw new BadRequestException('Appointments could not be created');
      }
  
      return appointments;
    } catch (error) {
      console.error('Error booking integrated appointment:', error);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  async doctorDashboardDetails(doctorProfileId: string, currentLocalTime: Date) {
    if (!doctorProfileId) {
      throw new BadRequestException('Invalid doctorProfileId');
    }
  
    try {
      // Ensure the provider is of type Doctor
      const doctor = await this.prisma.serviceProvider.findUnique({
        where: {
          id: doctorProfileId,
        },
        select: {
          providerType: true,
        },
      });
  
      if (!doctor || doctor.providerType !== 'Doctor') {
        throw new BadRequestException('This dashboard is only available for Doctors');
      }
  
      // Count total appointments
      const totalAppointments = await this.prisma.appointment.count({
        where: {
          serviceProviderId: doctorProfileId,
        },
      });
  
      // Count total pending appointments
      const totalPendingAppointments = await this.prisma.appointment.count({
        where: {
          serviceProviderId: doctorProfileId,
          status: 'PENDING',
        },
      });
  
      // Count total approved appointments
      const totalApprovedAppointments = await this.prisma.appointment.count({
        where: {
          serviceProviderId: doctorProfileId,
          status: 'APPROVED',
        },
      });
  
      // Count total rejected appointments
      const totalRejectedAppointments = await this.prisma.appointment.count({
        where: {
          serviceProviderId: doctorProfileId,
          status: 'REJECTED',
        },
      });
  
      // Get today's date
      const today = currentLocalTime.toISOString().split('T')[0];
  
      // Fetch today's appointment details
      const todayAppointmentsDetails = await this.prisma.appointment.findMany({
        where: {
          serviceProviderId: doctorProfileId,
          appointmentTime: {
            gte: new Date(`${today}T00:00:00`),
            lt: new Date(`${today}T23:59:59`),
          },
        },
        select: {
          user: {
            select: {
              name: true,
              phone: true,
              profilePic: true,
              id: true,
            },
          },
          isForOthers: true,
          reason: true,
          id: true,
          status: true,
          appointmentTime: true,
        },
      });
  
      // Fetch upcoming appointments
      const upcomingAppointments = await this.prisma.appointment.findMany({
        where: {
          serviceProviderId: doctorProfileId,
          appointmentTime: {
            gt: currentLocalTime,
          },
        },
        select: {
          user: {
            select: {
              name: true,
              phone: true,
              profilePic: true,
            },
          },
          isForOthers: true,
          reason: true,
          id: true,
          status: true,
          appointmentTime: true,
        },
      });
  
      return {
        totalAppointments,
        totalPendingAppointments,
        totalApprovedAppointments,
        totalRejectedAppointments,
        totalTodayAppointments: todayAppointmentsDetails.length,
        todayAppointmentsDetails,
        upcomingAppointments,
      };
    } catch (error) {
      console.error('Error fetching doctor dashboard info:', error);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  async nursingDashboardDetails(nursingProfileId: string, currentLocalTime: Date) {
    if (!nursingProfileId) {
      throw new BadRequestException('Invalid nursingProfileId');
    }
  
    try {
      // Ensure the provider is of type Nursing
      const nursing = await this.prisma.serviceProvider.findUnique({
        where: {
          id: nursingProfileId,
        },
        select: {
          providerType: true,
        },
      });
  
      if (!nursing || nursing.providerType !== 'Nursing') {
        throw new BadRequestException('This dashboard is only available for Nursing providers');
      }
  
      // Count total appointments
      const totalAppointments = await this.prisma.appointment.count({
        where: {
          serviceProviderId: nursingProfileId,
        },
      });
  
      // Count total pending appointments
      const totalPendingAppointments = await this.prisma.appointment.count({
        where: {
          serviceProviderId: nursingProfileId,
          status: 'PENDING',
        },
      });
  
      // Count total approved appointments
      const totalApprovedAppointments = await this.prisma.appointment.count({
        where: {
          serviceProviderId: nursingProfileId,
          status: 'APPROVED',
        },
      });
  
      // Count total rejected appointments
      const totalRejectedAppointments = await this.prisma.appointment.count({
        where: {
          serviceProviderId: nursingProfileId,
          status: 'REJECTED',
        },
      });
  
      // Get today's date
      const today = currentLocalTime.toISOString().split('T')[0];
  
      // Fetch today's appointment details
      const todayAppointmentsDetails = await this.prisma.appointment.findMany({
        where: {
          serviceProviderId: nursingProfileId,
          appointmentTime: {
            gte: new Date(`${today}T00:00:00`),
            lt: new Date(`${today}T23:59:59`),
          },
        },
        select: {
          user: {
            select: {
              name: true,
              phone: true,
              profilePic: true,
              id: true,
            },
          },
          isForOthers: true,
          reason: true,
          id: true,
          status: true,
          appointmentTime: true,
        },
      });
  
      // Fetch upcoming appointments
      const upcomingAppointments = await this.prisma.appointment.findMany({
        where: {
          serviceProviderId: nursingProfileId,
          appointmentTime: {
            gt: currentLocalTime,
          },
        },
        select: {
          user: {
            select: {
              name: true,
              phone: true,
              profilePic: true,
            },
          },
          isForOthers: true,
          reason: true,
          id: true,
          status: true,
          appointmentTime: true,
        },
      });
  
      return {
        totalAppointments,
        totalPendingAppointments,
        totalApprovedAppointments,
        totalRejectedAppointments,
        totalTodayAppointments: todayAppointmentsDetails.length,
        todayAppointmentsDetails,
        upcomingAppointments,
      };
    } catch (error) {
      console.error('Error fetching nursing dashboard info:', error);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  async labDashboardDetails(labProfileId: string, currentLocalTime: Date) {
    if (!labProfileId) {
      throw new BadRequestException('Invalid labProfileId');
    }
  
    try {
      // Ensure the provider is of type Lab
      const lab = await this.prisma.serviceProvider.findUnique({
        where: {
          id: labProfileId,
        },
        select: {
          providerType: true,
        },
      });
  
      if (!lab || lab.providerType !== 'Lab') {
        throw new BadRequestException('This dashboard is only available for Lab providers');
      }
  
      // Count total appointments
      const totalAppointments = await this.prisma.appointment.count({
        where: {
          serviceProviderId: labProfileId,
        },
      });
  
      // Count total pending appointments
      const totalPendingAppointments = await this.prisma.appointment.count({
        where: {
          serviceProviderId: labProfileId,
          status: 'PENDING',
        },
      });
  
      // Count total approved appointments
      const totalApprovedAppointments = await this.prisma.appointment.count({
        where: {
          serviceProviderId: labProfileId,
          status: 'APPROVED',
        },
      });
  
      // Count total rejected appointments
      const totalRejectedAppointments = await this.prisma.appointment.count({
        where: {
          serviceProviderId: labProfileId,
          status: 'REJECTED',
        },
      });
  
      // Get today's date
      const today = currentLocalTime.toISOString().split('T')[0];
  
      // Fetch today's appointment details
      const todayAppointmentsDetails = await this.prisma.appointment.findMany({
        where: {
          serviceProviderId: labProfileId,
          appointmentTime: {
            gte: new Date(`${today}T00:00:00`),
            lt: new Date(`${today}T23:59:59`),
          },
        },
        select: {
          user: {
            select: {
              name: true,
              phone: true,
              profilePic: true,
              id: true,
            },
          },
          isForOthers: true,
          reason: true,
          id: true,
          status: true,
          appointmentTime: true,
        },
      });
  
      // Fetch upcoming appointments
      const upcomingAppointments = await this.prisma.appointment.findMany({
        where: {
          serviceProviderId: labProfileId,
          appointmentTime: {
            gt: currentLocalTime,
          },
        },
        select: {
          user: {
            select: {
              name: true,
              phone: true,
              profilePic: true,
            },
          },
          isForOthers: true,
          reason: true,
          id: true,
          status: true,
          appointmentTime: true,
        },
      });
  
      return {
        totalAppointments,
        totalPendingAppointments,
        totalApprovedAppointments,
        totalRejectedAppointments,
        totalTodayAppointments: todayAppointmentsDetails.length,
        todayAppointmentsDetails,
        upcomingAppointments,
      };
    } catch (error) {
      console.error('Error fetching lab dashboard info:', error);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  async assistantDashboardDetails(assistantProfileId: string, currentLocalTime: Date) {
    if (!assistantProfileId) {
      throw new BadRequestException('Invalid assistantProfileId');
    }
  
    try {
      // Ensure the provider is of type Assistant
      const assistant = await this.prisma.serviceProvider.findUnique({
        where: {
          id: assistantProfileId,
        },
        select: {
          providerType: true,
        },
      });
  
      if (!assistant || assistant.providerType !== 'DoctorsAssistant') {
        throw new BadRequestException('This dashboard is only available for Assistants');
      }
  
      // Count total appointments assigned to the assistant's doctor
      const totalAppointments = await this.prisma.appointment.count({
        where: {
          serviceProviderId: assistantProfileId,
        },
      });
  
      // Count total pending appointments
      const totalPendingAppointments = await this.prisma.appointment.count({
        where: {
          serviceProviderId: assistantProfileId,
          status: 'PENDING',
        },
      });
  
      // Count total approved appointments
      const totalApprovedAppointments = await this.prisma.appointment.count({
        where: {
          serviceProviderId: assistantProfileId,
          status: 'APPROVED',
        },
      });
  
      // Count total rejected appointments
      const totalRejectedAppointments = await this.prisma.appointment.count({
        where: {
          serviceProviderId: assistantProfileId,
          status: 'REJECTED',
        },
      });
  
      // Get today's date
      const today = currentLocalTime.toISOString().split('T')[0];
  
      // Fetch today's appointment details
      const todayAppointmentsDetails = await this.prisma.appointment.findMany({
        where: {
          serviceProviderId: assistantProfileId,
          appointmentTime: {
            gte: new Date(`${today}T00:00:00`),
            lt: new Date(`${today}T23:59:59`),
          },
        },
        select: {
          user: {
            select: {
              name: true,
              phone: true,
              profilePic: true,
              id: true,
            },
          },
          isForOthers: true,
          reason: true,
          id: true,
          status: true,
          appointmentTime: true,
        },
      });
  
      // Fetch upcoming appointments
      const upcomingAppointments = await this.prisma.appointment.findMany({
        where: {
          serviceProviderId: assistantProfileId,
          appointmentTime: {
            gt: currentLocalTime,
          },
        },
        select: {
          user: {
            select: {
              name: true,
              phone: true,
              profilePic: true,
            },
          },
          isForOthers: true,
          reason: true,
          id: true,
          status: true,
          appointmentTime: true,
        },
      });
  
      return {
        totalAppointments,
        totalPendingAppointments,
        totalApprovedAppointments,
        totalRejectedAppointments,
        totalTodayAppointments: todayAppointmentsDetails.length,
        todayAppointmentsDetails,
        upcomingAppointments,
      };
    } catch (error) {
      console.error('Error fetching assistant dashboard info:', error);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  async hospitalDashboardDetails(hospitalProfileId: string, currentLocalTime: Date) {
    if (!hospitalProfileId) {
      throw new BadRequestException('Invalid hospitalProfileId');
    }
  
    try {
      // Ensure the provider is of type Hospital
      const hospital = await this.prisma.serviceProvider.findUnique({
        where: {
          id: hospitalProfileId,
        },
        select: {
          providerType: true,
          name: true,
        },
      });
  
      if (!hospital || hospital.providerType !== 'Hospital') {
        throw new BadRequestException('This dashboard is only available for Hospitals');
      }
  
      // Fetch all linked providers (Doctor, Nursing, Lab, Assistant) under the hospital
      const linkedProviders = await this.prisma.serviceProvider.findMany({
        where: {
          adminPanelId: hospitalProfileId, // Assuming `adminPanelId` links providers to the hospital
          providerType: { in: ['Doctor', 'Nursing', 'Lab', 'DoctorsAssistant'] },
        },
        select: {
          id: true,
          name: true,
          providerType: true,
        },
      });
  
      // Aggregate appointment data for all linked providers
      const providerIds = linkedProviders.map((provider) => provider.id);
  
      // Count total appointments for all linked providers
      const totalAppointments = await this.prisma.appointment.count({
        where: {
          serviceProviderId: { in: providerIds },
        },
      });
  
      // Count total pending appointments
      const totalPendingAppointments = await this.prisma.appointment.count({
        where: {
          serviceProviderId: { in: providerIds },
          status: 'PENDING',
        },
      });
  
      // Count total approved appointments
      const totalApprovedAppointments = await this.prisma.appointment.count({
        where: {
          serviceProviderId: { in: providerIds },
          status: 'APPROVED',
        },
      });
  
      // Count total rejected appointments
      const totalRejectedAppointments = await this.prisma.appointment.count({
        where: {
          serviceProviderId: { in: providerIds },
          status: 'REJECTED',
        },
      });
  
      // Get today's date
      const today = currentLocalTime.toISOString().split('T')[0];
  
      // Fetch today's appointment details for all linked providers
      const todayAppointmentsDetails = await this.prisma.appointment.findMany({
        where: {
          serviceProviderId: { in: providerIds },
          appointmentTime: {
            gte: new Date(`${today}T00:00:00`),
            lt: new Date(`${today}T23:59:59`),
          },
        },
        select: {
          serviceProvider: {
            select: {
              name: true,
              providerType: true,
            },
          },
          user: {
            select: {
              name: true,
              phone: true,
              profilePic: true,
              id: true,
            },
          },
          isForOthers: true,
          reason: true,
          id: true,
          status: true,
          appointmentTime: true,
        },
      });
  
      // Fetch upcoming appointments for all linked providers
      const upcomingAppointments = await this.prisma.appointment.findMany({
        where: {
          serviceProviderId: { in: providerIds },
          appointmentTime: {
            gt: currentLocalTime,
          },
        },
        select: {
          serviceProvider: {
            select: {
              name: true,
              providerType: true,
            },
          },
          user: {
            select: {
              name: true,
              phone: true,
              profilePic: true,
            },
          },
          isForOthers: true,
          reason: true,
          id: true,
          status: true,
          appointmentTime: true,
        },
      });
  
      return {
        hospital: {
          id: hospitalProfileId,
          name: hospital.name,
          providerType: hospital.providerType,
        },
        linkedProviders,
        totalAppointments,
        totalPendingAppointments,
        totalApprovedAppointments,
        totalRejectedAppointments,
        totalTodayAppointments: todayAppointmentsDetails.length,
        todayAppointmentsDetails,
        upcomingAppointments,
      };
    } catch (error) {
      console.error('Error fetching hospital dashboard info:', error);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  async getPatients(providerId: string) {
    try {
      // Fetch appointments for the given provider ID with status 'APPROVED'
      const patients = await this.prisma.appointment.findMany({
        where: {
          serviceProviderId: providerId,
          status: 'APPROVED',
        },
        select: {
          user: {
            select: {
              name: true,
    
              address: true,
              bloodGroup: true,
              phone: true,
              dob: true,
              email: true,
              profilePic: true,
              userId: true,
            },
          },
        },
      });
  
      // Filter duplicate patients based on userId
      const uniquePatients = patients.filter((patient, index, self) => {
        const firstIndex = self.findIndex(
          (t) => t.user.userId === patient.user.userId,
        );
        return index === firstIndex;
      });
  
      return uniquePatients;
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  async actionOnPatients(dto: {
    serviceProviderId: string; // Generalized for all provider types
    userId: string;
    action: 'APPROVED' | 'REJECTED' | 'CANCELLED'; // Restrict actions to valid statuses
    apptId: string;
  }) {
    console.log('Action on patient DTO:', dto);
  
    try {
      // Validate if the appointment exists and belongs to the service provider
      const appointment = await this.prisma.appointment.findFirst({
        where: {
          id: dto.apptId,
          serviceProviderId: dto.serviceProviderId,
          userId: dto.userId,
        },
      });
  
      if (!appointment) {
        throw new NotFoundException('Appointment not found or unauthorized access');
      }
  
      // Update the appointment status
      const update = await this.prisma.appointment.update({
        where: {
          id: dto.apptId,
        },
        data: {
          status: dto.action,
        },
      });
  
      console.log('Appointment updated:', update);
      return update;
    } catch (error) {
      console.error('Error performing action on patient:', error);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  async getPatientsMedicalByProvider(pid: string, providerId?: string) {
    try {
      // Fetch the patient's medical records
      const patient = await this.prisma.user.findUnique({
        where: {
          userId: pid,
        },
        select: {
          medicalRecords: {
            include: {
              serviceProvider: {
                select: {
                  user: {
                    select: {
                      name: true,
                      profilePic: true,
                    },
                  },
                },
              },
            },
          },
          id: true,
        },
      });
  
      if (!patient) {
        throw new NotFoundException('Patient not found');
      }
  
      let isMyProvider = false;
  
      // Check if the provider has an approved appointment with the patient
      if (providerId) {
        const approvedAppointment = await this.prisma.appointment.findFirst({
          where: {
            status: 'APPROVED',
            serviceProviderId: providerId,
            userId: patient.id,
          },
        });
  
        isMyProvider = !!approvedAppointment;
      }
  
      return {
        patient,
        isMyProvider,
      };
    } catch (error) {
      console.error('Error fetching patient medical records:', error);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   async getPatientsMedicalBySelf(userId: string) {
    try {
      // Fetch the user's medical records
      const patient = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          medicalRecords: {
            include: {
              serviceProvider: {
                select: {
                  user: {
                    select: {
                      name: true,
                      profilePic: true,
                    },
                  },
                  providerType: true, // Include provider type for better context
                },
              },
            },
          },
          id: true,
          name: true,
          profilePic: true,
        },
      });
  
      if (!patient) {
        throw new NotFoundException('Patient not found');
      }
  
      return {
        patient,
      };
    } catch (error) {
      console.error('Error fetching patient medical records:', error);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  async getPatientsInfo(pid: string) {
    try {
      // Fetch the patient's information
      const patient = await this.prisma.user.findUnique({
        where: {
          userId: pid,
        },
        select: {
          name: true, // Assuming `name` is a single field for full name
          address: true,
          bloodGroup: true,
          phone: true, // Updated to match the schema field
          dob: true,
          email: true,
          profilePic: true,
          userId: true,
        },
      });
  
      if (!patient) {
        throw new NotFoundException('Patient not found');
      }
  
      return patient;
    } catch (error) {
      console.error('Error fetching patient info:', error);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  async addMedicalRecord(
    patientId: string,
    providerId: string,
    file: Express.Multer.File,
    description: string,
    diagnosis: string,
    prescription: string,
  ) {
    try {
      // Validate input
      if (!file || !patientId || !providerId || !diagnosis || !prescription) {
        throw new BadRequestException('Missing required fields');
      }
  
      // Generate a unique media ID for the file
      const mediaId = this.generateMediaId();
  
      // Save the file to storage
      const savedFile = await this.storageService.save(
        'medicalRecords/' + mediaId,
        file.mimetype,
        file.buffer,
        [{ mediaId: mediaId }],
      );
  
      if (!savedFile) {
        throw new InternalServerErrorException('Failed to save the file');
      }
  
      // Create a new medical record in the database
      const newRecord = await this.prisma.medicalRecord.create({
        data: {
          serviceProviderId: providerId,
          userId: patientId,
          attachment: mediaId,
          description: description,
          diagnosis: diagnosis, // Provide the required field
          prescription: prescription, // Provide the required field
          recordId: `R-${this.generateMediaId()}`,
        },
      });
  
      if (!newRecord) {
        throw new InternalServerErrorException('Failed to create medical record');
      }
  
      console.log('Medical record created:', newRecord);
      return newRecord;
    } catch (error) {
      console.error('Error adding medical record:', error);
      throw error instanceof BadRequestException || error instanceof InternalServerErrorException
        ? error
        : new InternalServerErrorException('Internal Server Error');
    }
  }

///////////////////////////////////////////////////////////////////////////////////////////////////////////

async addDocuments(providerId: string, file: Express.Multer.File) {
  try {
    // Validate input
    if (!file || !providerId) {
      throw new BadRequestException('Missing required fields');
    }

    // Check if the service provider exists and already has a document
    const provider = await this.prisma.serviceProvider.findUnique({
      where: {
        id: providerId,
      },
      select: {
        document: true,
      },
    });

    if (!provider) {
      throw new NotFoundException('Service provider not found');
    }

    if (provider.document) {
      throw new ConflictException('Document already exists');
    }

    // Generate a unique media ID for the document
    const mediaId = this.generateMediaId();

    // Save the document to storage
    const savedFile = await this.storageService.save(
      'providerDocuments/' + mediaId,
      file.mimetype,
      file.buffer,
      [{ mediaId: mediaId }],
    );

    if (!savedFile) {
      throw new InternalServerErrorException('Failed to save the document');
    }

    // Update the service provider's document field
    const updatedProvider = await this.prisma.serviceProvider.update({
      where: {
        id: providerId,
      },
      data: {
        document: mediaId,
      },
    });

    if (!updatedProvider) {
      throw new InternalServerErrorException('Failed to update service provider document');
    }

    console.log('Document added:', updatedProvider);
    return updatedProvider;
  } catch (error) {
    console.error('Error adding document:', error);
    throw error instanceof BadRequestException || error instanceof ConflictException || error instanceof InternalServerErrorException
      ? error
      : new InternalServerErrorException('Internal Server Error');
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
  
async removeDocuments(providerId: string) {
  try {
    // Validate input
    if (!providerId) {
      throw new BadRequestException('Missing provider ID');
    }

    // Check if the service provider exists and has a document
    const provider = await this.prisma.serviceProvider.findUnique({
      where: {
        id: providerId,
      },
      select: {
        document: true,
      },
    });

    if (!provider) {
      throw new NotFoundException('Service provider not found');
    }

    if (!provider.document) {
      throw new NotFoundException('Document not found');
    }

    // Delete the document from storage
    await this.storageService.delete('providerDocuments/' + provider.document);

    // Update the service provider's document field to null
    const updatedProvider = await this.prisma.serviceProvider.update({
      where: {
        id: providerId,
      },
      data: {
        document: null,
      },
    });

    console.log('Document removed:', updatedProvider);
    return updatedProvider;
  } catch (error) {
    console.error('Error removing document:', error);
    throw error instanceof BadRequestException || error instanceof NotFoundException
      ? error
      : new InternalServerErrorException('Internal Server Error');
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
}

