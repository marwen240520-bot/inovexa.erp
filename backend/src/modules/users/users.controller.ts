import { Controller, Get, Patch, Post, Delete, Body, Param, UseGuards, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

// Définir un type simple pour le fichier uploadé
interface UploadedFileType {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  filename?: string;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Request() req: any) {
    return this.usersService.getProfile(req.user.userId);
  }

  @Get('stats')
  async getUserStats(@Request() req: any) {
    return this.usersService.getUserStats(req.user.userId);
  }

  @Get('theme')
  async getUserTheme(@Request() req: any) {
    return this.usersService.getUserTheme(req.user.userId);
  }

  @Patch('theme')
  async updateUserTheme(@Request() req: any, @Body() body: { theme: string }) {
    return this.usersService.updateUserTheme(req.user.userId, body.theme);
  }

  @Get(':id/modules')
  async getUserModules(@Param('id') id: string, @Request() req: any) {
    if (req.user.role !== 'admin' && req.user.userId !== parseInt(id)) {
      return { error: 'Accès non autorisé' };
    }
    return this.usersService.getUserModules(parseInt(id));
  }

  @Patch('profile')
  async updateProfile(@Request() req: any, @Body() body: { name?: string; email?: string; phone?: string; companyName?: string }) {
    return this.usersService.updateProfile(req.user.userId, body);
  }

  @Post('profile/image')
  @UseInterceptors(FileInterceptor('file'))
  async updateProfileImage(@Request() req: any, @UploadedFile() file: UploadedFileType) {
    return this.usersService.updateProfileImage(req.user.userId, file);
  }

  @Delete('profile/image')
  async deleteProfileImage(@Request() req: any) {
    return this.usersService.deleteProfileImage(req.user.userId);
  }

  @Patch('change-password')
  async changePassword(@Request() req: any, @Body() body: { oldPassword: string; newPassword: string }) {
    return this.usersService.changePassword(req.user.userId, body.oldPassword, body.newPassword);
  }
}