/**
 * 2 Produções - Plataforma de Gestão de Projetos Culturais
 * Servidor Principal com Módulo de Prestação de Contas
 * 
 * Este arquivo configura e inicia o servidor Express para a plataforma
 */

const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// CONFIGURAÇÃO DO BANCO DE DADOS
// ============================================

const db = new Database('2producoes.db');

// Criar tabelas do banco de dados (atualizado com Prestação de Contas)
db.exec(`
  -- Tabela de projetos
  CREATE TABLE IF NOT EXISTS projetos (
    id TEXT PRIMARY KEY,
    quem_elaborou TEXT NOT NULL,
    nome_projeto TEXT NOT NULL,
    objeto_projeto TEXT,
    objetivos TEXT,
    justificativa TEXT,
    metas_resultados TEXT,
    perfil_publico TEXT,
    estimativa_publico TEXT,
    estruturas_acessibilidade TEXT,
    lei_acessibilidade_visual INTEGER DEFAULT 0,
    cobranca_ingresso INTEGER DEFAULT 0,
    arrecadacao_alimentos INTEGER DEFAULT 0,
    comercializacao_produtos INTEGER DEFAULT 0,
    recursos_outras_fontes INTEGER DEFAULT 0,
    periodo_execucao_inicio TEXT,
    periodo_execucao_fim TEXT,
    data_cadastro TEXT DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'rascunho'
  );

  -- Tabela de equipe técnica
  CREATE TABLE IF NOT EXISTS ficha_tecnica (
    id TEXT PRIMARY KEY,
    projeto_id TEXT NOT NULL,
    nome_profissional TEXT NOT NULL,
    funcao TEXT NOT NULL,
    cpf_cnpj TEXT,
    FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE
  );

  -- Tabela de plano de comunicação
  CREATE TABLE IF NOT EXISTS plano_comunicacao (
    id TEXT PRIMARY KEY,
    projeto_id TEXT NOT NULL,
    item_servico TEXT NOT NULL,
    formato_suporte TEXT,
    quantidade_periodo TEXT,
    veiculo_circulacao TEXT,
    FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE
  );

  -- Tabela de prestacao de contas (pagamentos)
  CREATE TABLE IF NOT EXISTS prestacao_contas (
    id TEXT PRIMARY KEY,
    projeto_id TEXT NOT NULL,
    origem TEXT NOT NULL CHECK (origem IN ('ficha_tecnica', 'plano_comunicacao')),
    item_original_id TEXT NOT NULL,
    descricao TEXT NOT NULL,
    valor REAL DEFAULT 0,
    pago INTEGER DEFAULT 0,
    data_pagamento TEXT,
    observacoes TEXT,
    data_criacao TEXT DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE
  );

  -- Tabela de anexos (comprovantes e notas fiscais)
  CREATE TABLE IF NOT EXISTS prestacao_anexos (
    id TEXT PRIMARY KEY,
    prestacao_id TEXT NOT NULL,
    tipo_anexo TEXT NOT NULL CHECK (tipo_anexo IN ('comprovante', 'nota_fiscal')),
    nome_arquivo TEXT NOT NULL,
    caminho_arquivo TEXT NOT NULL,
    tamanho_arquivo INTEGER,
    data_upload TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prestacao_id) REFERENCES prestacao_contas(id) ON DELETE CASCADE
  );

  -- Índices para melhor performance
  CREATE INDEX IF NOT EXISTS idx_prestacao_projeto ON prestacao_contas(projeto_id);
  CREATE INDEX IF NOT EXISTS idx_prestacao_status ON prestacao_contas(pago);
  CREATE INDEX IF NOT EXISTS idx_anexos_prestacao ON prestacao_anexos(prestacao_id);
`);

// ============================================
// CONFIGURAÇÃO DO EXPRESS
// ============================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

// Criar pasta de uploads se não existir
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

if (!fs.existsSync('uploads/comprovantes')) {
  fs.mkdirSync('uploads/comprovantes', { recursive: true });
}

if (!fs.existsSync('uploads/notas_fiscais')) {
  fs.mkdirSync('uploads/notas_fiscais', { recursive: true });
}

// ============================================
// ROTAS DA API - PROJETOS
// ============================================

// GET - Listar todos os projetos
app.get('/api/projetos', (req, res) => {
  try {
    const projetos = db.prepare('SELECT * FROM projetos ORDER BY data_cadastro DESC').all();
    res.json({ success: true, data: projetos });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Buscar projeto por ID
app.get('/api/projetos/:id', (req, res) => {
  try {
    const projeto = db.prepare('SELECT * FROM projetos WHERE id = ?').get(req.params.id);
    
    if (!projeto) {
      return res.status(404).json({ success: false, error: 'Projeto não encontrado' });
    }

    const fichaTecnica = db.prepare('SELECT * FROM ficha_tecnica WHERE projeto_id = ?').all(req.params.id);
    const planoComunicacao = db.prepare('SELECT * FROM plano_comunicacao WHERE projeto_id = ?').all(req.params.id);

    res.json({ 
      success: true, 
      data: {
        ...projeto,
        ficha_tecnica: fichaTecnica,
        plano_comunicacao: planoComunicacao
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Criar novo projeto
app.post('/api/projetos', (req, res) => {
  try {
    const id = uuidv4();
    
    const stmt = db.prepare(`
      INSERT INTO projetos (
        id, quem_elaborou, nome_projeto, objeto_projeto, objetivos, justificativa,
        metas_resultados, perfil_publico, estimativa_publico, estruturas_acessibilidade,
        lei_acessibilidade_visual, cobranca_ingresso, arrecadacao_alimentos,
        comercializacao_produtos, recursos_outras_fontes, periodo_execucao_inicio,
        periodo_execucao_fim, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      req.body.quem_elaborou,
      req.body.nome_projeto,
      req.body.objeto_projeto,
      req.body.objetivos,
      req.body.justificativa,
      req.body.metas_resultados,
      req.body.perfil_publico,
      req.body.estimativa_publico,
      req.body.estruturas_acessibilidade,
      req.body.lei_acessibilidade_visual ? 1 : 0,
      req.body.cobranca_ingresso ? 1 : 0,
      req.body.arrecadacao_alimentos ? 1 : 0,
      req.body.comercializacao_produtos ? 1 : 0,
      req.body.recursos_outras_fontes ? 1 : 0,
      req.body.periodo_execucao_inicio,
      req.body.periodo_execucao_fim,
      'rascunho'
    );

    res.json({ success: true, id: id, message: 'Projeto criado com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT - Atualizar projeto
app.put('/api/projetos/:id', (req, res) => {
  try {
    const stmt = db.prepare(`
      UPDATE projetos SET
        quem_elaborou = ?, nome_projeto = ?, objeto_projeto = ?, objetivos = ?,
        justificativa = ?, metas_resultados = ?, perfil_publico = ?,
        estimativa_publico = ?, estruturas_acessibilidade = ?,
        lei_acessibilidade_visual = ?, cobranca_ingresso = ?,
        arrecadacao_alimentos = ?, comercializacao_produtos = ?,
        recursos_outras_fontes = ?, periodo_execucao_inicio = ?,
        periodo_execucao_fim = ?, status = ?
      WHERE id = ?
    `);

    stmt.run(
      req.body.quem_elaborou,
      req.body.nome_projeto,
      req.body.objeto_projeto,
      req.body.objetivos,
      req.body.justificativa,
      req.body.metas_resultados,
      req.body.perfil_publico,
      req.body.estimativa_publico,
      req.body.estruturas_acessibilidade,
      req.body.lei_acessibilidade_visual ? 1 : 0,
      req.body.cobranca_ingresso ? 1 : 0,
      req.body.arrecadacao_alimentos ? 1 : 0,
      req.body.comercializacao_produtos ? 1 : 0,
      req.body.recursos_outras_fontes ? 1 : 0,
      req.body.periodo_execucao_inicio,
      req.body.periodo_execucao_fim,
      req.body.status || 'rascunho',
      req.params.id
    );

    res.json({ success: true, message: 'Projeto atualizado com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE - Excluir projeto
app.delete('/api/projetos/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM ficha_tecnica WHERE projeto_id = ?').run(req.params.id);
    db.prepare('DELETE FROM plano_comunicacao WHERE projeto_id = ?').run(req.params.id);
    db.prepare('DELETE FROM prestacao_anexos WHERE prestacao_id IN (SELECT id FROM prestacao_contas WHERE projeto_id = ?)').run(req.params.id);
    db.prepare('DELETE FROM prestacao_contas WHERE projeto_id = ?').run(req.params.id);
    db.prepare('DELETE FROM projetos WHERE id = ?').run(req.params.id);
    
    res.json({ success: true, message: 'Projeto excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Importar ficha técnica via Excel
app.post('/api/projetos/:id/ficha-tecnica/importar', upload.single('arquivo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const projetoId = req.params.id;

    // Limpar dados anteriores da ficha técnica
    db.prepare('DELETE FROM ficha_tecnica WHERE projeto_id = ?').run(projetoId);

    for (const row of data) {
      const id = uuidv4();
      const stmt = db.prepare(`
        INSERT INTO ficha_tecnica (id, projeto_id, nome_profissional, funcao, cpf_cnpj)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        id,
        projetoId,
        row['Nome do Profissional/Empresa'] || row['Nome'] || '',
        row['Função'] || row['Funcao'] || '',
        row['CPF/CNPJ'] || row['CPF'] || row['CNPJ'] || ''
      );
    }

    // Remover arquivo após processamento
    fs.unlinkSync(req.file.path);

    res.json({ 
      success: true, 
      message: `${data.length} registros importados com sucesso`,
      data: data
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Importar plano de comunicação via Excel
app.post('/api/projetos/:id/plano-comunicacao/importar', upload.single('arquivo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const projetoId = req.params.id;

    // Limpar dados anteriores do plano de comunicação
    db.prepare('DELETE FROM plano_comunicacao WHERE projeto_id = ?').run(projetoId);

    for (const row of data) {
      const id = uuidv4();
      const stmt = db.prepare(`
        INSERT INTO plano_comunicacao (id, projeto_id, item_servico, formato_suporte, quantidade_periodo, veiculo_circulacao)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        id,
        projetoId,
        row['Item/Serviço'] || row['Item'] || '',
        row['Formato / Suporte'] || row['Formato'] || row['Suporte'] || '',
        row['Quantidade / Período'] || row['Quantidade'] || row['Periodo'] || '',
        row['Veículo / Circulação'] || row['Veiculo'] || row['Circulacao'] || ''
      );
    }

    // Remover arquivo após processamento
    fs.unlinkSync(req.file.path);

    res.json({ 
      success: true, 
      message: `${data.length} registros importados com sucesso`,
      data: data
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Adicionar item manualmente na ficha técnica
app.post('/api/projetos/:id/ficha-tecnica', (req, res) => {
  try {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO ficha_tecnica (id, projeto_id, nome_profissional, funcao, cpf_cnpj)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, req.params.id, req.body.nome_profissional, req.body.funcao, req.body.cpf_cnpj);
    
    res.json({ success: true, id: id, message: 'Item adicionado com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Adicionar item manualmente no plano de comunicação
app.post('/api/projetos/:id/plano-comunicacao', (req, res) => {
  try {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO plano_comunicacao (id, projeto_id, item_servico, formato_suporte, quantidade_periodo, veiculo_circulacao)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id, 
      req.params.id, 
      req.body.item_servico, 
      req.body.formato_suporte, 
      req.body.quantidade_periodo, 
      req.body.veiculo_circulacao
    );
    
    res.json({ success: true, id: id, message: 'Item adicionado com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE - Remover item da ficha técnica
app.delete('/api/ficha-tecnica/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM ficha_tecnica WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Item removido com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE - Remover item do plano de comunicação
app.delete('/api/plano-comunicacao/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM plano_comunicacao WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Item removido com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ROTAS DA API - PRESTAÇÃO DE CONTAS (NOVO)
// ============================================

// GET - Listar projetos com informações financeiras resumidas
app.get('/api/prestacao-contas/projetos', (req, res) => {
  try {
    const projetos = db.prepare(`
      SELECT 
        p.*,
        (
          SELECT COUNT(*) FROM prestacao_contas pc WHERE pc.projeto_id = p.id
        ) as total_itens,
        (
          SELECT COALESCE(SUM(pc.valor), 0) FROM prestacao_contas pc WHERE pc.projeto_id = p.id
        ) as valor_total,
        (
          SELECT COALESCE(SUM(pc.valor), 0) FROM prestacao_contas pc WHERE pc.projeto_id = p.id AND pc.pago = 1
        ) as valor_pago
      FROM projetos p
      WHERE p.status = 'finalizado'
      ORDER BY p.data_cadastro DESC
    `).all();
    
    res.json({ success: true, data: projetos });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Buscar dados de prestação de contas de um projeto
app.get('/api/prestacao-contas/:projetoId', (req, res) => {
  try {
    const projetoId = req.params.projetoId;
    
    // Buscar dados do projeto
    const projeto = db.prepare('SELECT * FROM projetos WHERE id = ?').get(projetoId);
    
    if (!projeto) {
      return res.status(404).json({ success: false, error: 'Projeto não encontrado' });
    }
    
    // Buscar ficha técnica do projeto
    const fichaTecnica = db.prepare('SELECT * FROM ficha_tecnica WHERE projeto_id = ?').all(projetoId);
    
    // Buscar plano de comunicação do projeto
    const planoComunicacao = db.prepare('SELECT * FROM plano_comunicacao WHERE projeto_id = ?').all(projetoId);
    
    // Buscar registros de prestação de contas existentes
    const prestacaoContas = db.prepare('SELECT * FROM prestacao_contas WHERE projeto_id = ?').all(projetoId);
    
    // Buscar anexos de cada prestação de contas
    const prestacaoComAnexos = prestacaoContas.map(pc => {
      const anexos = db.prepare('SELECT * FROM prestacao_anexos WHERE prestacao_id = ?').all(pc.id);
      return {
        ...pc,
        anexos: {
          comprovante: anexos.find(a => a.tipo_anexo === 'comprovante'),
          nota_fiscal: anexos.find(a => a.tipo_anexo === 'nota_fiscal')
        }
      };
    });
    
    // Criar lista de pagamentos combinando planilhas com registros existentes
    const pagamentos = [];
    
    // Processar ficha técnica
    for (const item of fichaTecnica) {
      const existente = prestacaoComAnexos.find(pc => pc.item_original_id === item.id && pc.origem === 'ficha_tecnica');
      
      if (existente) {
        pagamentos.push(existente);
      } else {
        pagamentos.push({
          id: null,
          projeto_id: projetoId,
          origem: 'ficha_tecnica',
          item_original_id: item.id,
          descricao: `${item.funcao} - ${item.nome_profissional}`,
          valor: 0,
          pago: 0,
          data_pagamento: null,
          observacoes: null,
          anexos: { comprovante: null, nota_fiscal: null }
        });
      }
    }
    
    // Processar plano de comunicação
    for (const item of planoComunicacao) {
      const existente = prestacaoComAnexos.find(pc => pc.item_original_id === item.id && pc.origem === 'plano_comunicacao');
      
      if (existente) {
        pagamentos.push(existente);
      } else {
        pagamentos.push({
          id: null,
          projeto_id: projetoId,
          origem: 'plano_comunicacao',
          item_original_id: item.id,
          descricao: item.item_servico,
          valor: 0,
          pago: 0,
          data_pagamento: null,
          observacoes: null,
          anexos: { comprovante: null, nota_fiscal: null }
        });
      }
    }
    
    // Calcular totais
    const totalPrevisto = pagamentos.reduce((sum, p) => sum + (parseFloat(p.valor) || 0), 0);
    const totalPago = pagamentos.filter(p => p.pago === 1).reduce((sum, p) => sum + (parseFloat(p.valor) || 0), 0);
    const totalPendente = totalPrevisto - totalPago;
    
    res.json({
      success: true,
      data: {
        projeto,
        pagamentos,
        totais: {
          total_previsto: totalPrevisto,
          total_pago: totalPago,
          total_pendente: totalPendente,
          percentual_pago: totalPrevisto > 0 ? ((totalPago / totalPrevisto) * 100).toFixed(1) : 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Salvar/atualizar registro de prestação de contas
app.post('/api/prestacao-contas', (req, res) => {
  try {
    const {
      projeto_id,
      origem,
      item_original_id,
      descricao,
      valor,
      pago,
      data_pagamento,
      observacoes
    } = req.body;
    
    // Verificar se já existe registro
    const existente = db.prepare(`
      SELECT id FROM prestacao_contas 
      WHERE projeto_id = ? AND item_original_id = ? AND origem = ?
    `).get(projeto_id, item_original_id, origem);
    
    if (existente) {
      // Atualizar registro existente
      const stmt = db.prepare(`
        UPDATE prestacao_contas SET
          descricao = ?,
          valor = ?,
          pago = ?,
          data_pagamento = ?,
          observacoes = ?,
          data_atualizacao = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      
      stmt.run(descricao, valor || 0, pago ? 1 : 0, data_pagamento, observacoes, existente.id);
      
      res.json({ success: true, id: existente.id, message: 'Registro atualizado com sucesso' });
    } else {
      // Criar novo registro
      const id = uuidv4();
      const stmt = db.prepare(`
        INSERT INTO prestacao_contas (
          id, projeto_id, origem, item_original_id, descricao, valor, pago, data_pagamento, observacoes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(id, projeto_id, origem, item_original_id, descricao, valor || 0, pago ? 1 : 0, data_pagamento, observacoes);
      
      res.json({ success: true, id: id, message: 'Registro criado com sucesso' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Upload de arquivo (comprovante ou nota fiscal)
app.post('/api/prestacao-contas/:id/upload', upload.single('arquivo'), (req, res) => {
  try {
    const prestacaoId = req.params.id;
    const tipoAnexo = req.body.tipo_anexo; // 'comprovante' ou 'nota_fiscal'
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado' });
    }
    
    if (!tipoAnexo || !['comprovante', 'nota_fiscal'].includes(tipoAnexo)) {
      // Remover arquivo enviado
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, error: 'Tipo de anexo inválido' });
    }
    
    // Verificar se já existe anexo deste tipo
    const existente = db.prepare(`
      SELECT id, caminho_arquivo FROM prestacao_anexos 
      WHERE prestacao_id = ? AND tipo_anexo = ?
    `).get(prestacaoId, tipoAnexo);
    
    const caminhoPasta = tipoAnexo === 'comprovante' ? 'uploads/comprovantes' : 'uploads/notas_fiscais';
    const nomeArquivo = `${prestacaoId}_${tipoAnexo}_${Date.now()}.pdf`;
    const caminhoCompleto = path.join(caminhoPasta, nomeArquivo);
    
    // Mover arquivo para a pasta correta
    const pastaDestino = path.dirname(caminhoCompleto);
    if (!fs.existsSync(pastaDestino)) {
      fs.mkdirSync(pastaDestino, { recursive: true });
    }
    fs.renameSync(req.file.path, caminhoCompleto);
    
    if (existente) {
      // Remover arquivo antigo se existir
      if (fs.existsSync(existente.caminho_arquivo)) {
        fs.unlinkSync(existente.caminho_arquivo);
      }
      
      // Atualizar registro existente
      const stmt = db.prepare(`
        UPDATE prestacao_anexos SET
          nome_arquivo = ?,
          caminho_arquivo = ?,
          tamanho_arquivo = ?,
          data_upload = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      
      stmt.run(req.file.originalname, caminhoCompleto, req.file.size, existente.id);
      
      res.json({ 
        success: true, 
        id: existente.id, 
        message: 'Arquivo atualizado com sucesso',
        nome_arquivo: req.file.originalname
      });
    } else {
      // Criar novo registro
      const id = uuidv4();
      const stmt = db.prepare(`
        INSERT INTO prestacao_anexos (id, prestacao_id, tipo_anexo, nome_arquivo, caminho_arquivo, tamanho_arquivo)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(id, prestacaoId, tipoAnexo, req.file.originalname, caminhoCompleto, req.file.size);
      
      res.json({ 
        success: true, 
        id: id, 
        message: 'Arquivo enviado com sucesso',
        nome_arquivo: req.file.originalname
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Baixar arquivo anexado
app.get('/api/prestacao-contas/anexo/:id', (req, res) => {
  try {
    const anexo = db.prepare('SELECT * FROM prestacao_anexos WHERE id = ?').get(req.params.id);
    
    if (!anexo) {
      return res.status(404).json({ success: false, error: 'Arquivo não encontrado' });
    }
    
    if (!fs.existsSync(anexo.caminho_arquivo)) {
      return res.status(404).json({ success: false, error: 'Arquivo não encontrado no servidor' });
    }
    
    res.download(anexo.caminho_arquivo, anexo.nome_arquivo);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE - Remover anexo
app.delete('/api/prestacao-contas/anexo/:id', (req, res) => {
  try {
    const anexo = db.prepare('SELECT * FROM prestacao_anexos WHERE id = ?').get(req.params.id);
    
    if (anexo) {
      // Remover arquivo do servidor
      if (fs.existsSync(anexo.caminho_arquivo)) {
        fs.unlinkSync(anexo.caminho_arquivo);
      }
      
      // Remover registro do banco
      db.prepare('DELETE FROM prestacao_anexos WHERE id = ?').run(req.params.id);
    }
    
    res.json({ success: true, message: 'Anexo removido com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST - Excluir registro de prestação de contas
app.delete('/api/prestacao-contas/:id', (req, res) => {
  try {
    const prestacaoId = req.params.id;
    
    // Buscar e remover anexos
    const anexos = db.prepare('SELECT * FROM prestacao_anexos WHERE prestacao_id = ?').all(prestacaoId);
    for (const anexo of anexos) {
      if (fs.existsSync(anexo.caminho_arquivo)) {
        fs.unlinkSync(anexo.caminho_arquivo);
      }
    }
    
    // Remover registros de anexos
    db.prepare('DELETE FROM prestacao_anexos WHERE prestacao_id = ?').run(prestacaoId);
    
    // Remover registro de prestação de contas
    db.prepare('DELETE FROM prestacao_contas WHERE id = ?').run(prestacaoId);
    
    res.json({ success: true, message: 'Registro removido com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Relatório consolidado de prestação de contas
app.get('/api/prestacao-contas/relatorio/consolidado', (req, res) => {
  try {
    const projetos = db.prepare(`
      SELECT 
        p.id,
        p.nome_projeto,
        p.quem_elaborou,
        p.periodo_execucao_inicio,
        p.periodo_execucao_fim,
        (
          SELECT COUNT(*) FROM prestacao_contas pc WHERE pc.projeto_id = p.id
        ) as total_itens,
        (
          SELECT COALESCE(SUM(pc.valor), 0) FROM prestacao_contas pc WHERE pc.projeto_id = p.id
        ) as valor_total,
        (
          SELECT COALESCE(SUM(pc.valor), 0) FROM prestacao_contas pc WHERE pc.projeto_id = p.id AND pc.pago = 1
        ) as valor_pago,
        (
          SELECT COUNT(*) FROM prestacao_contas pc WHERE pc.projeto_id = p.id AND pc.pago = 1
        ) as itens_pagos
      FROM projetos p
      WHERE p.status = 'finalizado'
      ORDER BY p.data_cadastro DESC
    `).all();
    
    const totals = {
      total_projetos: projetos.length,
      valor_total_geral: projetos.reduce((sum, p) => sum + (p.valor_total || 0), 0),
      valor_pago_geral: projetos.reduce((sum, p) => sum + (p.valor_pago || 0), 0),
      total_itens: projetos.reduce((sum, p) => sum + (p.total_itens || 0), 0),
      itens_pagos: projetos.reduce((sum, p) => sum + (p.itens_pagos || 0), 0)
    };
    
    totals.valor_pendente_geral = totals.valor_total_geral - totals.valor_pago_geral;
    
    res.json({ success: true, data: { projetos, totals } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ROTAS DO FRONTEND
// ============================================

// Servir a página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Servir arquivos de comprovantes e notas fiscais
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                                                           ║
║   🎭 2 Produções - Plataforma de Gestão Cultural          ║
║                                                           ║
║   ✅ Módulo de Prestação de Contas Ativo!                  ║
║                                                           ║
║   Servidor iniciado com sucesso!                          ║
║                                                           ║
║   📍 Acesse: http://localhost:${PORT}                        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════════════╝
  `);
});
