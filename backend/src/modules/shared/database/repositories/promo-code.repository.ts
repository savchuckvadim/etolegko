import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from './base.repository';
import { PromoCode } from '../entities/promo-code.entity';
import { PromoCodeDocument, mapPromoCodeDocumentToEntity } from '../schemas/promo-code.schema';

/**
 * PromoCode Repository
 * Всегда возвращает Entity, никогда Document
 */
@Injectable()
export class PromoCodeRepository extends BaseRepository<PromoCodeDocument, PromoCode> {
  constructor(
    @InjectModel('PromoCodeSchema') private readonly promoCodeModel: Model<PromoCodeDocument>,
  ) {
    super(promoCodeModel);
  }

  protected mapToEntity(document: PromoCodeDocument): PromoCode {
    return mapPromoCodeDocumentToEntity(document);
  }

  /**
   * Найти по коду
   */
  async findByCode(code: string): Promise<PromoCode | null> {
    return this.findOne({ code: code.toUpperCase() });
  }

  /**
   * Найти активные промокоды
   */
  async findActive(): Promise<PromoCode[]> {
    const now = new Date();
    return this.findAll({
      isActive: true,
      $and: [
        {
          $or: [
            { startsAt: { $exists: false } },
            { startsAt: { $lte: now } },
          ],
        },
        {
          $or: [
            { endsAt: { $exists: false } },
            { endsAt: { $gte: now } },
          ],
        },
      ],
    });
  }
}
