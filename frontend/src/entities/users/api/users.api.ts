/**
 * Users Entity - API клиенты
 * Re-export сгенерированных hooks для удобства использования
 */

export {
    useUsersCreate,
    useUsersFindAll,
    useUsersFindOne,
    useUsersUpdate,
    useUsersRemove,
    type UsersCreateMutationResult,
    type UsersFindAllQueryResult,
    type UsersFindOneQueryResult,
    type UsersUpdateMutationResult,
    type UsersRemoveMutationResult,
} from '@shared/api/generated/users/users';

export type {
    UserResponseDto,
    CreateUserDto,
    UpdateUserDto,
    UsersFindAllParams,
    PaginatedResponseUserResponseDto,
} from '@shared/api/generated/models';
