import { Controller, Get, Patch, Body, Param, UseGuards, Request, Post, Delete, UploadedFile, UseInterceptors, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { ClientModulesService } from '../client-modules/client-modules.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly clientModulesService: ClientModulesService,
  ) {}

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

  // GET /users/:id/modules -> configuration des modules de l'utilisateur
  @Get(':id/modules')
  async getUserModules(@Param('id') id: string, @Request() req: any) {
    const targetId = parseInt(id, 10);
    if (req.user.role !== 'admin' && Number(req.user.userId) !== targetId) {
      throw new ForbiddenException('Acces non autorise');
    }
    return this.clientModulesService.getModulesByClient(targetId);
  }
}
