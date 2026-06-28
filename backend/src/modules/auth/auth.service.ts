import { Injectable, UnauthorizedException, ConflictException, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  // Hash factice : un bcrypt.compare est toujours exécuté -> temps de réponse
  // constant, ce qui empêche l'énumération des comptes par mesure du temps.
  private readonly dummyHash = bcrypt.hashSync('inovexa-dummy-password-x9f3', 10);

  // Limiteur de tentatives en mémoire, par email.
  private attempts = new Map<string, { count: number; resetAt: number; blockedUntil: number }>();
  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_MS = 15 * 60 * 1000;
  private readonly BLOCK_MS = 15 * 60 * 1000;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  private guardRateLimit(key: string) {
    const now = Date.now();
    const rec = this.attempts.get(key);
    if (rec && rec.blockedUntil > now) {
      const mins = Math.ceil((rec.blockedUntil - now) / 60000);
      throw new HttpException(
        `Trop de tentatives. Réessayez dans ${mins} min.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private registerFailure(key: string) {
    const now = Date.now();
    let rec = this.attempts.get(key);
    if (!rec || rec.resetAt < now) {
      rec = { count: 0, resetAt: now + this.WINDOW_MS, blockedUntil: 0 };
    }
    rec.count += 1;
    if (rec.count >= this.MAX_ATTEMPTS) {
      rec.blockedUntil = now + this.BLOCK_MS;
    }
    this.attempts.set(key, rec);
  }

  private resetAttempts(key: string) {
    this.attempts.delete(key);
  }

  async login(email: string, password: string) {
    const normalizedEmail = (email || '').trim().toLowerCase();
    this.guardRateLimit(normalizedEmail);

    // Recherche insensible à la casse, sans casser les emails déjà enregistrés.
    const user = await this.userRepository
      .createQueryBuilder('u')
      .where('LOWER(u.email) = :email', { email: normalizedEmail })
      .getOne();

    // Toujours comparer un hash (réel ou factice) -> temps de réponse constant.
    const passwordValid = await bcrypt.compare(
      password || '',
      user ? user.password : this.dummyHash,
    );

    if (!user || !passwordValid) {
      this.registerFailure(normalizedEmail);
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Le statut « désactivé » n'est révélé qu'avec des identifiants valides
    // (pas d'énumération des comptes via ce message).
    if (!user.isActive) {
      throw new UnauthorizedException('Compte désactivé');
    }

    this.resetAttempts(normalizedEmail);
    const payload = { userId: user.id, email: user.email, role: user.role };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyName: user.companyName,
        modules: user.modules,
      },
    };
  }

  async createClientByAdmin(body: {
    email: string;
    password: string;
    name: string;
    companyName: string;
    phone?: string;
  }) {
    const existingUser = await this.userRepository.findOne({ where: { email: body.email } });
    if (existingUser) {
      throw new ConflictException('Email déjà utilisé');
    }
    
    const hashedPassword = await bcrypt.hash(body.password, 10);
    
    const user = this.userRepository.create({
      email: body.email,
      password: hashedPassword,
      name: body.name,
      companyName: body.companyName,
      phone: body.phone || '',
      role: 'client',
      isActive: true
    });
    
    await this.userRepository.save(user);
    
    return {
      success: true,
      message: 'Client créé avec succès',
      client: {
        id: user.id,
        email: user.email,
        name: user.name,
        companyName: user.companyName
      }
    };
  }
}
