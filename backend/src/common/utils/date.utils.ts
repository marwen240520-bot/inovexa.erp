export function validateDate(dateValue: any): Date | null {
  if (!dateValue) return null;
  if (dateValue === "" || dateValue === "undefined" || dateValue === "null") return null;
  
  const parsedDate = new Date(dateValue);
  if (isNaN(parsedDate.getTime())) return null;
  
  return parsedDate;
}

export function formatDateForDB(dateValue: any): string | null {
  const validDate = validateDate(dateValue);
  if (!validDate) return null;
  return validDate.toISOString();
}
