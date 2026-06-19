import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Transporteur } from './entities/transporteur.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class TransporteursService {
  constructor(
    @InjectRepository(Transporteur)
    private transporteurRepository: Repository<Transporteur>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(clientId: number) {
    return this.transporteurRepository.find({
      where: { clientId },
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number, clientId: number) {
    const transporteur = await this.transporteurRepository.findOne({ where: { id, clientId } });
    if (!transporteur) throw new NotFoundException('Transporteur non trouvé');
    return transporteur;
  }

  async create(clientId: number, data: any) {
    // Vérifier si l'email existe déjà
    const existingUser = await this.userRepository.findOne({ where: { email: data.email } });
    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Créer un compte utilisateur pour le transporteur
    const user = this.userRepository.create({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      companyName: data.companyName || '',
      phone: data.phone || '',
      role: 'transporteur',
      isActive: true
    });
    await this.userRepository.save(user);

    // Créer l'entrée transporteur
    const transporteur = this.transporteurRepository.create({
      clientId,
      userId: user.id,
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      companyName: data.companyName || '',
      address: data.address || '',
      isActive: true
    });
    return this.transporteurRepository.save(transporteur);
  }

  async update(id: number, clientId: number, data: any) {
    const transporteur = await this.findOne(id, clientId);
    if (!transporteur) throw new NotFoundException('Transporteur non trouvé');

    // Mettre à jour l'utilisateur associé
    if (transporteur.userId) {
      const updateData: any = {
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        companyName: data.companyName || ''
      };
      if (data.password && data.password.trim() !== '') {
        updateData.password = await bcrypt.hash(data.password, 10);
      }
      await this.userRepository.update(transporteur.userId, updateData);
    }

    // Mettre à jour le transporteur
    Object.assign(transporteur, {
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      companyName: data.companyName || '',
      address: data.address || '',
      isActive: data.status === 'active'
    });
    return this.transporteurRepository.save(transporteur);
  }

  async delete(id: number, clientId: number) {
    const transporteur = await this.findOne(id, clientId);
    if (!transporteur) throw new NotFoundException('Transporteur non trouvé');

    // Supprimer l'utilisateur associé
    if (transporteur.userId) {
      await this.userRepository.delete(transporteur.userId);
    }
    await this.transporteurRepository.delete(id);
    return { success: true };
  }
}
