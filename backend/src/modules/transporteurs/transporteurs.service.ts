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

  async getByClientId(clientId: number) {
    return this.transporteurRepository.find({ 
      where: { clientId, isActive: true },
      relations: ['user']
    });
  }

  async findAll() {
    return this.transporteurRepository.find({ relations: ['user'] });
  }

  async findOne(id: number) {
    const transporteur = await this.transporteurRepository.findOne({ 
      where: { id }, 
      relations: ['user'] 
    });
    if (!transporteur) throw new NotFoundException('Transporteur non trouvé');
    return transporteur;
  }

  async create(clientId: number, data: any) {
    // Vérifier les champs obligatoires
    if (!data.name || !data.email) {
      throw new ConflictException('Le nom et l\'email sont obligatoires');
    }

    // Vérifier si l'email existe déjà dans users
    const existingUser = await this.userRepository.findOne({ where: { email: data.email } });
    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Vérifier si le transporteur existe déjà pour ce client
    const existingTransporteur = await this.transporteurRepository.findOne({ 
      where: { email: data.email, clientId } 
    });
    if (existingTransporteur) {
      throw new ConflictException('Un transporteur avec cet email existe déjà pour ce client');
    }

    // Générer un mot de passe par défaut si non fourni
    let password = data.password;
    let temporaryPassword = null;
    
    if (!password) {
      temporaryPassword = `trans${Math.floor(Math.random() * 10000)}${Math.floor(Math.random() * 1000)}`;
      password = temporaryPassword;
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Créer l'utilisateur associé
    const user = this.userRepository.create({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      companyName: data.companyName || '',
      phone: data.phone || '',
      role: 'transporteur',
      isActive: true
    });
    const savedUser = await this.userRepository.save(user);
    
    // Créer le transporteur
    const transporteur = this.transporteurRepository.create({ 
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      companyName: data.companyName || '',
      address: data.address || '',
      clientId: clientId,
      userId: savedUser.id,
      isActive: true
    });
    
    const savedTransporteur = await this.transporteurRepository.save(transporteur);
    
    // Retourner le transporteur avec le mot de passe temporaire si généré
    return {
      id: savedTransporteur.id,
      name: savedTransporteur.name,
      email: savedTransporteur.email,
      phone: savedTransporteur.phone,
      companyName: savedTransporteur.companyName,
      address: savedTransporteur.address,
      clientId: savedTransporteur.clientId,
      isActive: savedTransporteur.isActive,
      createdAt: savedTransporteur.createdAt,
      temporaryPassword: temporaryPassword
    };
  }

  async update(id: number, clientId: number, data: any) {
    const transporteur = await this.transporteurRepository.findOne({ where: { id, clientId } });
    if (!transporteur) throw new NotFoundException('Transporteur non trouvé');
    
    // Mettre à jour l'utilisateur associé
    if (transporteur.userId) {
      const updateUserData: any = {};
      if (data.name) updateUserData.name = data.name;
      if (data.email) updateUserData.email = data.email;
      if (data.phone) updateUserData.phone = data.phone;
      if (data.companyName) updateUserData.companyName = data.companyName;
      
      if (Object.keys(updateUserData).length > 0) {
        await this.userRepository.update(transporteur.userId, updateUserData);
      }
      
      // Changer le mot de passe si fourni
      if (data.password && data.password.length >= 6) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        await this.userRepository.update(transporteur.userId, { password: hashedPassword });
      }
    }
    
    // Mettre à jour le transporteur
    const updateTransporteurData: any = {};
    if (data.name) updateTransporteurData.name = data.name;
    if (data.email) updateTransporteurData.email = data.email;
    if (data.phone) updateTransporteurData.phone = data.phone;
    if (data.companyName) updateTransporteurData.companyName = data.companyName;
    if (data.address) updateTransporteurData.address = data.address;
    if (data.isActive !== undefined) updateTransporteurData.isActive = data.isActive;
    
    Object.assign(transporteur, updateTransporteurData);
    return this.transporteurRepository.save(transporteur);
  }

  async delete(id: number, clientId: number) {
    const transporteur = await this.transporteurRepository.findOne({ where: { id, clientId } });
    if (!transporteur) throw new NotFoundException('Transporteur non trouvé');
    
    const userId = transporteur.userId;
    
    // 1. D'abord supprimer le transporteur
    await this.transporteurRepository.delete(id);
    
    // 2. Ensuite supprimer l'utilisateur associé
    if (userId) {
      try {
        await this.userRepository.delete(userId);
      } catch (error) {
        console.warn(`⚠️ Impossible de supprimer l'utilisateur ${userId}, désactivation à la place`);
        await this.userRepository.update(userId, { isActive: false });
      }
    }
    
    return { success: true, message: 'Transporteur supprimé avec succès' };
  }

  async softDelete(id: number, clientId: number) {
    const transporteur = await this.transporteurRepository.findOne({ where: { id, clientId } });
    if (!transporteur) throw new NotFoundException('Transporteur non trouvé');
    
    transporteur.isActive = false;
    await this.transporteurRepository.save(transporteur);
    
    if (transporteur.userId) {
      await this.userRepository.update(transporteur.userId, { isActive: false });
    }
    
    return { success: true, message: 'Transporteur désactivé avec succès' };
  }

  async getByUserId(userId: number) {
    return this.transporteurRepository.findOne({ where: { userId } });
  }
}