/**
 * Firebase Database Manager
 */

class DatabaseManager {
  constructor() {
    this.db = null;
  }

  async init() {
    // Aguardar Firebase carregar
    while (!window.firestore) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    this.db = window.firestore;
    console.log('Firebase inicializado');
  }

  async salvarProjeto(projeto) {
    const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    const docRef = doc(this.db, 'projetos', projeto.id);
    return setDoc(docRef, projeto);
  }

  async obterProjetos() {
    const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    const querySnapshot = await getDocs(collection(this.db, 'projetos'));
    return querySnapshot.docs.map(doc => doc.data());
  }

  async excluirProjeto(id) {
    const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    const docRef = doc(this.db, 'projetos', id);
    return deleteDoc(docRef);
  }

  async salvarProfissional(profissional) {
    const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    const docRef = doc(this.db, 'profissionais', profissional.id);
    return setDoc(docRef, profissional);
  }

  async obterProfissionais() {
    const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    const querySnapshot = await getDocs(collection(this.db, 'profissionais'));
    return querySnapshot.docs.map(doc => doc.data());
  }

  async excluirProfissional(id) {
    const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    const docRef = doc(this.db, 'profissionais', id);
    return deleteDoc(docRef);
  }
}

// Instância global
const db = new DatabaseManager();