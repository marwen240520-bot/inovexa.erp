"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCustomersModuleDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_customers_dto_1 = require("./create-customers.dto");
class UpdateCustomersModuleDto extends (0, mapped_types_1.PartialType)(create_customers_dto_1.CreateCustomersModuleDto) {
}
exports.UpdateCustomersModuleDto = UpdateCustomersModuleDto;
//# sourceMappingURL=update-customers.dto.js.map