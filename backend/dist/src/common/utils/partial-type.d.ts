export declare function createPartialDto<T extends object>(DtoClass: new () => T): new (partial: Partial<T>) => Partial<T>;
