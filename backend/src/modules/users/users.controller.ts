import { Controller, Get, Patch, Post, Body, Param, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import * as path from 'path';

// Créer le dossier uploads s'il n'existe pas
const uploadDir = path.join(process.cwd(), 'uploads', 'profiles');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Request() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    if (!userId) {
      return { error: 'Utilisateur non identifié' };
    }
    return this.usersService.getProfile(parseInt(userId));
  }

  @Get(':id/modules')
  async getUserModules(@Param('id') id: string, @Request() req: any) {
    const currentUserId = req.user?.userId || req.user?.id || req.user?.sub;
    if (req.user.role !== 'admin' && currentUserId !== parseInt(id)) {
      return { error: 'Accès non autorisé' };
    }
    return this.usersService.getUserModules(parseInt(id));
  }

  @Patch('profile')
  async updateProfile(@Request() req: any, @Body() body: { name?: string; email?: string; phone?: string; companyName?: string }) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    if (!userId) {
      return { error: 'Utilisateur non identifié' };
    }
    return this.usersService.updateProfile(parseInt(userId), body);
  }

  @Patch('change-password')
  async changePassword(@Request() req: any, @Body() body: { newPassword: string }) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    if (!userId) {
      return { error: 'Utilisateur non identifié' };
    }
    return this.usersService.changePassword(parseInt(userId), body.newPassword);
  }

  @Post('profile-image')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: uploadDir,
      filename: (req: any, file: Express.Multer.File, callback: (error: Error | null, filename: string) => void) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        const userId = req.user?.userId || req.user?.id || req.user?.sub || Date.now();
        callback(null, `profile-${userId}-${uniqueSuffix}${ext}`);
      }
    }),
    fileFilter: (req: any, file: Express.Multer.File, callback: (error: Error | null, accept: boolean) => void) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
        return callback(new Error('Seules les images sont autorisées'), false);
      }
      callback(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 }
  }))
  async uploadProfileImage(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { error: 'Aucun fichier uploadé' };
    }
    
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    const imageUrl = `/uploads/profiles/${file.filename}`;
    const updatedUser = await this.usersService.updateProfileImage(parseInt(userId), imageUrl);
    
    return { 
      success: true, 
      profileImage: imageUrl,
      filename: file.filename 
    };
  }
}