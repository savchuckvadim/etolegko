/**
 * JWT Payload Interface
 * Данные, которые хранятся в JWT токене
 */
export interface JwtPayload {
    sub: string; // user id
    email: string;
    name: string;
}
