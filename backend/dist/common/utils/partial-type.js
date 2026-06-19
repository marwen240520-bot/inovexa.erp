"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPartialDto = createPartialDto;
function createPartialDto(DtoClass) {
    return class PartialDto {
        constructor(partial) {
            const instance = new DtoClass();
            Object.keys(instance).forEach(key => {
                if (partial[key] !== undefined) {
                    this[key] = partial[key];
                }
            });
        }
    };
}
//# sourceMappingURL=partial-type.js.map