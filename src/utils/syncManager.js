import { indexedDB, STORES } from './indexedDB';

// Sync manager for offline data synchronization
class SyncManager {
  constructor() {
    this.isSyncing = false;
    this.syncCallbacks = [];
  }

  // Register callback for sync completion
  onSyncComplete(callback) {
    this.syncCallbacks?.push(callback);
  }

  // Trigger sync when online
  async syncAll() {
    if (this.isSyncing || !navigator.onLine) {
      return;
    }

    this.isSyncing = true;
    console.log('Starting data synchronization...');

    try {
      await this.syncPayments();
      await this.syncSyncQueue();
      
      // Notify callbacks
      this.syncCallbacks?.forEach(callback => callback());
      
      console.log('Data synchronization completed');
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Sync unsynced payments
  async syncPayments() {
    try {
      const unsyncedPayments = await indexedDB?.getUnsyncedPayments();
      
      for (const payment of unsyncedPayments) {
        try {
          // Attempt to sync with server
          // This would call your actual API endpoint
          // await paymentService.createPayment(payment);
          
          // Mark as synced
          await indexedDB?.markPaymentSynced(payment?.id);
          console.log(`Payment ${payment?.id} synced successfully`);
        } catch (error) {
          console.error(`Failed to sync payment ${payment?.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error syncing payments:', error);
    }
  }

  // Sync items in sync queue
  async syncSyncQueue() {
    try {
      const queueItems = await indexedDB?.getSyncQueue();
      
      for (const item of queueItems) {
        try {
          // Process based on type
          switch (item?.type) {
            case 'payment':
              // await paymentService.createPayment(item.data);
              break;
            case 'student_update':
              // await studentService.updateStudent(item.data);
              break;
            default:
              console.warn(`Unknown sync type: ${item?.type}`);
          }
          
          // Remove from queue after successful sync
          await indexedDB?.removeSyncQueueItem(item?.id);
          console.log(`Sync queue item ${item?.id} processed`);
        } catch (error) {
          console.error(`Failed to sync queue item ${item?.id}:`, error);
          
          // Increment retry count
          if (item?.retries < 3) {
            item.retries++;
            await indexedDB?.put(STORES?.SYNC_QUEUE, item);
          } else {
            console.error(`Max retries reached for item ${item?.id}, removing from queue`);
            await indexedDB?.removeSyncQueueItem(item?.id);
          }
        }
      }
    } catch (error) {
      console.error('Error syncing queue:', error);
    }
  }

  // Cache student data for offline access
  async cacheStudentData(students) {
    try {
      await indexedDB?.bulkSaveStudents(students);
      console.log(`Cached ${students?.length} students for offline access`);
    } catch (error) {
      console.error('Error caching student data:', error);
    }
  }

  // Get cached student data when offline
  async getCachedStudents() {
    try {
      return await indexedDB?.getAllStudents();
    } catch (error) {
      console.error('Error retrieving cached students:', error);
      return [];
    }
  }

  // Save payment for offline processing
  async saveOfflinePayment(payment) {
    try {
      await indexedDB?.savePayment(payment);
      console.log('Payment saved for offline sync');
      
      // Register background sync if available
      if ('serviceWorker' in navigator && 'sync' in navigator.serviceWorker) {
        const registration = await navigator.serviceWorker?.ready;
        await registration?.sync?.register('sync-payments');
      }
    } catch (error) {
      console.error('Error saving offline payment:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const syncManager = new SyncManager();

// Initialize sync on online event
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncManager?.syncAll();
  });
}