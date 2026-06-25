"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDate = validateDate;
exports.formatDateForDB = formatDateForDB;
function validateDate(dateValue) {
    if (!dateValue)
        return null;
    if (dateValue === "" || dateValue === "undefined" || dateValue === "null")
        return null;
    const parsedDate = new Date(dateValue);
    if (isNaN(parsedDate.getTime()))
        return null;
    return parsedDate;
}
function formatDateForDB(dateValue) {
    const validDate = validateDate(dateValue);
    if (!validDate)
        return null;
    return validDate.toISOString();
}
//# sourceMappingURL=date.utils.js.map