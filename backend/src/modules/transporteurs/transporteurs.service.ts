import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Transporteur } from './entities/transporteur.entity';
import { User } from '../users/entities/user.entity';
import { assertStrongPassword } from '../auth/auth.service';
import { normalizePhone } from '../../common/phone';

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Transporteurs d'une société (`clientId` = la société). Chaque transporteur a un compte de connexion (rôle
 * « transporteur ») qui ne voit que les expéditions qui lui sont confiées.
 */
@Injectable()
export class TransporteursService {
  constructor(
    @InjectRepository(Transporteur)
    private transporteurRepository: Repository<Transporteur>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async findAll(clientId: number) {
    return this.transporteurRepository.find({
      where: { clientId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, clientId: number) {
    const transporteur = await this.transporteurRepository.findOne({ where: { id, clientId } });
    if (!transporteur) throw new NotFoundException('Transporteur non trouvé');
    return transporteur;
  }

  private clean(data: any, forCreate: boolean) {
    const body = data && typeof data === 'object' ? data : {};
    const name = String(body.name ?? '').trim();
    if (name.length < 2 || name.length > 120) throw new BadRequestException('Nom du transporteur requis (2 à 120 caractères).');
    const email = String(body.email ?? '').trim().toLowerCase();
    if (!EMAIL.test(email) || email.length > 190) throw new BadRequestException('Email du transporteur invalide.');
    const rawPhone = String(body.phone ?? '').trim();
    const phoneCheck = normalizePhone(rawPhone);
    const password = body.password === undefined || body.password === null ? '' : String(body.password);
    if (forCreate || password.trim() !== '') {
      if (!password) throw new BadRequestException('Mot de passe requis pour le compte du transporteur.');
      assertStrongPassword(password);
    }
    return {
      name, email, password,
      phone: phoneCheck.valid ? phoneCheck.normalized : rawPhone.slice(0, 40),
      companyName: String(body.companyName ?? '').trim().slice(0, 160),
      address: String(body.address ?? '').trim().slice(0, 300),
    };
  }

  private async assertEmailFree(email: string, exceptUserId?: number | null) {
    const qb = this.userRepository.createQueryBuilder('u').where('LOWER(u.email) = :email', { email });
    if (exceptUserId) qb.andWhere('u.id <> :id', { id: exceptUserId });
    if (await qb.getOne()) throw new ConflictException('Cet email est déjà utilisé');
  }

  async create(clientId: number, data: any) {
    const input = this.clean(data, true);
    await this.assertEmailFree(input.email);
    const hashedPassword = await bcrypt.hash(input.password, 10);

    // Le compte de connexion et la fiche transporteur sont créés ensemble, ou pas du tout.
    return this.dataSource.transaction(async (em) => {
      const user = await em.save(User, em.create(User, {
        email: input.email, password: hashedPassword, name: input.name, companyName: input.companyName, phone: input.phone,
        role: 'transporteur', isActive: true, signupSource: 'admin',
      } as Partial<User>) as User);
      return em.save(Transporteur, em.create(Transporteur, {
        clientId, userId: user.id, name: input.name, email: input.email, phone: input.phone,
        companyName: input.companyName, address: input.address, isActive: true,
      }));
    });
  }

  async update(id: number, clientId: number, data: any) {
    const transporteur = await this.findOne(id, clientId);
    const input = this.clean(data, false);
    await this.assertEmailFree(input.email, transporteur.userId);
    // « status » absent du formulaire : on garde l'état actuel au lieu de désactiver le transporteur par erreur.
    const isActive = data?.status === undefined || data?.status === null || data?.status === '' ? transporteur.isActive : data.status === 'active';

    return this.dataSource.transaction(async (em) => {
      if (transporteur.userId) {
        const account = await em.findOne(User, { where: { id: transporteur.userId, role: 'transporteur' } });
        if (account) {
          account.name = input.name;
          account.email = input.email;
          account.phone = input.phone;
          account.companyName = input.companyName;
          if (account.isActive !== isActive) {
            account.isActive = isActive;
            if (!isActive) account.tokenVersion = (account.tokenVersion ?? 0) + 1; // coupe ses sessions tout de suite
          }
          if (input.password) {
            account.password = await bcrypt.hash(input.password, 10);
            account.tokenVersion = (account.tokenVersion ?? 0) + 1;
          }
          await em.save(User, account);
        }
      }
      Object.assign(transporteur, { name: input.name, email: input.email, phone: input.phone, companyName: input.companyName, address: input.address, isActive });
      return em.save(Transporteur, transporteur);
    });
  }

  async delete(id: number, clientId: number) {
    const transporteur = await this.findOne(id, clientId);
    await this.dataSource.transaction(async (em) => {
      // Les expéditions restent dans l'historique de la société, simplement sans transporteur.
      await em.query(`UPDATE "shipments" SET "transporteurId" = NULL WHERE "transporteurId" = $1 AND "clientId" = $2`, [id, clientId]);
      await em.delete(Transporteur, { id, clientId });
      if (transporteur.userId) await em.delete(User, { id: transporteur.userId, role: 'transporteur' });
    });
    return { success: true };
  }
}
