"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const path_1 = require("path");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: [
            process.env.FRONTEND_URL || 'http://localhost:3000',
            'http://localhost:3000',
        ],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe());
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'uploads'), {
        prefix: '/uploads/',
    });
    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`🚀 Server running on port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map