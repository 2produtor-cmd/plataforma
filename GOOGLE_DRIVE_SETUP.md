# Configuração do Google Drive API

## Passo 1: Criar Projeto no Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto ou selecione um existente
3. Ative a **Google Drive API**

## Passo 2: Criar Credenciais

1. Vá para **APIs & Services > Credentials**
2. Clique em **+ CREATE CREDENTIALS > API Key**
3. Copie a API Key gerada
4. Clique em **+ CREATE CREDENTIALS > OAuth client ID**
5. Escolha **Web application**
6. Em **Authorized JavaScript origins**, adicione:
   - `https://2produtor-cmd.github.io`
   - `http://localhost:3000` (para testes locais)
7. Copie o Client ID gerado

## Passo 3: Configurar no Código

Edite o arquivo `public/app.js` e substitua:

```javascript
const GOOGLE_CONFIG = {
  CLIENT_ID: 'SEU_CLIENT_ID_AQUI.apps.googleusercontent.com',
  API_KEY: 'SUA_API_KEY_AQUI',
  DISCOVERY_DOC: 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
  SCOPES: 'https://www.googleapis.com/auth/drive.file'
};
```

## Funcionalidades

- ✅ **Backup Automático**: Salva automaticamente no Google Drive ao criar/editar projetos
- ✅ **Backup Manual**: Botão "Sincronizar Drive" no menu lateral
- ✅ **Restauração**: Restaura o backup mais recente do Google Drive
- ✅ **Segurança**: Dados salvos na pasta privada da aplicação (appDataFolder)

## Como Usar

1. Clique em **"Conectar Drive"** no menu lateral
2. Faça login com sua conta Google
3. Autorize o acesso ao Google Drive
4. Os projetos serão automaticamente salvos no Drive
5. Para restaurar, clique novamente no botão (agora "Backup Drive")

## Arquivos de Backup

Os backups são salvos como:
- Nome: `2producoes_backup_YYYY-MM-DD.json`
- Local: Pasta privada da aplicação no Google Drive
- Conteúdo: Todos os projetos em formato JSON