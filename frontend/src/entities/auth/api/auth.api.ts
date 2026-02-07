/**
 * Auth Entity - API клиенты
 * Re-export сгенерированных hooks для удобства использования
 */

export {
    useAuthLogin,
    useAuthRegister,
    useAuthRefresh,
    useAuthGetMe,
    type AuthLoginMutationResult,
    type AuthRegisterMutationResult,
    type AuthRefreshMutationResult,
    type AuthGetMeQueryResult,
} from '@shared/api/generated/authentication/authentication';

export type {
    LoginDto,
    RegisterDto,
    RefreshTokenDto,
    AuthResponseDto,
    UserMeResponseDto,
} from '@shared/api/generated/models';
