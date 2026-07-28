import { EventEmitter } from 'events';

export interface PrintJobData {
  id: string;
  printerId: string;
  type: string;
  data: Record<string, unknown>;
  attempts: number;
  maxAttempts: number;
  status: 'PENDING' | 'PRINTING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  lastError: string | null;
  createdAt: Date;
}

export type PrintHandler = (job: PrintJobData) => Promise<void>;

export class PrintQueue extends EventEmitter {
  private queue: PrintJobData[] = [];
  private processing = false;
  private handlers = new Map<string, PrintHandler>();
  private processingInterval: ReturnType<typeof setInterval> | null = null;

  registerHandler(printerType: string, handler: PrintHandler): void {
    this.handlers.set(printerType, handler);
  }

  addJob(job: Omit<PrintJobData, 'attempts' | 'status' | 'lastError' | 'createdAt'>): PrintJobData {
    const printJob: PrintJobData = {
      ...job,
      attempts: 0,
      status: 'PENDING',
      lastError: null,
      createdAt: new Date(),
    };
    this.queue.push(printJob);
    this.emit('job:added', printJob);
    this.processNext();
    return printJob;
  }

  private async processNext(): Promise<void> {
    if (this.processing) return;

    const job = this.queue.find((j) => j.status === 'PENDING');
    if (!job) return;

    this.processing = true;
    job.status = 'PRINTING';
    job.attempts++;
    this.emit('job:processing', job);

    try {
      const handler = this.handlers.get(job.printerId) ?? this.handlers.get('default');
      if (!handler) throw new Error(`No handler registered for printer ${job.printerId}`);

      await handler(job);
      job.status = 'COMPLETED';
      this.emit('job:completed', job);
    } catch (error) {
      job.lastError = error instanceof Error ? error.message : 'Unknown error';

      if (job.attempts >= job.maxAttempts) {
        job.status = 'FAILED';
        this.emit('job:failed', job);
      } else {
        job.status = 'PENDING';
        setTimeout(() => this.processNext(), 1000 * job.attempts);
      }
    } finally {
      this.processing = false;
      this.emit('job:updated', job);
    }
  }

  cancelJob(id: string): boolean {
    const job = this.queue.find((j) => j.id === id);
    if (!job || job.status === 'PRINTING') return false;
    job.status = 'CANCELLED';
    this.emit('job:cancelled', job);
    return true;
  }

  getQueue(): PrintJobData[] {
    return [...this.queue];
  }

  getPendingJobs(): PrintJobData[] {
    return this.queue.filter((j) => j.status === 'PENDING');
  }

  getStats(): { total: number; pending: number; printing: number; completed: number; failed: number } {
    return {
      total: this.queue.length,
      pending: this.queue.filter((j) => j.status === 'PENDING').length,
      printing: this.queue.filter((j) => j.status === 'PRINTING').length,
      completed: this.queue.filter((j) => j.status === 'COMPLETED').length,
      failed: this.queue.filter((j) => j.status === 'FAILED').length,
    };
  }

  startProcessing(intervalMs: number = 1000): void {
    if (this.processingInterval) return;
    this.processingInterval = setInterval(() => this.processNext(), intervalMs);
  }

  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  clearCompleted(): void {
    this.queue = this.queue.filter((j) => j.status !== 'COMPLETED' && j.status !== 'CANCELLED');
  }
}

export const printQueue = new PrintQueue();
