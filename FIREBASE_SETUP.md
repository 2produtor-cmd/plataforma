# 🔥 Firebase Setup - Passo a Passo

## 1. Criar Conta Firebase

1. Acesse: https://console.firebase.google.com
2. Clique em **"Começar"**
3. Faça login com sua conta Google

## 2. Criar Novo Projeto

1. Clique em **"Criar um projeto"**
2. Nome do projeto: `2producoes-plataforma`
3. Clique **"Continuar"**
4. Desabilite Google Analytics (não necessário)
5. Clique **"Criar projeto"**

## 3. Configurar Firestore Database

1. No menu lateral, clique em **"Firestore Database"**
2. Clique em **"Criar banco de dados"**
3. Selecione **"Iniciar no modo de teste"**
4. Escolha localização: **"southamerica-east1 (São Paulo)"**
5. Clique **"Concluído"**

## 4. Configurar Regras de Segurança

1. Na aba **"Regras"** do Firestore
2. Substitua o conteúdo por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Clique **"Publicar"**

## 5. Obter Configurações do Projeto

1. Clique no ícone de **engrenagem** ⚙️ ao lado de "Visão geral do projeto"
2. Selecione **"Configurações do projeto"**
3. Role até **"Seus aplicativos"**
4. Clique no ícone **"</>"** (Web)
5. Nome do app: `2producoes-web`
6. Clique **"Registrar app"**
7. **COPIE** as configurações que aparecem:

```javascript
const firebaseConfig = {
  apiKey: "sua-api-key-aqui",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

## 6. Atualizar Código da Aplicação

Substitua as configurações no arquivo `index.html` linha 9-16:

```javascript
const firebaseConfig = {
  // COLE SUAS CONFIGURAÇÕES AQUI
};
```

## 7. Testar Conexão

1. Abra a aplicação no navegador
2. Cadastre um projeto de teste
3. Verifique no Firebase Console se os dados aparecem em **Firestore Database**

## ✅ Pronto!

Agora seus dados são salvos na nuvem do Firebase!

## 🔒 Segurança (Opcional)

Para produção, configure regras mais restritivas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projetos/{document} {
      allow read, write: if request.auth != null;
    }
    match /profissionais/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```