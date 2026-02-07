import {
    ClientSession,
    Model,
    UpdateQuery,
    type CreateOptions,
} from 'mongoose';

/**
 * Базовый репозиторий с маппингом Document -> Entity
 * Всегда возвращаем Entity, никогда Document
 * Поддерживает MongoDB транзакции через опциональный параметр session
 */
export abstract class BaseRepository<TDocument, TEntity> {
    constructor(protected readonly model: Model<TDocument>) {}

    /**
     * Абстрактный метод маппинга - должен быть реализован в каждом репозитории
     */
    protected abstract mapToEntity(document: TDocument): TEntity;

    /**
     * Публичный метод для маппинга документа в entity
     */
    mapDocumentToEntity(document: TDocument): TEntity {
        return this.mapToEntity(document);
    }

    /**
     * Найти по ID
     */
    async findById(
        id: string,
        session?: ClientSession,
    ): Promise<TEntity | null> {
        const query = this.model.findById(id);
        if (session) {
            query.session(session);
        }
        const doc = await query.exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    /**
     * Найти один документ
     */
    async findOne(
        filter: Record<string, any>,
        session?: ClientSession,
    ): Promise<TEntity | null> {
        const query = this.model.findOne(filter);
        if (session) {
            query.session(session);
        }
        const doc = await query.exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    /**
     * Найти все документы
     */
    async findAll(
        filter?: Record<string, any>,
        session?: ClientSession,
    ): Promise<TEntity[]> {
        const query = this.model.find(filter || {});
        if (session) {
            query.session(session);
        }
        const docs = await query.exec();
        return docs.map(doc => this.mapToEntity(doc));
    }

    /**
     * Создать документ
     */
    async create(
        data: Partial<TEntity>,
        session?: ClientSession,
    ): Promise<TEntity> {
        // TEntity и TDocument могут иметь разные поля, но в runtime они совместимы
        // через маппинг. Это безопасное приведение типов для создания документа.
        // Mongoose create требует более специфичные типы, поэтому используем приведение через unknown

        const options: CreateOptions = session ? { session } : {};
        // @ts-expect-error - Mongoose create expects DeepPartial<ApplyBasicCreateCasting<Require_id<TDocument>>>[]
        // but we control the data structure and it's compatible at runtime
        const doc = await this.model.create(
            [data as unknown as Partial<TDocument>],
            options,
        );
        return this.mapToEntity(doc[0] as TDocument);
    }

    /**
     * Обновить документ
     */
    async update(
        id: string,
        data: UpdateQuery<TDocument>,
        session?: ClientSession,
    ): Promise<TEntity | null> {
        const query = this.model.findByIdAndUpdate(id, data, { new: true });
        if (session) {
            query.session(session);
        }
        const doc = await query.exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    /**
     * Удалить документ
     */
    async delete(id: string, session?: ClientSession): Promise<void> {
        const query = this.model.findByIdAndDelete(id);
        if (session) {
            query.session(session);
        }
        await query.exec();
    }

    /**
     * Проверить существование
     */
    async exists(id: string, session?: ClientSession): Promise<boolean> {
        const query = this.model.findById(id);
        if (session) {
            query.session(session);
        }
        const doc = await query.exec();
        return !!doc;
    }

    /**
     * Подсчет документов
     */
    async count(
        filter?: Record<string, any>,
        session?: ClientSession,
    ): Promise<number> {
        const query = this.model.countDocuments(filter || {});
        if (session) {
            query.session(session);
        }
        return query.exec();
    }
}
