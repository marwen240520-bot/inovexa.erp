import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import * as fs from 'fs';
import * as path from 'path';
import { sniffImage } from '../../common/security/images';

/** Dossier des photos de profil : le même que celui servi sous /uploads (main.ts), relatif au dossier de lancement. */
export const AVATAR_DIR = path.join(process.cwd(), 'uploads', 'avatars');

/** Nom de fichier produit par l'envoi (voir upload.controller) : tout autre nom est ignoré. */
const AVATAR_NAME = /^avatar-[A-Za-z0-9-]+\.(jpg|jpeg|png|webp|gif)$/i;

@Injectable()
export class UploadService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Supprime l'ancienne photo. Le nom enregistré n'est jamais utilisé tel quel comme chemin : on ne garde que le nom de
   * fichier, et seulement s'il a la forme attendue — une valeur comme « ../../main.js » ne peut donc rien effacer.
   */
  private removeFile(stored: string | null | undefined) {
    if (!stored) return;
    const name = path.basename(String(stored));
    if (!AVATAR_NAME.test(name)) return;
    const full = path.join(AVATAR_DIR, name);
    try {
      if (fs.existsSync(full)) fs.unlinkSync(full);
    } catch {
      /* fichier déjà absent ou disque en lecture seule : sans importance */
    }
  }

  /**
   * Le type annoncé par le navigateur ne prouve rien : on lit les premiers octets du fichier enregistré. Un fichier qui n'est
   * pas une vraie image du format annoncé est supprimé tout de suite.
   */
  private assertRealImage(file: Express.Multer.File) {
    let head = Buffer.alloc(0);
    try {
      const fd = fs.openSync(file.path, 'r');
      try {
        head = Buffer.alloc(12);
        const read = fs.readSync(fd, head, 0, 12, 0);
        head = head.subarray(0, read);
      } finally {
        fs.closeSync(fd);
      }
    } catch {
      head = Buffer.alloc(0);
    }
    const real = sniffImage(head);
    const declared = path.extname(file.filename).slice(1).toLowerCase();
    if (!real || real !== declared) {
      this.removeFile(file.filename);
      throw new BadRequestException('Ce fichier n’est pas une image valide (JPEG, PNG, WebP ou GIF).');
    }
  }

  async saveAvatar(userId: number, file: Express.Multer.File) {
    if (!file || !file.filename) throw new BadRequestException('Aucun fichier reçu.');
    this.assertRealImage(file);
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      this.removeFile(file.filename);
      throw new NotFoundException('Utilisateur non trouvé');
    }

    this.removeFile(user.avatar);
    await this.userRepository.update({ id: user.id }, { avatar: file.filename });

    return {
      success: true,
      avatar: file.filename,
      url: `/uploads/avatars/${file.filename}`,
    };
  }

  async updateAvatar(userId: number, file: Express.Multer.File) {
    return this.saveAvatar(userId, file);
  }

  async deleteAvatar(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    if (user.avatar) {
      this.removeFile(user.avatar);
      await this.userRepository.update({ id: user.id }, { avatar: null as any });
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
        url: `/uploads/avatars/${user.avatar}`,
      };
    }
    return { success: false, avatar: null };
  }
}
