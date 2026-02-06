import { Model, FilterQuery, UpdateQuery } from 'mongoose';

/**
 * Базовый репозиторий с маппингом Document -> Entity
 * Всегда возвращаем Entity, никогда Document
 */
export abstract class BaseRepository<TDocument, TEntity> {
  constructor(protected readonly model: Model<TDocument>) {}

  /**
   * Абстрактный метод маппинга - должен быть реализован в каждом репозитории
   */
  protected abstract mapToEntity(document: TDocument): TEntity;

  /**
   * Найти по ID
   */
  async findById(id: string): Promise<TEntity | null> {
    const doc = await this.model.findById(id).exec();
    return doc ? this.mapToEntity(doc) : null;
  }

  /**
   * Найти один документ
   */
  async findOne(filter: FilterQuery<TDocument>): Promise<TEntity | null> {
    const doc = await this.model.findOne(filter).exec();
    return doc ? this.mapToEntity(doc) : null;
  }

  /**
   * Найти все документы
   */
  async findAll(filter?: FilterQuery<TDocument>): Promise<TEntity[]> {
    const docs = await this.model.find(filter || {}).exec();
    return docs.map((doc) => this.mapToEntity(doc));
  }

  /**
   * Создать документ
   */
  async create(data: Partial<TEntity>): Promise<TEntity> {
    const doc = await this.model.create(data as any);
    return this.mapToEntity(doc);
  }

  /**
   * Обновить документ
   */
  async update(id: string, data: UpdateQuery<TDocument>): Promise<TEntity | null> {
    const doc = await this.model.findByIdAndUpdate(id, data, { new: true }).exec();
    return doc ? this.mapToEntity(doc) : null;
  }

  /**
   * Удалить документ
   */
  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id).exec();
  }

  /**
   * Проверить существование
   */
  async exists(id: string): Promise<boolean> {
    const doc = await this.model.findById(id).exec();
    return !!doc;
  }

  /**
   * Подсчет документов
   */
  async count(filter?: FilterQuery<TDocument>): Promise<number> {
    return this.model.countDocuments(filter || {}).exec();
  }
}
