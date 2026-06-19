"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAdminModuleDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_admin_dto_1 = require("./create-admin.dto");
class UpdateAdminModuleDto extends (0, mapped_types_1.PartialType)(create_admin_dto_1.CreateAdminModuleDto) {
}
exports.UpdateAdminModuleDto = UpdateAdminModuleDto;
//# sourceMappingURL=update-admin.dto.js.map