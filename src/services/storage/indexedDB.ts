import type { Book, BookContent } from '../../types';

const DB_NAME = 'PolyglotReaderDB';
const DB_VERSION = 1;
const BOOKS_STORE = 'books';
const CONTENTS_STORE = 'book_contents';

class IndexedDBStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(BOOKS_STORE)) {
            const booksStore = db.createObjectStore(BOOKS_STORE, { keyPath: 'id' });
            booksStore.createIndex('fileName', 'fileName', { unique: false });
            booksStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          }
          if (!db.objectStoreNames.contains(CONTENTS_STORE)) {
            db.createObjectStore(CONTENTS_STORE, { keyPath: 'bookId' });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          this.dbPromise = null;
          reject(new Error(`IndexedDB open failed: ${request.error?.message}`));
        };
        request.onblocked = () => {
          console.warn('IndexedDB database upgrade blocked. Close other tabs.');
        };
      });
    }
    return this.dbPromise;
  }

  async saveBook(book: Book, content: BookContent): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([BOOKS_STORE, CONTENTS_STORE], 'readwrite');
      tx.onerror = () => reject(new Error(`Save transaction failed: ${tx.error?.message}`));
      tx.oncomplete = () => resolve();

      const booksStore = tx.objectStore(BOOKS_STORE);
      const contentsStore = tx.objectStore(CONTENTS_STORE);

      booksStore.put(book);
      contentsStore.put(content);
    });
  }

  async getAllBooks(): Promise<Book[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(BOOKS_STORE, 'readonly');
      const store = tx.objectStore(BOOKS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const books = (request.result as Book[]) || [];
        // 更新日時順（新しいものが先）にソート
        books.sort((a, b) => b.updatedAt - a.updatedAt);
        resolve(books);
      };
      request.onerror = () => reject(new Error(`Failed to fetch books: ${request.error?.message}`));
    });
  }

  async getBook(id: string): Promise<Book | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(BOOKS_STORE, 'readonly');
      const store = tx.objectStore(BOOKS_STORE);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result as Book | undefined);
      request.onerror = () => reject(new Error(`Failed to fetch book ${id}: ${request.error?.message}`));
    });
  }

  async getBookContent(bookId: string): Promise<BookContent | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(CONTENTS_STORE, 'readonly');
      const store = tx.objectStore(CONTENTS_STORE);
      const request = store.get(bookId);

      request.onsuccess = () => resolve(request.result as BookContent | undefined);
      request.onerror = () => reject(new Error(`Failed to fetch content for book ${bookId}: ${request.error?.message}`));
    });
  }

  async deleteBook(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([BOOKS_STORE, CONTENTS_STORE], 'readwrite');
      tx.onerror = () => reject(new Error(`Delete transaction failed: ${tx.error?.message}`));
      tx.oncomplete = () => resolve();

      tx.objectStore(BOOKS_STORE).delete(id);
      tx.objectStore(CONTENTS_STORE).delete(id);
    });
  }

  async checkDuplicate(fileName: string, fileSize: number): Promise<Book | undefined> {
    const all = await this.getAllBooks();
    return all.find(b => b.fileName === fileName && b.fileSize === fileSize);
  }
}

export const dbStorage = new IndexedDBStorage();
