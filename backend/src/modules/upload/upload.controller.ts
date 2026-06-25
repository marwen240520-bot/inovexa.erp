import { Controller, Post, Put, Delete, Get, UseGuards, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadService } from './upload.service';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/avatars',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `avatar-${uniqueSuffix}.${file.originalname.split('.').pop()}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  async uploadAvatar(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
    return this.uploadService.saveAvatar(req.user.userId, file);
  }

  @Put('avatar')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/avatars',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `avatar-${uniqueSuffix}.${file.originalname.split('.').pop()}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  async updateAvatar(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
    return this.uploadService.updateAvatar(req.user.userId, file);
  }

  @Delete('avatar')
  async deleteAvatar(@Request() req: any) {
    return this.uploadService.deleteAvatar(req.user.userId);
  }

  @Get('avatar')
  async getAvatar(@Request() req: any) {
    return this.uploadService.getAvatar(req.user.userId);
  }
}
