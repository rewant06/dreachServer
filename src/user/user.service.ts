import {
  // ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';

import {
  UpdateUserDetailsDto,
  UpdatePatientsDetailsDto,
  ApplyForServiceProviderDto,
} from './dto/user.dto';
import { PrismaService } from 'src/prisma.service';
import { Service, ProviderType, Gender } from '@prisma/client';

// import { hash } from 'bcrypt';
// import { NotFoundError } from 'rxjs';

// import { v4 as uuidv4 } from 'uuid';
import { UtilsService } from 'src/utils/utils.service';
// import { formatISO } from 'date-fns';
import { StorageService } from 'src/storage/storage.service';
import * as sharp from 'sharp';

// import * as fs from 'fs';
import { Readable } from 'stream';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utils: UtilsService,
    private readonly storageService: StorageService,
  ) {}

  private async isUsernameTaken(username: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });
    return !!user;
  }

  async createUser(email: string) {
    try {
      // Check if a user with the given email already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
        include: {
          serviceProvider: {
            select: {
              id: true,
              providerType: true,
              specialization: true,
              experience: true,
              description: true,
              fee: true,
            },
          },
        },
      });

      // If the user already exists, return the existing user
      if (existingUser) return existingUser;

      // Generate a base username from the email
      const baseUsername = email.split('@')[0];
      let username = baseUsername + this.utils.generateRandomString(3);

      // Ensure the username is unique
      while (await this.isUsernameTaken(username)) {
        username = baseUsername + this.utils.generateRandomString(3);
      }

      // Create the new user
      const newUser = await this.prisma.user.create({
        data: {
          email: email,
          role: 'Patient',
          userId: `PT-${this.utils.generateRandomString(5)}`, // Generate a unique userId
          username: username, // Use the unique username
        },
      });

      // Return the newly created user
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  // async updateUsersProfile(serviceProvider: UpdateUserDetailsDto) {
  //   // Check if the user exists
  //   const user = await this.prisma.user.findUnique({
  //     where: {
  //       id: serviceProvider.userId,
  //     },
  //   });

  //   if (!user) throw new NotFoundException('User not found');

  //   // Prepare the update data
  //   const updateData: {
  //     name?: string;
  //     specialization?: string[];
  //     fee?: number;
  //     experience?: number;
  //     description?: string;
  //     address?: {
  //       update: {
  //         address: string;
  //         city: string;
  //         state: string;
  //         country: string;
  //         pincode: string;
  //       };
  //     };
  //   } = {
  //     name: serviceProvider.name,
  //     specialization: serviceProvider.specialization,
  //     fee: serviceProvider.fee,
  //     experience: serviceProvider.experience,
  //     description: serviceProvider.description,
  //   };

  //   // Handle address update if provided
  //   if (serviceProvider.address) {
  //     updateData.address = {
  //       update: {
  //         address: serviceProvider.address.address,
  //         city: serviceProvider.address.city,
  //         state: serviceProvider.address.state,
  //         country: serviceProvider.address.country,
  //         pincode: serviceProvider.address.pincode,
  //       },
  //     };
  //   }

  //   // Update the ServiceProvider
  //   const updatedServiceProvider = await this.prisma.serviceProvider.update({
  //     where: {
  //       id: serviceProvider.userId, // Ensure `id` corresponds to the ServiceProvider model's unique identifier
  //     },
  //     data: updateData,
  //   });

  //   if (!updatedServiceProvider)
  //     throw new InternalServerErrorException('Something went wrong');

  //   return updatedServiceProvider;
  // }

  async generateMediaId() {
    return await this.storageService.generateMediaId();
  }

  async uploadProviderProfile(
    dto: UpdateUserDetailsDto,
    file?: Express.Multer.File,
  ) {
    try {
      const { userId, ...res } = dto;

      // Check if the user exists
      const user = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });
      if (!user) throw new UnauthorizedException('Unauthorized Access');

      // Handle profile picture upload
      let profilePic = user.profilePic;
      if (file) {
        if (profilePic) {
          await this.storageService.delete('providerProfile/' + profilePic);
        }
        const mediaId = await this.generateMediaId();
        const filebuffer = await sharp(file.buffer)
          .webp({ quality: 80 }) // Adjust quality as needed
          .toBuffer();
        const uploadedFile = await this.storageService.save(
          'providerProfile/' + mediaId,
          'image/webp', // Set the mimetype for WebP
          filebuffer,
          [{ mediaId: mediaId }],
        );
        profilePic = uploadedFile.mediaId;
      }

      // Update the ServiceProvider
      const updatedServiceProvider = await this.prisma.serviceProvider.update({
        where: {
          id: userId, // Ensure `id` corresponds to the ServiceProvider model's unique identifier
        },
        data: {
          name: res.name,
          specialization: res.specialization, // Updated to handle `String[]`
          fee: res.fee,
          experience: res.experience,
          description: res.description,
        },
      });

      // Update the address separately if provided
      if (res.address) {
        await this.prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            address: {
              update: {
                address: res.address.address,
                city: res.address.city,
                state: res.address.state,
                country: res.address.country,
                pincode: res.address.pincode,
              },
            },
          },
        });
      }

      // Update the user's profile picture
      await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          profilePic: profilePic,
        },
      });

      return updatedServiceProvider;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  async createServiceProviderProfile(dto: ApplyForServiceProviderDto) {
    const {
      userId,
      providerType,
      specialization,
      fee,
      experience,
      description,
      document,
      registrationNumber,
      service,
    } = dto;

    try {
      console.log('Received DTO:', dto);

      // Check if the user exists
      const user = await this.prisma.user.findUnique({
        where: { userId },
      });

      if (!user) {
        console.error(`User with userId ${userId} not found`);
        throw new NotFoundException('User not found');
      }

      console.log('User found:', user);

      let prefix: string;

      switch (providerType) {
        case 'Doctor':
          prefix = 'DR';
          break;
        case 'Nursing':
          prefix = 'NR';
          break;
        case 'DoctorsAssistant':
          prefix = 'DA';
          break;
        case 'Hospital':
          prefix = 'HS';
          break;
        case 'Lab':
          prefix = 'LAB';
          break;
        default:
          prefix = 'RI'; // Default prefix if providerType doesn't match any case
      }

      const providerId = `${prefix}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      console.log('Generated providerId:', providerId);

      const existingProvider = await this.prisma.serviceProvider.findUnique({
        where: { userId },
      });

      if (existingProvider) {
        console.log('Service provider already exists, updating providerId...');
        await this.prisma.serviceProvider.update({
          where: { userId },
          data: { providerId },
        });
      }

      // Create the ServiceProvider profile
      const serviceProviderProfile = await this.prisma.serviceProvider.create({
        data: {
          user: { connect: { id: user.id } },
          name: user.name ?? 'Default Name',
          providerType,
          registrationNumber: registrationNumber,
          document: document,
          specialization: specialization ?? [],
          fee,
          service: service ?? [],
          experience,
          description,
          status: 'PENDING',
          providerId,
          dob: user.dob ? new Date(user.dob) : null, // Handle null dob
        },
      });

      console.log('Service provider profile created:', serviceProviderProfile);

      return serviceProviderProfile;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(
        `Error in createServiceProviderProfile for userId ${userId}:`,
        error.message,
      );
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

  async updateUsersProfile(
    users: UpdatePatientsDetailsDto,
    file?: Express.Multer.File,
  ) {
    try {
      console.log('Received userId:', users.userId); // Debug log

      const { name, dob, gender, bloodGroup, address, phone } = users;

      // Check if the user exists
      const user = await this.prisma.user.findUnique({
        where: {
          userId: users.userId, // Ensure `userId` is passed in the DTO
        },
        include: {
          address: true, // Include the address relation
        },
      });

      if (!user) {
        console.error(`User with ID ${users.userId} not found`);
        throw new UnauthorizedException(
          'User not found or unauthorized access',
        );
      }

      // Convert `dob` to a valid Date object if provided
      let formattedDob: Date | null = null;
      if (dob) {
        formattedDob = new Date(dob);
        if (isNaN(formattedDob.getTime())) {
          throw new BadRequestException(
            'Invalid date format for dob. Expected ISO-8601 format.',
          );
        }
      }

      // Handle profile picture upload
      let profilePic = user.profilePic;
      if (file) {
        if (profilePic) {
          console.log(`Deleting existing profile picture: ${profilePic}`);
          await this.storageService.delete('doctorProfile/' + profilePic);
          console.log(`Profile picture deleted successfully: ${profilePic}`);
        }
        const mediaId = await this.generateMediaId();
        const filebuffer = await sharp(file.buffer)
          .webp({ quality: 80 }) // Adjust quality as needed
          .toBuffer();
        profilePic = `${mediaId}.webp`;
        console.log(`Uploading new profile picture: ${profilePic}`);
        await this.storageService.upload(
          'doctorProfile/' + profilePic,
          filebuffer,
        );
        console.log(`Profile picture uploaded successfully: ${profilePic}`);
      }

      // Check if an address exists for the user
      if (address) {
        if (user.address) {
          // Update the existing address
          await this.prisma.address.update({
            where: {
              id: user.address.id,
            },
            data: {
              address: address.address,
              city: address.city,
              state: address.state,
              country: address.country,
              pincode: address.pincode,
            },
          });
        } else {
          // Create a new address
          if (!user) {
            throw new BadRequestException(
              'User information is required to create an address.',
            );
          }

          await this.prisma.address.create({
            data: {
              address: address.address,
              city: address.city,
              state: address.state,
              country: address.country,
              pincode: address.pincode,
              user: {
                connect: { id: user.id },
              },
            },
          });
        }
      }

      // Update user details
      await this.prisma.user.update({
        where: {
          userId: users.userId,
        },
        data: {
          name,
          dob: formattedDob, // Use the formatted Date object
          gender: gender as Gender, // Ensure gender matches the enum
          bloodGroup,
          phone,
          profilePic,
        },
      });

      console.log(
        `User profile updated successfully for userId: ${users.userId}`,
      );
      return { message: 'Profile updated successfully', user };
    } catch (error) {
      console.error(error);
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw new InternalServerErrorException('Failed to update profile');
    }
  }

  async getUserById(userId: string) {
    try {
      return await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          serviceProvider: {
            select: {
              specialization: true,
              fee: true,
              experience: true,
              description: true,
              providerType: true,
              status: true,
            },
          },
        },
      });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Internal Server Error!');
    }
  }

  async getUserByEmail(email: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email: email,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          userId: true,
          username: true,
          profilePic: true,
          serviceProvider: {
            select: {
              id: true,
              specialization: true,
              fee: true,
              experience: true,
              description: true,
              providerType: true,
              status: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException(`User with email ${email} not found`);
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error fetching user by email:', error);
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  async fetchUserIdByEmail(email: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email: email,
        },
        select: {
          id: true,
          userId: true,
        },
      });

      if (!user) {
        throw new NotFoundException(`User with email ${email} not found`);
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch user ID');
    }
  }

  async getApprovedDoctors() {
    try {
      return await this.prisma.serviceProvider.findMany({
        where: {
          providerType: 'Doctor', // Filter for doctors
          status: 'APPROVED', // Only approved doctors
        },
        select: {
          providerId: true,
          name: true,
          specialization: true,
          service: true,
          registrationNumber: true,
          fee: true,
          experience: true,
          description: true,
          user: {
            select: {
              email: true,
              phone: true,
              profilePic: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error fetching approved doctors:', error);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  async getApprovedServiceProviders() {
    try {
      return await this.prisma.serviceProvider.findMany({
        where: {
          status: 'APPROVED',
        },
        select: {
          id: true,
          // createdAt: true, // Removed as it is not a valid property
          status: true,
          name: true, // Use `name` instead of `Fname` and `Lname`
          providerType: true,
          userId: true,
          providerId: true,
          user: {
            select: {
              email: true,
              isActive: true,
              profilePic: true,
              username: true,
            },
          },
          specialization: true, // Include specializations if needed
          fee: true, // Include fee if needed
          experience: true, // Include experience if needed
          service: true,
        },
      });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Internal Server Error!');
    }
  }

  async getPatients() {
    try {
      return await this.prisma.user.findMany({
        where: {
          role: 'Patient', // Filter for users with the 'NORMAL' role
          isActive: true, // Ensure the user is active
        },
        select: {
          name: true, // Use `name` instead of `Fname` and `Lname`
          email: true,
          phone: true,
          profilePic: true,
          dob: true,
          userId: true,
          address: true, // Include address if it exists in the schema
        },
      });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Internal Server Error!');
    }
  }

  async findServiceProvidersList() {
    try {
      // Query the ServiceProvider model
      const serviceProviders = await this.prisma.serviceProvider.findMany({
        where: {
          status: 'APPROVED', // Filter for approved service providers
          providerType: {
            in: ['Doctor', 'Hospital', 'Lab', 'Nursing', 'DoctorsAssistant'], // Filter for specific services
          },
        },
        select: {
          id: true,
          specialization: true,
          fee: true,
          service: true,
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
              address: true,
              profilePic: true,
              username: true,
            },
          },
        },
      });

      return serviceProviders;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Internal Server Error!');
    }
  }

  async findServiceProvidersByHomeVisit() {
    try {
      // Query the ServiceProvider model
      const serviceProviders = await this.prisma.serviceProvider.findMany({
        where: {
          status: 'APPROVED', // Filter for approved service providers
          service: { has: 'HomeCare' }, // Filter for providers offering HomeCare service
        },
        select: {
          id: true,
          specialization: true,
          service: true,
          fee: true,
          experience: true,
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
              address: true, // Access address from the User model
              profilePic: true,
              username: true,
            },
          },
        },
      });

      return serviceProviders;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Internal Server Error!');
    }
  }

  getLocalTimezone() {
    const currentDateInServerTimeZone = new Date();

    const istOffsetMilliseconds = 5.5 * 60 * 60 * 1000;
    const s = new Date(
      currentDateInServerTimeZone.getTime() + istOffsetMilliseconds,
    );
    return s;
  }

  async getSlotsByVideoConsult(
    username: string,
    userId?: string,
    date?: string,
    slots?: string,
  ) {
    try {
      // Fetch the ServiceProvider with providerType 'Doctor' by username
      const serviceProvider = await this.prisma.serviceProvider.findFirst({
        where: {
          user: {
            username: username,
          },
          providerType: 'Doctor', // Ensure the provider is a doctor
        },
        include: {
          schedule: true, // Corrected field name
        },
      });

      if (!serviceProvider)
        throw new UnauthorizedException('Unauthorized Access');

      if (!serviceProvider)
        throw new UnauthorizedException('Unauthorized Access');

      const currentDate = new Date(date ?? new Date().toISOString());

      // Fetch appointments for the service provider on the given date
      const appointments = await this.prisma.slot.findMany({
        where: {
          schedule: {
            serviceProviderId: serviceProvider.id,
          },
          slotDate: currentDate, // Use 'slotDate' from the Slot model
          isBooked: true, // Ensure only booked slots are fetched
        },
        select: {
          startTime: true, // Fetch the start time of the booked slots
        },
      });

      // Extract booked slots
      const bookedSlots = appointments.map(
        (appointment) => appointment.startTime,
      );

      // Parse the given slot time
      if (!slots) {
        throw new InternalServerErrorException('Slot is undefined');
      }
      const givenSlotHr = parseInt(slots.split(':')[0]);
      const givenSlotMin = parseInt(slots.split(':')[1]);
      const totalSlotTime = givenSlotHr * 60 + givenSlotMin + 30;

      const currentTime = this.getLocalTimezone();
      const currentDt = currentTime.getDate();

      // Filter available slots
      const availableSlots = serviceProvider.schedule
        ?.filter((schedule) => schedule?.isRecurring) // Only check if the schedule is recurring
        .map((schedule) => {
          if (!schedule?.startTime) return null; // Handle potential null values
          const startTime = schedule.startTime
            .toISOString()
            .split('T')[1]
            ?.slice(0, 5); // Extract time in HH:mm format
          return startTime || ''; // Return empty string if startTime is null
        })
        .filter((slot) => {
          if (!slot) return false; // Skip null or empty slots
          const slotHr = parseInt(slot.split(':')[0], 10);
          const slotMin = parseInt(slot.split(':')[1], 10);
          const slotTotalMin = slotHr * 60 + slotMin;

          if (
            currentDate.getDate() < currentDt ||
            (currentDate.getDate() === currentDt &&
              totalSlotTime > slotTotalMin) ||
            bookedSlots.some(
              (bookedSlot) =>
                bookedSlot?.toISOString().split('T')[1]?.slice(0, 5) === slot,
            )
          ) {
            return false;
          }

          if (
            (currentDate.getDate() > currentDt &&
              totalSlotTime > slotTotalMin) ||
            bookedSlots.some(
              (bookedSlot) =>
                bookedSlot?.toISOString().split('T')[1]?.slice(0, 5) === slot,
            ) ||
            slotTotalMin > totalSlotTime + 30
          ) {
            return false;
          }

          return true;
        });

      return availableSlots.length;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Internal Server Error!');
    }
  }

  async findDoctorByVideoConsultation() {
    try {
      // Fetch all approved doctors offering VideoConsultation
      const doctors = await this.prisma.serviceProvider.findMany({
        where: {
          providerType: 'Doctor', // Ensure only doctors are retrieved
          status: 'APPROVED', // Filter for approved service providers
          service: { has: 'VideoConsultation' }, // Filter for VideoConsultation service
        },
        select: {
          id: true,
          specialization: true,
          fee: true,
          service: true,
          experience: true,
          // schedule: {
          //   include: {
          //     slots: true, // Include slots for the schedule
          //   },
          // },
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
              address: true,
              profilePic: true,
              username: true,
            },
          },
        },
      });
      return doctors;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Internal Server Error!');
    }
  }

  async getServiceProviderByUsername(username: string) {
    try {
      // Fetch the ServiceProvider by username
      const serviceProvider = await this.prisma.serviceProvider.findFirst({
        where: {
          user: {
            username: username,
          },
        },
        select: {
          id: true,
          specialization: true, // Scalar field, moved to `select`
          fee: true, // Scalar field, moved to `select`
          experience: true, // Scalar field, moved to `select`
          description: true, // Scalar field, moved to `select`
          status: true, // Scalar field, moved to `select`
          service: true, // Scalar field, moved to `select`
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
              address: true,
              profilePic: true,
              username: true,
            },
          },
        },
      });

      if (!serviceProvider) {
        throw new NotFoundException('Service provider not found');
      }

      return serviceProvider;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Internal Server Error!');
    }
  }

  async getAppointsForPatients(userId: string) {
    try {
      return await this.prisma.appointment.findMany({
        where: {
          userId: userId,
        },
        select: {
          serviceProvider: {
            select: {
              user: {
                select: {
                  name: true,
                  profilePic: true,
                  username: true,
                  address: true,
                },
              },
              specialization: true,
              fee: true,
            },
          },
          appointmentTime: true, // Use `appointmentTime` instead of `appointmentSlotDate` and `appointmentSlotTime`
          createdAt: true,
          isForOthers: true,
          status: true,
        },
      });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Internal Server Error!');
    }
  }

  async addReview(dto: {
    serviceProviderId: string;
    userId: string;
    comment: string;
    serviceProviderType: ProviderType;
    score: number;
  }) {
    try {
      // Create a review for the service provider
      const review = await this.prisma.rating.create({
        data: {
          comment: dto.comment,
          serviceProviderId: dto.serviceProviderId, // Use `serviceProviderId` directly
          userId: dto.userId, // Use `userId` directly
          serviceProviderType: dto.serviceProviderType, // Use the correct enum value
          score: dto.score, // Include required field
        },
      });

      if (!review) {
        throw new InternalServerErrorException('Failed to create review');
      }

      return review;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Internal Server Error!');
    }
  }

  async checkProviderAvailability(
    serviceProviderId: string,
    date: string,
    slot: string,
  ) {
    try {
      console.log(date);

      // Fetch appointments for the given service provider and date
      const appointments = await this.prisma.appointment.findMany({
        where: {
          serviceProviderId: serviceProviderId, // Use the correct parameter
          appointmentTime: {
            gte: new Date(new Date(date).setHours(0, 0, 0, 0)), // Start of the day
            lt: new Date(new Date(date).setHours(23, 59, 59, 999)), // End of the day
          },
        },
        select: {
          appointmentTime: true,
        },
      });

      // Extract booked slots
      const bookedSlots = appointments.map((appointment) =>
        appointment.appointmentTime.toISOString().split('T')[1]?.slice(0, 5),
      );

      // Fetch the service provider's details
      const provider = await this.prisma.serviceProvider.findUnique({
        where: {
          id: serviceProviderId,
        },
        include: {
          schedule: {
            include: {
              slots: true, // Include slots for the schedule
            },
          },
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
        throw new NotFoundException('Service provider not found');
      }

      // Extract available slots from schedules
      const availableSlots = provider.schedule
        .flatMap((schedule) => schedule.slots) // Extract slots from schedules
        .filter((slot) => {
          const slotTime = slot.startTime
            .toISOString()
            .split('T')[1]
            ?.slice(0, 5);
          return !bookedSlots.includes(slotTime); // Exclude booked slots
        });

      return {
        provider: provider,
        isAvailable: availableSlots.some(
          (availableSlot) =>
            availableSlot.startTime.toISOString().split('T')[1]?.slice(0, 5) ===
            slot,
        ),
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  async getPopularDoctors() {
    try {
      // Fetch all approved doctors (ServiceProviders with providerType: 'Doctor')
      const doctorsWithAppointments =
        await this.prisma.serviceProvider.findMany({
          where: {
            status: 'APPROVED', // Only approved doctors
            providerType: 'Doctor', // Ensure only doctors are retrieved
          },
          include: {
            appointment: true, // Include appointments associated with each doctor
            user: {
              select: {
                name: true,
                profilePic: true,
                username: true,
              },
            },
          },
        });

      // Calculate the appointment count for each doctor
      const doctorsWithAppointmentCounts = doctorsWithAppointments.map(
        (doctor) => ({
          doctor,
          appointmentCount: doctor.appointment.length, // Get the length of the appointment array
        }),
      );

      // Sort doctors by appointment count in descending order
      doctorsWithAppointmentCounts.sort(
        (a, b) => b.appointmentCount - a.appointmentCount,
      );

      // Get the top 5 popular doctors
      const popularDoctors = doctorsWithAppointmentCounts.slice(0, 5);

      // Extract doctor details for the response
      const popularDoctorsDetails = popularDoctors.map(({ doctor }) => ({
        id: doctor.id,
        specialization: doctor.specialization, // Corrected field name
        user: {
          name: doctor.user.name,
          profilePic: doctor.user.profilePic,
          username: doctor.user.username,
        },
      }));

      return popularDoctorsDetails;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Internal Server Error!');
    }
  }

  ////////////////////////////////////////////////////////////////////////////////////////////

  async patientDashboardDetails(patientId: string) {
    try {
      // Validate input
      if (!patientId) {
        throw new BadRequestException('Invalid patientId');
      }

      // Fetch patient details
      const patient = await this.prisma.patient.findUnique({
        where: {
          id: patientId,
        },
        select: {
          id: true,
          age: true,
          bloodGroup: true,
          conditions: true,
          allergies: {
            select: {
              allergen: true,
              severity: true,
              reaction: true,
            },
          },
          treatmentPlans: {
            select: {
              id: true,
              planName: true,
              date: true,
              type: true,
              status: true,
              details: true,
            },
          },
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
              profilePic: true,
            },
          },
        },
      });

      if (!patient) {
        throw new NotFoundException('Patient not found');
      }

      // Fetch upcoming appointments
      const upcomingAppointments = await this.prisma.appointment.findMany({
        where: {
          patientId: patientId,
          appointmentTime: {
            gt: new Date(),
          },
        },
        select: {
          id: true,
          appointmentTime: true,
          reason: true,
          status: true,
          serviceProvider: {
            select: {
              name: true,
              providerType: true,
              user: {
                select: {
                  name: true,
                  profilePic: true,
                },
              },
            },
          },
        },
      });

      // Fetch past appointments
      const pastAppointments = await this.prisma.appointment.findMany({
        where: {
          patientId: patientId,
          appointmentTime: {
            lt: new Date(),
          },
        },
        select: {
          id: true,
          appointmentTime: true,
          reason: true,
          status: true,
          serviceProvider: {
            select: {
              name: true,
              providerType: true,
              user: {
                select: {
                  name: true,
                  profilePic: true,
                },
              },
            },
          },
        },
      });

      // Fetch medical records
      const medicalRecords = await this.prisma.medicalRecord.findMany({
        where: {
          userId: patientId,
        },
        select: {
          id: true,
          diagnosis: true,
          prescription: true,
          notes: true,
          description: true,
          recordId: true,
          attachment: true,
          serviceProvider: {
            select: {
              name: true,
              providerType: true,
              user: {
                select: {
                  name: true,
                  profilePic: true,
                },
              },
            },
          },
        },
      });

      return {
        patient,
        upcomingAppointments,
        pastAppointments,
        medicalRecords,
      };
    } catch (error) {
      console.error('Error fetching patient dashboard details:', error);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////
}
