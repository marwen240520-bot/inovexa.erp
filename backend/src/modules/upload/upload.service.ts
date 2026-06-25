import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async saveAvatar(userId: number, file: Express.Multer.File) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    if (user.avatar) {
      const oldPath = path.join(__dirname, '..', '..', 'uploads', 'avatars', user.avatar);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const avatarPath = file.filename;
    user.avatar = avatarPath;
    await this.userRepository.save(user);

    return {
      success: true,
      avatar: avatarPath,
      url: `/uploads/avatars/${avatarPath}`
    };
  }

  async updateAvatar(userId: number, file: Express.Multer.File) {
    return this.saveAvatar(userId, file);
  }

  async deleteAvatar(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    if (user.avatar) {
      const oldPath = path.join(__dirname, '..', '..', 'uploads', 'avatars', user.avatar);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
      user.avatar = null;
      await this.userRepository.save(user);
    }

    return { success: true };
  }

  async getAvatar(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    if (user.avatar) {
      return {
        success: true,
        avatar: user.avatar,
        url: `/uploads/avatars/${user.avatar}`
      };
    }
    return { success: false, avatar: null };
  }
}
