import { BadRequestException, Controller, Post, Put, Delete, Get, UseGuards, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomBytes } from 'crypto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AVATAR_DIR, UploadService } from './upload.service';

import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

/** Seules des images sont acceptées, et l'extension vient du type vérifié — jamais du nom de fichier envoyé par le navigateur. */
const IMAGE_EXTENSIONS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

const avatarUpload = () =>
  FileInterceptor('file', {
    storage: diskStorage({
      destination: AVATAR_DIR,
      filename: (_req, file, cb) => cb(null, `avatar-${Date.now()}-${randomBytes(6).toString('hex')}.${IMAGE_EXTENSIONS[file.mimetype] || 'bin'}`),
    }),
    fileFilter: (_req, file, cb) => {
      if (!IMAGE_EXTENSIONS[file.mimetype]) return cb(new BadRequestException('Format non accepté : envoyez une image JPEG, PNG, WebP ou GIF.'), false);
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  });

/** La photo de profil est celle de la PERSONNE connectée (un membre d'équipe ne change pas celle du propriétaire). */
const actor = (req: any): number => req.user.actorId ?? req.user.userId;

@ApiTags('Fichiers')
@ApiBearerAuth()
@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('avatar')
  @UseInterceptors(avatarUpload())
  async uploadAvatar(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
    return this.uploadService.saveAvatar(actor(req), file);
  }

  @Put('avatar')
  @UseInterceptors(avatarUpload())
  async updateAvatar(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
    return this.uploadService.updateAvatar(actor(req), file);
  }

  @Delete('avatar')
  async deleteAvatar(@Request() req: any) {
    return this.uploadService.deleteAvatar(actor(req));
  }

  @Get('avatar')
  async getAvatar(@Request() req: any) {
    return this.uploadService.getAvatar(actor(req));
  }
}
