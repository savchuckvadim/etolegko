/**
 * Auth Feature - Экспорт хуков и схем для форм аутентификации
 */

export { useLoginForm } from './hooks/use-login-form';
export { useRegisterForm } from './hooks/use-register-form';

export { loginSchema } from './schemas/login.schema';
export { registerSchema } from './schemas/register.schema';

export type { LoginFormData } from './schemas/login.schema';
export type { RegisterFormData } from './schemas/register.schema';
