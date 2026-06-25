"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const typeorm_1 = require("@nestjs/typeorm");
const user_entity_1 = require("../src/modules/users/entities/user.entity");
const bcrypt = require("bcrypt");
async function seed() {
    console.log('🌱 Seeding database...');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const userRepository = app.get((0, typeorm_1.getRepositoryToken)(user_entity_1.User));
    const adminEmail = 'marwen2405@gmail.com';
    const existingAdmin = await userRepository.findOne({ where: { email: adminEmail } });
    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash('123456', 10);
        const admin = userRepository.create({
            email: adminEmail,
            password: hashedPassword,
            name: 'Admin',
            role: 'admin',
            isActive: true,
            subscriptionStart: new Date(),
            subscriptionEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 10)),
        });
        await userRepository.save(admin);
        console.log('✅ Admin créé avec succès !');
    }
    else {
        console.log('✅ Admin déjà existant');
    }
    const clientEmail = 'client@test.com';
    const existingClient = await userRepository.findOne({ where: { email: clientEmail } });
    if (!existingClient) {
        const hashedPassword = await bcrypt.hash('123456', 10);
        const client = userRepository.create({
            email: clientEmail,
            password: hashedPassword,
            name: 'Client Test',
            role: 'client',
            isActive: true,
            subscriptionStart: new Date(),
            subscriptionEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        });
        await userRepository.save(client);
        console.log('✅ Client de test créé avec succès !');
    }
    else {
        console.log('✅ Client de test déjà existant');
    }
    await app.close();
    console.log('🎉 Seeding terminé !');
}
seed().catch(error => {
    console.error('❌ Erreur lors du seeding:', error);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map