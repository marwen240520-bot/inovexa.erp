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
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/entities/user.entity");
const fs = require("fs");
const path = require("path");
let UploadService = class UploadService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async saveAvatar(userId, file) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('Utilisateur non trouvé');
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
    async updateAvatar(userId, file) {
        return this.saveAvatar(userId, file);
    }
    async deleteAvatar(userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('Utilisateur non trouvé');
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
    async getAvatar(userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        if (user.avatar) {
            return {
                success: true,
                avatar: user.avatar,
                url: `/uploads/avatars/${user.avatar}`
            };
        }
        return { success: false, avatar: null };
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UploadService);
//# sourceMappingURL=upload.service.js.map