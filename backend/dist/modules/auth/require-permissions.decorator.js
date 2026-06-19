"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequirePermissions = void 0;
const common_1 = require("@nestjs/common");
const permissions_guard_1 = require("./permissions.guard");
const RequirePermissions = (...permissions) => (0, common_1.SetMetadata)(permissions_guard_1.REQUIRED_PERMISSIONS_KEY, permissions);
exports.RequirePermissions = RequirePermissions;
//# sourceMappingURL=require-permissions.decorator.js.map