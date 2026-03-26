import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../users/user.entity';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock_token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should register a new user', async () => {
    const userData = {
      email: 'test@test.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    };

    mockUserRepository.findOne.mockResolvedValue(null);
    mockUserRepository.create.mockReturnValue({ ...userData, id: '1', role: 'user' });
    mockUserRepository.save.mockResolvedValue({ ...userData, id: '1', role: 'user' });

    const result = await service.register(userData.email, userData.password, userData.firstName, userData.lastName);
    expect(result).toHaveProperty('access_token');
  });
});
