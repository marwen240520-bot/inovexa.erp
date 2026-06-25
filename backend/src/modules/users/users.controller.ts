import { Controller, Get, Patch, Body, UseGuards, Request, Post, Delete, UploadedFile, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Request() req: any) {
    return this.usersService.getProfile(req.user.userId);
  }

  @Patch('profile')
  async updateProfile(@Request() req: any, @Body() body: { name?: string; email?: string; phone?: string; companyName?: string }) {
    return this.usersService.updateProfile(req.user.userId, body);
  }

  @Patch('change-password')
  async changePassword(@Request() req: any, @Body() body: { oldPassword: string; newPassword: string }) {
    return this.usersService.changePassword(req.user.userId, body.oldPassword, body.newPassword);
  }
}
