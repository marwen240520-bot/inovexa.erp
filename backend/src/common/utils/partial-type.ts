export function createPartialDto<T extends object>(DtoClass: new () => T): new (partial: Partial<T>) => Partial<T> {
  return class PartialDto {
    constructor(partial: Partial<T>) {
      const instance = new DtoClass();
      Object.keys(instance).forEach(key => {
        if (partial[key] !== undefined) {
          (this as any)[key] = partial[key];
        }
      });
    }
  };
}
