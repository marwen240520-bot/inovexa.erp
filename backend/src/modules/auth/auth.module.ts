import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy, JWT_SECRET } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { User } from '../users/entities/user.entity';
import { PermissionsService } from './permissions.service';
import { AccessGuard } from './access.guard';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.register({
      secret: JWT_SECRET,
      // Les sessions expirent : 12 h par défaut (JWT_EXPIRES_IN="7d", "30m"… pour changer).
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '12h') as any },
    }),
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy, PermissionsService, AccessGuard],
  controllers: [AuthController],
  exports: [AuthService, PermissionsService, AccessGuard],
})
export class AuthModule {}
