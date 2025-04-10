import { Test, TestingModule } from '@nestjs/testing';
import { ServiceProvidersController } from './service-providers.controller';
import {ProviderService } from './service-providers.service';

describe('ServiceProvidersController', () => {
  let controller: ServiceProvidersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceProvidersController],
      providers: [ProviderService],
    }).compile();

    controller = module.get<ServiceProvidersController>(ServiceProvidersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
