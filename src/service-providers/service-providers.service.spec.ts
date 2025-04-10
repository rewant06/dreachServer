import { Test, TestingModule } from '@nestjs/testing';
import { ServiceProvidersService } from './service-providers.service';

describe('ServiceProvidersService', () => {
  let service: ServiceProvidersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceProvidersService],
    }).compile();

    service = module.get<ServiceProvidersService>(ServiceProvidersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
