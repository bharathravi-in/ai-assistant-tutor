/**
 * Offline Queue Service
 * Handles failed requests and syncs when connection is restored
 */

interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
}

const DB_NAME = 'offline_queue_db';
const DB_VERSION = 1;
const STORE_NAME = 'pending_requests';
const MAX_RETRIES = 3;

class OfflineQueueService {
  private db: IDBDatabase | null = null;
  private isOnline: boolean = navigator.onLine;

  constructor() {
    this.initDB();
    this.setupEventListeners();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ Offline queue database initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('✅ Created offline queue store');
        }
      };
    });
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      console.log('🌐 Connection restored - processing queue');
      this.isOnline = true;
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      console.log('📡 Connection lost - queuing enabled');
      this.isOnline = false;
    });
  }

  /**
   * Queue a failed request for later retry
   */
  async queueRequest(
    url: string,
    method: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<void> {
    if (!this.db) {
      console.warn('Database not initialized');
      return;
    }

    const request: QueuedRequest = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url,
      method,
      body,
      headers,
      timestamp: Date.now(),
      retryCount: 0,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const addRequest = store.add(request);

      addRequest.onsuccess = () => {
        console.log(`✅ Queued request: ${method} ${url}`);
        resolve();
      };
      addRequest.onerror = () => reject(addRequest.error);
    });
  }

  /**
   * Get all pending requests
   */
  async getPendingRequests(): Promise<QueuedRequest[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    });
  }

  /**
   * Remove a request from the queue
   */
  private async removeRequest(id: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const deleteRequest = store.delete(id);

      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    });
  }

  /**
   * Update retry count for a request
   */
  private async updateRetryCount(request: QueuedRequest): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const updateRequest = store.put({ ...request, retryCount: request.retryCount + 1 });

      updateRequest.onsuccess = () => resolve();
      updateRequest.onerror = () => reject(updateRequest.error);
    });
  }

  /**
   * Process all queued requests
   */
  async processQueue(): Promise<void> {
    if (!this.isOnline) {
      console.log('Still offline, skipping queue processing');
      return;
    }

    const pendingRequests = await this.getPendingRequests();
    console.log(`📤 Processing ${pendingRequests.length} queued requests`);

    for (const request of pendingRequests) {
      try {
        // Attempt to replay the request
        const response = await fetch(request.url, {
          method: request.method,
          headers: {
            'Content-Type': 'application/json',
            ...request.headers,
          },
          body: request.body ? JSON.stringify(request.body) : undefined,
        });

        if (response.ok) {
          // Success - remove from queue
          await this.removeRequest(request.id);
          console.log(`✅ Successfully synced: ${request.method} ${request.url}`);
        } else if (response.status >= 400 && response.status < 500) {
          // Client error - remove from queue (won't succeed on retry)
          await this.removeRequest(request.id);
          console.warn(`⚠️ Removed failed request (${response.status}): ${request.url}`);
        } else {
          // Server error - increment retry count
          if (request.retryCount >= MAX_RETRIES) {
            await this.removeRequest(request.id);
            console.error(`❌ Max retries exceeded: ${request.url}`);
          } else {
            await this.updateRetryCount(request);
            console.log(`🔄 Retry ${request.retryCount + 1}/${MAX_RETRIES}: ${request.url}`);
          }
        }
      } catch (error) {
        console.error(`Error processing queued request:`, error);
        // Increment retry count
        if (request.retryCount >= MAX_RETRIES) {
          await this.removeRequest(request.id);
        } else {
          await this.updateRetryCount(request);
        }
      }
    }
  }

  /**
   * Clear all queued requests (admin function)
   */
  async clearQueue(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => {
        console.log('✅ Queue cleared');
        resolve();
      };
      clearRequest.onerror = () => reject(clearRequest.error);
    });
  }

  /**
   * Get queue status
   */
  async getQueueStatus(): Promise<{ count: number; isOnline: boolean }> {
    const pending = await this.getPendingRequests();
    return {
      count: pending.length,
      isOnline: this.isOnline,
    };
  }

  /**
   * Check if we're online
   */
  isConnectionOnline(): boolean {
    return this.isOnline;
  }
}

// Singleton instance
const offlineQueueService = new OfflineQueueService();

export default offlineQueueService;
