/**
 * Database Manager - IndexedDB
 */

class DatabaseManager {
  constructor() {
    this.dbName = '2ProducoesDB';
    this.version = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Store para projetos
        if (!db.objectStoreNames.contains('projetos')) {
          const projetosStore = db.createObjectStore('projetos', { keyPath: 'id' });
          projetosStore.createIndex('nome_projeto', 'nome_projeto', { unique: false });
          projetosStore.createIndex('status', 'status', { unique: false });
        }
        
        // Store para profissionais
        if (!db.objectStoreNames.contains('profissionais')) {
          const profissionaisStore = db.createObjectStore('profissionais', { keyPath: 'id' });
          profissionaisStore.createIndex('nome', 'nome', { unique: false });
        }
      };
    });
  }

  async salvarProjeto(projeto) {
    const transaction = this.db.transaction(['projetos'], 'readwrite');
    const store = transaction.objectStore('projetos');
    return store.put(projeto);
  }

  async obterProjetos() {
    const transaction = this.db.transaction(['projetos'], 'readonly');
    const store = transaction.objectStore('projetos');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async excluirProjeto(id) {
    const transaction = this.db.transaction(['projetos'], 'readwrite');
    const store = transaction.objectStore('projetos');
    return store.delete(id);
  }

  async salvarProfissional(profissional) {
    const transaction = this.db.transaction(['profissionais'], 'readwrite');
    const store = transaction.objectStore('profissionais');
    return store.put(profissional);
  }

  async obterProfissionais() {
    const transaction = this.db.transaction(['profissionais'], 'readonly');
    const store = transaction.objectStore('profissionais');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async excluirProfissional(id) {
    const transaction = this.db.transaction(['profissionais'], 'readwrite');
    const store = transaction.objectStore('profissionais');
    return store.delete(id);
  }
}

// Instância global
const db = new DatabaseManager();