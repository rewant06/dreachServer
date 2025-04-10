import { Module } from '@nestjs/common';
import { ProviderService } from './service-providers.service';
import { PrismaModule } from '../prisma.module'; // Import PrismaModule
import { StorageService } from '../storage/storage.service';
import { ServiceProvidersController } from './service-providers.controller';

@Module({
  imports: [PrismaModule], // Add PrismaModule here
  controllers: [ServiceProvidersController],
  providers: [ProviderService, StorageService],
})
export class ServiceProvidersModule {}