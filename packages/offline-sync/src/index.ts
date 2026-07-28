export interface SyncableEntity {
  id: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface PendingChange {
  id: string;
  entity: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  data: Record<string, unknown>;
  timestamp: string;
  synced: boolean;
  retryCount: number;
  maxRetries: number;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  conflicts: number;
  errors: string[];
}

export interface ConflictResolution {
  strategy: 'CLIENT_WINS' | 'SERVER_WINS' | 'MANUAL';
  resolvedData?: Record<string, unknown>;
}

export interface SyncConfig {
  apiBaseUrl: string;
  maxRetries: number;
  retryDelayMs: number;
  conflictStrategy: ConflictResolution['strategy'];
  storageKey: string;
  entityConfigs: EntityConfig[];
}

export interface EntityConfig {
  name: string;
  endpoint: string;
  syncPriority: number;
  conflictResolution: ConflictResolution['strategy'];
}

export interface SyncTransport {
  fetch(entity: string, params?: Record<string, string>): Promise<unknown>;
  push(entity: string, data: Record<string, unknown>): Promise<unknown>;
  delete(entity: string, id: string): Promise<void>;
}

export interface SyncStorage {
  getPendingChanges(): Promise<PendingChange[]>;
  savePendingChange(change: PendingChange): Promise<void>;
  removePendingChange(id: string): Promise<void>;
  clearSyncedChanges(): Promise<void>;
  getEntityState(entity: string): Promise<{ lastSyncAt: string | null; version: number }>;
  setEntityState(entity: string, state: { lastSyncAt: string; version: number }): Promise<void>;
  getEntityData(entity: string): Promise<Record<string, unknown>[]>;
  saveEntityData(entity: string, data: Record<string, unknown>[]): Promise<void>;
}

export class OfflineSyncEngine {
  private config: SyncConfig;
  private storage: SyncStorage;
  private transport: SyncTransport;
  private syncInProgress = false;
  private listeners = new Map<string, ((...args: unknown[]) => void)[]>();

  constructor(config: SyncConfig, storage: SyncStorage, transport: SyncTransport) {
    this.config = config;
    this.storage = storage;
    this.transport = transport;
  }

  on(event: string, listener: (...args: unknown[]) => void): void {
    const existing = this.listeners.get(event) ?? [];
    existing.push(listener);
    this.listeners.set(event, existing);
  }

  private emit(event: string, ...args: unknown[]): void {
    const listeners = this.listeners.get(event) ?? [];
    for (const listener of listeners) {
      listener(...args);
    }
  }

  async addPendingChange(
    entity: string,
    entityId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    data: Record<string, unknown>,
  ): Promise<void> {
    const entityConfig = this.config.entityConfigs.find((e) => e.name === entity);
    const maxRetries = entityConfig ? this.config.maxRetries : 3;

    const change: PendingChange = {
      id: crypto.randomUUID(),
      entity,
      entityId,
      action,
      data,
      timestamp: new Date().toISOString(),
      synced: false,
      retryCount: 0,
      maxRetries,
    };

    await this.storage.savePendingChange(change);
    this.emit('change:added', change);
  }

  async sync(): Promise<SyncResult> {
    if (this.syncInProgress) {
      return { success: false, synced: 0, failed: 0, conflicts: 0, errors: ['Sync already in progress'] };
    }

    this.syncInProgress = true;
    this.emit('sync:start');

    const result: SyncResult = { success: true, synced: 0, failed: 0, conflicts: 0, errors: [] };

    try {
      const pendingChanges = await this.storage.getPendingChanges();
      const unsynced = pendingChanges.filter((c) => !c.synced);

      for (const change of unsynced) {
        try {
          if (change.action === 'DELETE') {
            await this.transport.delete(change.entity, change.entityId);
          } else if (change.action === 'CREATE' || change.action === 'UPDATE') {
            await this.transport.push(change.entity, change.data);
          }

          change.synced = true;
          await this.storage.savePendingChange(change);
          result.synced++;
          this.emit('change:synced', change);
        } catch (error) {
          change.retryCount++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          if (change.retryCount >= change.maxRetries) {
            change.synced = true;
            await this.storage.savePendingChange(change);
            result.failed++;
            result.errors.push(`${change.entity}/${change.entityId}: ${errorMessage}`);
            this.emit('change:failed', change, errorMessage);
          } else {
            await this.storage.savePendingChange(change);
            result.errors.push(`Retry ${change.retryCount}/${change.maxRetries}: ${change.entity}/${change.entityId}`);
          }
        }
      }

      await this.storage.clearSyncedChanges();
      this.emit('sync:complete', result);
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Sync failed');
      this.emit('sync:error', error);
    } finally {
      this.syncInProgress = false;
    }

    return result;
  }

  async pullUpdates(entity: string): Promise<void> {
    const state = await this.storage.getEntityState(entity);
    const params: Record<string, string> = {};
    if (state.lastSyncAt) {
      params.since = state.lastSyncAt;
    }

    const data = (await this.transport.fetch(entity, params)) as Record<string, unknown>[];
    await this.storage.saveEntityData(entity, data);
    await this.storage.setEntityState(entity, {
      lastSyncAt: new Date().toISOString(),
      version: state.version + 1,
    });
    this.emit('entity:updated', entity, data);
  }

  async getPendingCount(): Promise<number> {
    const changes = await this.storage.getPendingChanges();
    return changes.filter((c) => !c.synced).length;
  }

  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }
}
