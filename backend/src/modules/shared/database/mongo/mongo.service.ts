import { Connection, ConnectionStates } from 'mongoose';
import {
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';

@Injectable()
export class MongoService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(MongoService.name);

    constructor(@InjectConnection() private readonly connection: Connection) {}

    onModuleInit(): void {
        this.connection.on('connected', () => {
            this.logger.log('MongoDB connected');
        });

        this.connection.on('error', err => {
            this.logger.error('MongoDB connection error:', err);
        });

        if (this.connection.readyState === ConnectionStates.connected) {
            this.logger.log('MongoDB already connected');
        }
    }

    async onModuleDestroy(): Promise<void> {
        await this.connection.close();
        this.logger.log('MongoDB disconnected');
    }

    isConnected(): boolean {
        return this.connection.readyState === ConnectionStates.connected;
    }

    getConnection(): Connection {
        return this.connection;
    }

    async startSession(): Promise<
        Awaited<ReturnType<Connection['startSession']>>
    > {
        return this.connection.startSession();
    }
}
