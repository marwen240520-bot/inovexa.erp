import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: any;
  let jwtService: any;

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };
    jwtService = { sign: jest.fn().mockReturnValue('token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user if credentials are valid', async () => {
      const mockUser = { id: '1', email: 'test@test.com', password_hash: 'hash', comparePassword: jest.fn().mockResolvedValue(true) };
      userRepository.findOne.mockResolvedValue(mockUser);
      const result = await service.validateUser('test@test.com', 'password');
      expect(result).toBeDefined();
    });
  });

  describe('login', () => {
    it('should return access token', async () => {
      const user = { id: '1', email: 'test@test.com', first_name: 'Test', last_name: 'User' };
      const result = await service.login(user);
      expect(result.access_token).toBeDefined();
      expect(result.user).toBeDefined();
    });
  });
});
