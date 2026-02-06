/**
 * Domain Entity - User
 * Чистая бизнес-логика, без зависимостей от Mongoose
 */
export class User {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    phone?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;

    constructor(partial: Partial<User>) {
        Object.assign(this, partial);
    }
}
