# 2 Produções - Plataforma de Gestão de Projetos Culturais

## 📋 Descrição do Projeto

A **2 Produções** é uma plataforma web completa para gestão de propostas de projetos culturais, desenvolvida especificamente para atender às necessidades de produtoras culturais. O sistema permite o cadastro estruturado de projetos culturais, importação de dados via planilhas Excel e gerenciamento completo da equipe técnica e planos de comunicação.

Esta solução digital moderniza o processo de elaboração e gestão de projetos culturais, oferecendo uma interface intuitiva e funcionalidades avançadas para otimizar o workflow de produção cultural.

---

## 🎯 Funcionalidades Principais

### Cadastro de Propostas de Projetos

O sistema oferece um formulário completo e detalhado para cadastro de projetos culturais, incluindo os seguintes campos obrigatórios e opcionais:

- **Identificação do Projeto**: Nome do projeto, responsável pela elaboração, objeto, objetivos, justificativa e metas
- **Público-Alvo**: Perfil do público pretendido, estimativa numérica e estruturas de acessibilidade
- **Acessibilidade**: Conformidade obrigatória com a Lei Distrital nº 6.858/2021 sobre acessibilidade para deficientes visuais
- **Parâmetros Financeiros**: Configurações sobre cobrança de ingresso, arrecadação para donation e comercialização de produtos
- **Cronograma**: Previsão do período de execução com datas de início e término

### Importação de Planilhas Excel

O sistema suporta importação automatizada de dados através de planilhas Excel, eliminando a necessidade de entrada manual repetitiva:

#### Ficha Técnica

Permite importação de planilha com os seguintes campos para cadastro da equipe técnica:
- Nome do Profissional ou Empresa
- Função ou Cargo
- CPF ou CNPJ

#### Plano de Comunicação e Divulgação

Suporta importação de planilha com informações sobre ações de comunicação:
- Item ou Serviço
- Formato ou Suporte
- Quantidade ou Período
- Veículo ou Circulação

### Gestão Administrativa

- **Dashboard**: Visualização de estatísticas e projetos recentes
- **Lista de Projetos**: Visualização completa de todos os projetos com filtros e busca
- **Edição e Exclusão**: Gerenciamento completo dos projetos cadastrados
- **Status de Rascunho**: Salvamento parcial de projetos para continuidade posterior

---

## 🛠️ Tecnologias Utilizadas

### Backend

- **Node.js**: Ambiente de execução JavaScript no servidor
- **Express**: Framework web minimalista e flexível para Node.js
- **better-sqlite3**: Banco de dados SQLite com interface síncrona simples e rápida
- **Multer**: Middleware para manipulação de uploads de arquivos multipart/form-data
- **xlsx**: Biblioteca completa para leitura e escrita de arquivos Excel
- **UUID**: Geração de identificadores únicos universais

### Frontend

- **HTML5**: Linguagem de marcação semântica para estrutura do conteúdo
- **CSS3**: Estilização moderna com variáveis CSS, flexbox e grid layout
- **JavaScript (ES6+)**: Programação dinâmica do lado do cliente
- **Font Inter**: Tipografia moderna e legível da Google Fonts

---

## 📁 Estrutura do Projeto

```
2producoes-plataforma/
├── package.json              # Configurações e dependências do projeto
├── server.js                 # Servidor principal da aplicação
├── 2producoes.db             # Banco de dados SQLite (criado automaticamente)
├── uploads/                  # Diretório para arquivos temporários de upload
└── public/                   # Arquivos públicos do frontend
    ├── index.html            # Página principal da aplicação
    ├── styles.css            # Estilos CSS da aplicação
    └── app.js                # Lógica JavaScript do frontend
```

---

## 🚀 Como Executar o Projeto

### Pré-requisitos

Antes de iniciar, certifique-se de ter instalado em seu sistema:

- **Node.js** versão 14 ou superior (disponível em [nodejs.org](https://nodejs.org/))
- **npm** ou **yarn** (gerenciadores de pacotes Node.js)

### Instalação

1. **Clone ou baixe o projeto** para seu diretório local

2. **Acesse a pasta do projeto** através do terminal:
   ```bash
   cd 2producoes-plataforma
   ```

3. **Instale as dependências** utilizando npm:
   ```bash
   npm install
   ```

   Ou utilizando yarn:
   ```bash
   yarn install
   ```

### Execução

1. **Inicie o servidor** com o comando:
   ```bash
   npm start
   ```

   Ou para modo de desenvolvimento com recarregamento automático:
   ```bash
   npm run dev
   ```

2. **Acesse a aplicação** no seu navegador:
   ```
   http://localhost:3000
   ```

---

## 📊 Como Utilizar o Sistema

### Criando um Novo Projeto

1. No menu lateral, clique em **"Novo Projeto"** ou no botão **"➕ Novo Projeto"** no topo da página
2. O formulário será apresentado em etapas (stepper), facilitando o preenchimento
3. Preencha todos os campos obrigatórios marcados com asterisco (*)
4. Avance para as próximas etapas clicando em **"Próximo"**
5. Na etapa 4, você pode importar planilhas Excel ou adicionar dados manualmente

### Importando Planilhas Excel

#### Formato da Planilha de Ficha Técnica

A planilha Excel deve conter as seguintes colunas:

| Nome do Profissional/Empresa | Função | CPF/CNPJ |
|------------------------------|--------|----------|
| João Silva | Diretor Artístico | 123.456.789-00 |
| Maria Santos | Produtora | 12.345.678/0001-99 |

#### Formato da Planilha de Plano de Comunicação

A planilha Excel deve conter as seguintes colunas:

| Item/Serviço | Formato / Suporte | Quantidade / Período | Veículo / Circulação |
|--------------|-------------------|----------------------|---------------------|
| Peças gráficas | Flyer A5 | 1000 unidades | Redes sociais |
| Vídeo institucional | MP4 | 2 minutos | YouTube e site |

### Visualizando e Editando Projetos

1. Na página **"Dashboard"** ou **"Projetos"**, localize o projeto desejado
2. Clique no botão **"👁️"** para visualizar detalhes completos
3. Para editar, clique no botão **"✏️"** ou edite diretamente da visualização
4. Para excluir, clique no botão **"🗑️"** e confirme a ação

---

## 🔒 Observações Importantes

### Banco de Dados

O sistema utiliza SQLite como banco de dados, criando automaticamente o arquivo `2producoes.db` na raiz do projeto. Este arquivo armazena todos os dados dos projetos e não deve ser deletado enquanto houver dados importantes.

### Uploads de Arquivos

O diretório `uploads/` é utilizado temporariamente para processar planilhas Excel importadas. Estes arquivos são automaticamente removidos após o processamento.

### Acessibilidade

O sistema foi desenvolvido considerando boas práticas de acessibilidade web, porém, é de responsabilidade do usuário garantir que os projetos cadastrados atendam às exigências da Lei Distrital nº 6.858/2021.

---

## 📝 Formatos de Arquivo Suportados

Para importação de planilhas, os seguintes formatos são aceitos:

- **.xlsx** (Excel 2007 e versões posteriores)
- **.xls** (Excel 97-2003)

---

## 🤝 Contribuição

Para sugestões de melhorias, correções de bugs ou novas funcionalidades, sinta-se à vontade para abrir uma issue ou enviar um pull request no repositório do projeto.

---

## 📄 Licença

Este projeto foi desenvolvido para uso da **2 Produções** e está disponível para consulta e adaptação conforme necessidades específicas de cada produtora cultural.

---

## 📞 Suporte

Em caso de dúvidas ou problemas técnicos, entre em contato com a equipe de desenvolvimento ou consulte a documentação interna da 2 Produções.

---

**Desenvolvido com ❤️ para a comunidade cultural**
