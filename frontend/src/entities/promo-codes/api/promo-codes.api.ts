/**
 * Promo Codes Entity - API клиенты
 * Re-export сгенерированных hooks для удобства использования
 */

export {
    usePromoCodesCreate,
    usePromoCodesFindAll,
    usePromoCodesFindById,
    usePromoCodesUpdate,
    usePromoCodesRemove,
    usePromoCodesApply,
    type PromoCodesCreateMutationResult,
    type PromoCodesFindAllQueryResult,
    type PromoCodesFindByIdQueryResult,
    type PromoCodesUpdateMutationResult,
    type PromoCodesRemoveMutationResult,
    type PromoCodesApplyMutationResult,
} from '@shared/api/generated/promo-codes/promo-codes';

export type {
    PromoCodeResponseDto,
    CreatePromoCodeDto,
    UpdatePromoCodeDto,
    ApplyPromoCodeDto,
    ApplyPromoCodeResponseDto,
    PromoCodesFindAllParams,
    PaginatedResponsePromoCodeResponseDto,
} from '@shared/api/generated/models';
