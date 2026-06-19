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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const user_entity_1 = require("./entities/user.entity");
let UsersService = class UsersService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async getProfile(id) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        const { password, ...profile } = user;
        return profile;
    }
    async getUserStats(id) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        return {
            totalSales: 0,
            totalOrders: 0,
            totalClients: 0,
            memberSince: user.createdAt || new Date()
        };
    }
    async getUserTheme(id) {
        return { theme: 'dark' };
    }
    async updateUserTheme(id, theme) {
        return { success: true, theme };
    }
    async getUserModules(id) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        if (user.modules) {
            try {
                return JSON.parse(user.modules);
            }
            catch (e) {
                return {};
            }
        }
        return {
            dashboard: true, products: true, categories: true, stock: true,
            sales: true, purchases: true, orders: true, clients: true,
            suppliers: true, invoices: true, hr: true, finance: true,
            logistics: true, production: true, ai: true, reports: true,
            analytics: true, profile: true, settings: true
        };
    }
    async updateProfile(id, body) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        Object.assign(user, body);
        await this.userRepository.save(user);
        const { password, ...profile } = user;
        return profile;
    }
    async updateProfileImage(id, file) {
        return { success: true, message: 'Image de profil mise à jour', filename: file.filename || file.originalname };
    }
    async deleteProfileImage(id) {
        return { success: true, message: 'Image de profil supprimée' };
    }
    async changePassword(id, oldPassword, newPassword) {
        if (!oldPassword || !newPassword) {
            throw new common_1.UnauthorizedException('Ancien et nouveau mot de passe requis');
        }
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        if (!user.password) {
            throw new common_1.UnauthorizedException('Aucun mot de passe défini pour cet utilisateur');
        }
        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Ancien mot de passe incorrect');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await this.userRepository.save(user);
        return { success: true, message: 'Mot de passe changé avec succès' };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map