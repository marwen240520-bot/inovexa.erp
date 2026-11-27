import { Controller, Get, Patch, Body, Param, UseGuards, Request, Post, Delete, UploadedFile, UseInterceptors, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './users.dto';
import { ClientModulesService } from '../client-modules/client-modules.service';
import { AuthService } from '../auth/auth.service';
import { isPlatformAdmin } from '../saas/account-access';

import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
@ApiTags('Utilisateurs')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly clientModulesService: ClientModulesService,
    private readonly authService: AuthService,
  ) {}

  @Get('profile')
  async getProfile(@Request() req: any) {
    return this.usersService.getProfile(req.user.actorId ?? req.user.userId);
  }

  /**
   * Changer d'adresse email exige le mot de passe actuel (`currentPassword`) et passe par AuthService.changeEmail :
   * nouvelle adresse à confirmer par un code, ancienne adresse prévenue. Les autres champs ne demandent rien de plus.
   */
  @Patch('profile')
  async updateProfile(@Request() req: any, @Body() body: UpdateProfileDto) {
    const actorId = req.user.actorId ?? req.user.userId;
    const { email, currentPassword, language, ...rest } = body || {};
    const change = email !== undefined ? await this.authService.changeEmail(actorId, email, String(currentPassword ?? ''), language, (req.ip || '').toString()) : null;
    const profile = await this.usersService.updateProfile(actorId, rest);
    return change?.changed ? { ...profile, emailChange: { codeSent: change.emailSent === true, verificationRequired: change.verification?.required === true } } : profile;
  }

  @Patch('change-password')
  async changePassword(@Request() req: any, @Body() body: { oldPassword: string; newPassword: string }) {
    const actorId = req.user.actorId ?? req.user.userId;
    const result = await this.usersService.changePassword(actorId, body?.oldPassword, body?.newPassword);
    // Les autres sessions ouvertes sont fermées ; celle-ci continue avec un nouveau jeton.
    const access_token = await this.authService.rotateSession(actorId);
    // Le titulaire est prévenu par email : un mot de passe changé à son insu doit se voir tout de suite.
    await this.authService.notifyPasswordChanged(actorId);
    return { ...result, access_token };
  }

  // GET /users/:id/modules -> configuration des modules de l'utilisateur
  @Get(':id/modules')
  async getUserModules(@Param('id') id: string, @Request() req: any) {
    const targetId = parseInt(id, 10);
    if (!isPlatformAdmin(req.user.role) && Number(req.user.userId) !== targetId && Number(req.user.actorId) !== targetId) {
      throw new ForbiddenException('Acces non autorise');
    }
    return this.usersService.getUserModules(targetId);
  }
}
