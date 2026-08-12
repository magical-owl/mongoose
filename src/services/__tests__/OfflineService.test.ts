import { MmkvDatabaseService } from '@/database/DatabaseService';
import { logger, LogLevel } from '../LoggingService';
import { OfflineService } from '../OfflineService';

describe('OfflineService', () => {
  let database: MmkvDatabaseService;
  let service: OfflineService;

  beforeEach(() => {
    logger.configure({ enableConsole: false, minLevel: LogLevel.DEBUG });
    database = new MmkvDatabaseService(`offline-service-test-${Date.now()}-${Math.random()}`);
    database.clearAll();
    service = new OfflineService(database);
  });

  it('keeps an operation queued when no executor is registered', async () => {
    await service.queueOperation('create', 'profiles', { displayName: 'Meadow' });

    const summary = await service.replayQueue();

    expect(summary).toEqual({ succeeded: 0, failed: 1 });
    expect(service.getPendingCount()).toBe(1);
  });

  it('removes an operation only after its executor succeeds', async () => {
    const executor = jest.fn().mockResolvedValue(undefined);
    service.registerExecutor('profiles', executor);
    await service.queueOperation('update', 'profiles', { displayName: 'Meadow' }, 'profile-1');

    const summary = await service.replayQueue();

    expect(summary).toEqual({ succeeded: 1, failed: 0 });
    expect(executor).toHaveBeenCalledTimes(1);
    expect(service.getPendingCount()).toBe(0);
  });

  it('records a failed attempt without discarding the operation', async () => {
    service.registerExecutor('profiles', async () => {
      throw new Error('Temporary failure');
    });
    await service.queueOperation('delete', 'profiles', {}, 'profile-1');

    await service.replayQueue();

    const [operation] = database.getAll<{
      id: string;
      createdAt: number;
      updatedAt: number;
      retryCount: number;
      lastAttempt: number | null;
    }>('offline_queue');
    expect(operation?.retryCount).toBe(1);
    expect(operation?.lastAttempt).not.toBeNull();
    expect(service.getPendingCount()).toBe(1);
  });
});
