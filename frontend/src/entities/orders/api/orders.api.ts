/**
 * Orders Entity - API клиенты
 * Re-export сгенерированных hooks для удобства использования
 */

export {
    useOrdersCreate,
    useOrdersFindAll,
    useOrdersFindById,
    useOrdersUpdate,
    useOrdersRemove,
    type OrdersCreateMutationResult,
    type OrdersFindAllQueryResult,
    type OrdersFindByIdQueryResult,
    type OrdersUpdateMutationResult,
    type OrdersRemoveMutationResult,
} from '@shared/api/generated/orders/orders';

export type {
    OrderResponseDto,
    CreateOrderDto,
    UpdateOrderDto,
    OrdersFindAllParams,
    PaginatedResponseOrderResponseDto,
} from '@shared/api/generated/models';
