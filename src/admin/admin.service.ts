import {
    Injectable,
    InternalServerErrorException,
    NotFoundException,
  } from '@nestjs/common';
  import { PrismaService } from 'src/prisma.service';
  import { ProviderType } from '@prisma/client';

  @Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllUsers() {
    try {
      return await this.prisma.user.findMany({
        select: {
          id: true,
          userId: true,
          providerId: true,
          username: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          gender: true,
          dob: true,
          bloodGroup: true,
          isActive: true,
          profilePic: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  async getUnVerifiedProvider() {
    try {
      // Count all providers with specific roles
      const ProviderList = await this.prisma.user.count({
        where: {
          role: {
            in: ['Doctor', 'Nursing', 'DoctorsAssistant', 'Hospital'], // Use $in for filtering roles
          },
        },
      });
  
      // Count all patients
      const patientsList = await this.prisma.user.count({
        where: {
          role: 'Patient',
        },
      });
  
      // Fetch unverified providers with status 'PENDING'
      const providers = await this.prisma.serviceProvider.findMany({
        where: {
          status: 'PENDING',
        },
        select: {
          id: true,
          createdAt: true,
          document: true,
          providerType: true, 
          specialization: true,
          service: true,
          userId: true,

          user: {
            select: {
              name: true,
              email: true,
              gender: true,
              profilePic: true,
              username: true,
            },
          },
        },
      });
  
      // Return the results
      return {
        providers,
        ProviderList,
        patientsList,
      };
    } catch (error) {
      console.error('Error in getUnVerifiedProvider:', error.message);
      throw new InternalServerErrorException('Failed to fetch unverified providers.');
    }
  }

  async getAppointments(filter?: { status?: string; serviceProviderId?: string; userId?: string }, page = 1, limit = 10) {
    try {
      const where: any = {};
  
      // Apply filters if provided
      if (filter?.status) {
        where.status = filter.status;
      }
      if (filter?.serviceProviderId) {
        where.serviceProviderId = filter.serviceProviderId;
      }
      if (filter?.userId) {
        where.userId = filter.userId;
      }
  
      // Fetch appointments with pagination and filtering
      const appointments = await this.prisma.appointment.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          service: true,
          status: true,
          appointmentTime: true,
          bookedAt: true,
          reason: true,
          isForOthers: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          serviceProvider: {
            select: {
              name: true,
              providerType: true,
            },
          },
        },
      });
  
      // Count total appointments for pagination
      const totalAppointments = await this.prisma.appointment.count({ where });
  
      return {
        data: appointments,
        total: totalAppointments,
        page,
        limit,
      };
    } catch (error) {
      console.error('Error in getAppointments:', error.message);
      throw new InternalServerErrorException('Failed to fetch appointments.');
    }
  }


  async actionOnProvider(userId: string, action: string, providerType: ProviderType) {
    try {
      // Fetch the service provider based on the userId
      const serviceProvider = await this.prisma.serviceProvider.findUnique({
        where: {
          userId: userId, // Ensure this matches the correct field in your schema
        },
      });
  
      if (!serviceProvider) {
        throw new NotFoundException(`Service provider with userId ${userId} not found`);
      }
  
      // Perform the transaction to update the service provider and user
      const transaction = await this.prisma.$transaction([
        this.prisma.serviceProvider.update({
          where: {
            userId: userId,
          },
          data: {
            status: action as 'APPROVED' | 'REJECTED',
          },
        }),
        this.prisma.user.update({
          where: {
            id: serviceProvider.userId,
          },
          data: {
            role: action === 'APPROVED' ? providerType : 'Patient', // Update role based on action
          },
        }),
      ]);
  
      return {
        message: `Service provider ${action.toLowerCase()} successfully`,
        data: transaction,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error in actionOnProvider:', error.message);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }




}
