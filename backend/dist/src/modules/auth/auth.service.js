"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const user_entity_1 = require("../users/entities/user.entity");
let AuthService = class AuthService {
    constructor(userRepository, jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.dummyHash = bcrypt.hashSync('inovexa-dummy-password-x9f3', 10);
        this.attempts = new Map();
        this.MAX_ATTEMPTS = 5;
        this.WINDOW_MS = 15 * 60 * 1000;
        this.BLOCK_MS = 15 * 60 * 1000;
    }
    guardRateLimit(key) {
        const now = Date.now();
        const rec = this.attempts.get(key);
        if (rec && rec.blockedUntil > now) {
            const mins = Math.ceil((rec.blockedUntil - now) / 60000);
            throw new common_1.HttpException(`Trop de tentatives. Réessayez dans ${mins} min.`, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
    }
    registerFailure(key) {
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
    resetAttempts(key) {
        this.attempts.delete(key);
    }
    async login(email, password) {
        const normalizedEmail = (email || '').trim().toLowerCase();
        this.guardRateLimit(normalizedEmail);
        const user = await this.userRepository
            .createQueryBuilder('u')
            .where('LOWER(u.email) = :email', { email: normalizedEmail })
            .getOne();
        const passwordValid = await bcrypt.compare(password || '', user ? user.password : this.dummyHash);
        if (!user || !passwordValid) {
            this.registerFailure(normalizedEmail);
            throw new common_1.UnauthorizedException('Email ou mot de passe incorrect');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Compte désactivé');
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
    async createClientByAdmin(body) {
        const existingUser = await this.userRepository.findOne({ where: { email: body.email } });
        if (existingUser) {
            throw new common_1.ConflictException('Email déjà utilisé');
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map