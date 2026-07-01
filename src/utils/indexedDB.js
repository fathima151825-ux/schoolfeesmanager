// IndexedDB wrapper for offline storage
const DB_NAME = 'SSVMFeesDB';
const DB_VERSION = 1;

const STORES = {
  STUDENTS: 'students',
  PAYMENTS: 'payments',
  SYNC_QUEUE: 'syncQueue',
  SETTINGS: 'settings'
};

class IndexedDBManager {
  constructor() {
    this.db = null;
    // Store reference to indexedDB API with unique name to avoid conflicts
    this.idbAPI = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
  }

  // Initialize database
  async init() {
    // Check if IndexedDB is supported
    if (!this.idbAPI) {
      throw new Error('IndexedDB is not supported in this browser');
    }

    return new Promise((resolve, reject) => {
      const request = this.idbAPI.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Students store
        if (!db.objectStoreNames.contains(STORES.STUDENTS)) {
          const studentStore = db.createObjectStore(STORES.STUDENTS, { keyPath: 'id' });
          studentStore.createIndex('admission_number', 'admission_number', { unique: true });
          studentStore.createIndex('class', 'class', { unique: false });
        }

        // Payments store
        if (!db.objectStoreNames.contains(STORES.PAYMENTS)) {
          const paymentStore = db.createObjectStore(STORES.PAYMENTS, { keyPath: 'id', autoIncrement: true });
          paymentStore.createIndex('student_id', 'student_id', { unique: false });
          paymentStore.createIndex('payment_date', 'payment_date', { unique: false });
          paymentStore.createIndex('synced', 'synced', { unique: false });
        }

        // Sync queue store
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('type', 'type', { unique: false });
        }

        // Settings store
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        }
      };
    });
  }

  // Generic add/update method
  async put(storeName, data) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Generic get method
  async get(storeName, key) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get all records from a store
  async getAll(storeName) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Delete record
  async delete(storeName, key) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Clear entire store
  async clear(storeName) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get records by index
  async getByIndex(storeName, indexName, value) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Student-specific methods
  async saveStudent(student) {
    return this.put(STORES?.STUDENTS, student);
  }

  async getStudent(id) {
    return this.get(STORES?.STUDENTS, id);
  }

  async getAllStudents() {
    return this.getAll(STORES?.STUDENTS);
  }

  async getStudentByAdmission(admissionNumber) {
    const students = await this.getByIndex(STORES?.STUDENTS, 'admission_number', admissionNumber);
    return students?.[0] || null;
  }

  // Payment-specific methods
  async savePayment(payment) {
    return this.put(STORES?.PAYMENTS, { ...payment, synced: false, timestamp: Date.now() });
  }

  async getPaymentsByStudent(studentId) {
    return this.getByIndex(STORES?.PAYMENTS, 'student_id', studentId);
  }

  async getUnsyncedPayments() {
    return this.getByIndex(STORES?.PAYMENTS, 'synced', false);
  }

  async markPaymentSynced(paymentId) {
    const payment = await this.get(STORES?.PAYMENTS, paymentId);
    if (payment) {
      payment.synced = true;
      return this.put(STORES?.PAYMENTS, payment);
    }
  }

  // Sync queue methods
  async addToSyncQueue(type, data) {
    return this.put(STORES?.SYNC_QUEUE, {
      type,
      data,
      timestamp: Date.now(),
      retries: 0
    });
  }

  async getSyncQueue() {
    return this.getAll(STORES?.SYNC_QUEUE);
  }

  async removeSyncQueueItem(id) {
    return this.delete(STORES?.SYNC_QUEUE, id);
  }

  // Settings methods
  async saveSetting(key, value) {
    return this.put(STORES?.SETTINGS, { key, value });
  }

  async getSetting(key) {
    const setting = await this.get(STORES?.SETTINGS, key);
    return setting?.value;
  }

  // Bulk operations
  async bulkSaveStudents(students) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.STUDENTS], 'readwrite');
      const store = transaction.objectStore(STORES.STUDENTS);
      
      students.forEach(student => store.put(student));
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

// Export singleton instance
export const indexedDB = new IndexedDBManager();
export { STORES };