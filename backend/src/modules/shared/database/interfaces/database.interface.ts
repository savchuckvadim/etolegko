export interface DatabaseConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

export interface Transaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
}
