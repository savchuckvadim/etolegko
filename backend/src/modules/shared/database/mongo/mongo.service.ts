import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class MongoService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MongoService.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  async onModuleInit() {
    this.connection.on('connected', () => {
      this.logger.log('MongoDB connected');
    });

    this.connection.on('error', (err) => {
      this.logger.error('MongoDB connection error:', err);
    });

    if (this.connection.readyState === 1) {
      this.logger.log('MongoDB already connected');
    }
  }

  async onModuleDestroy() {
    await this.connection.close();
    this.logger.log('MongoDB disconnected');
  }

  isConnected(): boolean {
    return this.connection.readyState === 1;
  }

  async getConnection(): Promise<Connection> {
    return this.connection;
  }

  async startSession(): Promise<Awaited<ReturnType<Connection['startSession']>>> {
    return this.connection.startSession();
  }
}
