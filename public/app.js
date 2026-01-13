/**
 * 2 Produções - Plataforma de Gestão Cultural
 * Aplicação JavaScript Principal
 */

// Tratamento global de erros
window.addEventListener('error', (e) => {
  console.error('Erro JavaScript:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Promise rejeitada:', e.reason);
});

let currentProjectId = null;
let currentStep = 1;
let fichaTecnicaData = [];
let planoComunicacaoData = [];
let currentEditingProject = null;
let currentProfissionalId = null;
let profissionaisData = [];

// ============================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM carregado, inicializando aplicação...');
  try {
    // Inicializar banco de dados
    await db.init();
    console.log('Banco de dados inicializado');
    
    inicializarAplicacao();
    await carregarEstatisticas();
    await carregarProjetosRecentes();
    console.log('Aplicação inicializada com sucesso');
  } catch (error) {
    console.error('Erro na inicialização:', error);
  }
});

function inicializarAplicacao() {
  // Navegação do Sidebar
  setupSidebarNavigation();
  
  // Botões de ação
  setupButtons();
  
  // Stepper do formulário
  setupStepper();
  
  // Abas do formulário
  setupTabs();
  
  // Upload de arquivos
  setupFileUploads();
  
  // Upload de documentos de profissionais
  setupDocumentUploads();
  
  // Adição manual de dados
  setupManualAdditions();
  
  // Filtros de projetos
  setupFilters();
  
  // Modal
  setupModal();
}

// ============================================
// NAVEGAÇÃO DO SIDEBAR
// ============================================

function setupSidebarNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      navigateToPage(page);
      
      // Fechar sidebar no mobile
      if (window.innerWidth <= 1024) {
        sidebar.classList.remove('active');
      }
    });
  });

  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
  });

  // Fechar sidebar ao clicar fora no mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 1024 && 
        !sidebar.contains(e.target) && 
        !menuToggle.contains(e.target)) {
      sidebar.classList.remove('active');
    }
  });
}

function navigateToPage(pageName) {
  // Atualizar navegação
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.page === pageName) {
      item.classList.add('active');
    }
  });

  // Atualizar páginas
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });

  const page = document.getElementById(`page-${pageName}`);
  if (page) {
    page.classList.add('active');
    
    // Atualizar título
    const titles = {
      'dashboard': 'Dashboard',
      'novo-projeto': 'Novo Projeto',
      'projetos': 'Projetos',
      'profissionais': 'Profissionais',
      'novo-profissional': 'Novo Profissional'
    };
    document.getElementById('pageTitle').textContent = titles[pageName] || 'Dashboard';
  }

  // Carregar dados específicos da página
  if (pageName === 'projetos') {
    carregarTodosProjetos();
  } else if (pageName === 'profissionais') {
    carregarProfissionais();
  }
}

// ============================================
// BOTÕES DE AÇÃO
// ============================================

function setupButtons() {
  // Botão Novo Projeto no header
  document.getElementById('btnNovoProjeto').addEventListener('click', () => {
    resetForm();
    navigateToPage('novo-projeto');
  });

  // Botões de Profissionais
  document.getElementById('btnNovoProfissional').addEventListener('click', () => {
    resetProfissionalForm();
    navigateToPage('novo-profissional');
  });

  document.getElementById('voltarProfissionais').addEventListener('click', () => {
    navigateToPage('profissionais');
  });

  document.getElementById('cancelarProfissional').addEventListener('click', () => {
    navigateToPage('profissionais');
  });

  document.getElementById('profissionalForm').addEventListener('submit', (e) => {
    e.preventDefault();
    salvarProfissional();
  });

  // Voltar ao dashboard
  document.querySelectorAll('.nav-item[data-page="dashboard"]').forEach(item => {
    item.addEventListener('click', () => {
      carregarEstatisticas();
      carregarProjetosRecentes();
    });
  });

  // Salvar rascunho
  document.getElementById('salvarRascunhoBtn').addEventListener('click', () => {
    salvarProjeto('rascunho');
  });

  // Finalizar projeto
  document.getElementById('finalizarBtn').addEventListener('click', () => {
    if (validarFormulario()) {
      salvarProjeto('finalizado');
    }
  });
}

// ============================================
// STEPPER DO FORMULÁRIO
// ============================================

function setupStepper() {
  const nextButtons = document.querySelectorAll('.next-step');
  const prevButtons = document.querySelectorAll('.prev-step');

  nextButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (validarStepAtual()) {
        goToStep(currentStep + 1);
      }
    });
  });

  prevButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      goToStep(currentStep - 1);
    });
  });
}

function goToStep(step) {
  // Esconder step atual
  document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.remove('active');
  document.querySelector(`.step[data-step="${currentStep}"]`).classList.remove('active');
  document.querySelector(`.step[data-step="${currentStep}"]`).classList.add('completed');

  // Mostrar próximo step
  currentStep = step;
  document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.add('active');
  document.querySelector(`.step[data-step="${currentStep}"]`).classList.add('active');

  // Se for o último step, mostrar revisão
  if (currentStep === 5) {
    gerarRevisao();
  }

  // Scroll para o topo do formulário
  document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
}

function validarStepAtual() {
  const stepForm = document.querySelector(`.form-step[data-step="${currentStep}"]`);
  const requiredFields = stepForm.querySelectorAll('input[required], textarea[required]');
  let isValid = true;

  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      isValid = false;
      field.style.borderColor = '#EF4444';
      showFieldError(field);
    } else {
      field.style.borderColor = '';
      hideFieldError(field);
    }
  });

  if (!isValid) {
    showToast('Por favor, preencha todos os campos obrigatórios', 'warning');
  }

  return isValid;
}

function showFieldError(field) {
  field.addEventListener('input', function handler() {
    this.style.borderColor = '';
    this.removeEventListener('input', handler);
  });
}

function hideFieldError(field) {
  field.style.borderColor = '';
}

function validarFormulario() {
  const requiredFields = document.querySelectorAll('#projectForm input[required], #projectForm textarea[required]');
  let isValid = true;

  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      isValid = false;
      field.style.borderColor = '#EF4444';
    }
  });

  // Verificar checkbox de acessibilidade
  if (!document.getElementById('leiAcessibilidadeVisual').checked) {
    isValid = false;
    showToast('É necessário concordar com as exigências de acessibilidade visual', 'warning');
  }

  if (!isValid) {
    showToast('Por favor, preencha todos os campos obrigatórios', 'warning');
  }

  return isValid;
}

// ============================================
// ABAS DO FORMULÁRIO
// ============================================

function setupTabs() {
  console.log('Configurando abas...');
  const tabButtons = document.querySelectorAll('.tab-btn');
  console.log('Botões encontrados:', tabButtons.length);

  tabButtons.forEach((btn, index) => {
    console.log(`Configurando botão ${index}:`, btn.dataset.tab);
    btn.addEventListener('click', (e) => {
      console.log('Clique na aba:', btn.dataset.tab);
      e.preventDefault();
      e.stopPropagation();
      
      const tabId = btn.dataset.tab;

      // Atualizar botões
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Atualizar conteúdo
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      const targetTab = document.getElementById(`tab-${tabId}`);
      if (targetTab) {
        targetTab.classList.add('active');
        console.log('Aba ativada:', tabId);
      } else {
        console.error('Aba não encontrada:', `tab-${tabId}`);
      }
    });
  });
}

// ============================================
// UPLOAD DE ARQUIVOS
// ============================================

function setupFileUploads() {
  // Ficha Técnica
  setupUploadArea('fichaTecnicaUpload', 'ficha_tecnica_file', (files) => {
    handleFileUpload(files[0], 'fichaTecnicaBtn', processarFichaTecnica);
  });

  document.getElementById('importarFichaTecnicaBtn').addEventListener('click', () => {
    const input = document.querySelector('input[name="ficha_tecnica_file"]');
    if (input.files.length > 0) {
      handleFileUpload(input.files[0], 'importarFichaTecnicaBtn', processarFichaTecnica);
    } else {
      showToast('Selecione um arquivo primeiro', 'warning');
    }
  });

  // Plano de Comunicação
  setupUploadArea('planoComunicacaoUpload', 'plano_comunicacao_file', (files) => {
    handleFileUpload(files[0], 'planoComunicacaoBtn', processarPlanoComunicacao);
  });

  document.getElementById('importarPlanoComunicacaoBtn').addEventListener('click', () => {
    const input = document.querySelector('input[name="plano_comunicacao_file"]');
    if (input.files.length > 0) {
      handleFileUpload(input.files[0], 'importarPlanoComunicacaoBtn', processarPlanoComunicacao);
    } else {
      showToast('Selecione um arquivo primeiro', 'warning');
    }
  });
}

function setupUploadArea(areaId, inputName, callback) {
  const area = document.getElementById(areaId);
  const input = area.querySelector(`input[name="${inputName}"]`);

  area.addEventListener('click', () => {
    input.click();
  });

  area.addEventListener('dragover', (e) => {
    e.preventDefault();
    area.classList.add('dragover');
  });

  area.addEventListener('dragleave', () => {
    area.classList.remove('dragover');
  });

  area.addEventListener('drop', (e) => {
    e.preventDefault();
    area.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      callback(e.dataTransfer.files);
    }
  });

  input.addEventListener('change', () => {
    if (input.files.length > 0) {
      callback(input.files);
    }
  });
}

function handleFileUpload(file, buttonId, processor) {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ];

  if (!validTypes.includes(file.type)) {
    showToast('Por favor, envie apenas arquivos Excel (.xlsx ou .xls)', 'error');
    return;
  }

  // Processar localmente
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      // Simular processamento de Excel (seria necessário biblioteca XLSX)
      showToast('Funcionalidade de importação de Excel não disponível na versão estática', 'warning');
    } catch (error) {
      showToast('Erro ao ler arquivo: ' + error.message, 'error');
    }
  };
  reader.readAsArrayBuffer(file);
}

function processarDadosAPI(data, tipo) {
  if (tipo === 'ficha') {
    fichaTecnicaData = data.map(item => ({
      id: generateId(),
      nome_profissional: item['Nome do Profissional/Empresa'] || item['Nome'] || '',
      funcao: item['Função'] || item['Funcao'] || '',
      cpf_cnpj: item['CPF/CNPJ'] || item['CPF'] || item['CNPJ'] || ''
    }));
  } else {
    planoComunicacaoData = data.map(item => ({
      id: generateId(),
      item_servico: item['Item/Serviço'] || item['Item'] || '',
      formato_suporte: item['Formato / Suporte'] || item['Formato'] || item['Suporte'] || '',
      quantidade_periodo: item['Quantidade / Período'] || item['Quantidade'] || item['Periodo'] || '',
      veiculo_circulacao: item['Veículo / Circulação'] || item['Veiculo'] || item['Circulacao'] || ''
    }));
  }
}

function processarFichaTecnica(data) {
  fichaTecnicaData = data.map(item => ({
    id: generateId(),
    nome_profissional: item['Nome do Profissional/Empresa'] || '',
    funcao: item['Função'] || '',
    cpf_cnpj: item['CPF/CNPJ'] || ''
  }));
}

function processarPlanoComunicacao(data) {
  planoComunicacaoData = data.map(item => ({
    id: generateId(),
    item_servico: item['Item/Serviço'] || '',
    formato_suporte: item['Formato / Suporte'] || '',
    quantidade_periodo: item['Quantidade / Período'] || '',
    veiculo_circulacao: item['Veículo / Circulação'] || ''
  }));
}

// ============================================
// ADIÇÃO MANUAL
// ============================================

function setupManualAdditions() {
  // Adicionar à Ficha Técnica
  document.getElementById('addFtBtn').addEventListener('click', () => {
    const nome = document.getElementById('ftNome').value.trim();
    const funcao = document.getElementById('ftFuncao').value.trim();
    const cpf = document.getElementById('ftCpfCnpj').value.trim();

    if (!nome || !funcao) {
      showToast('Preencha pelo menos nome e função', 'warning');
      return;
    }

    fichaTecnicaData.push({
      id: generateId(),
      nome_profissional: nome,
      funcao: funcao,
      cpf_cnpj: cpf,
      valor: document.getElementById('ftValor').value || 0
    });

    // Limpar campos
    document.getElementById('ftNome').value = '';
    document.getElementById('ftFuncao').value = '';
    document.getElementById('ftCpfCnpj').value = '';
    document.getElementById('ftValor').value = '';

    atualizarTabelas();
    showToast('Profissional adicionado com sucesso', 'success');
  });

  // Adicionar ao Plano de Comunicação
  document.getElementById('addPcBtn').addEventListener('click', () => {
    const item = document.getElementById('pcItem').value.trim();
    const formato = document.getElementById('pcFormato').value.trim();
    const quantidade = document.getElementById('pcQuantidade').value.trim();
    const veiculo = document.getElementById('pcVeiculo').value.trim();

    if (!item) {
      showToast('Preencha pelo menos o item/serviço', 'warning');
      return;
    }

    planoComunicacaoData.push({
      id: generateId(),
      item_servico: item,
      formato_suporte: formato,
      quantidade_periodo: quantidade,
      veiculo_circulacao: veiculo,
      valor: document.getElementById('pcValor').value || 0
    });

    // Limpar campos
    document.getElementById('pcItem').value = '';
    document.getElementById('pcFormato').value = '';
    document.getElementById('pcQuantidade').value = '';
    document.getElementById('pcVeiculo').value = '';
    document.getElementById('pcValor').value = '';

    atualizarTabelas();
    showToast('Item adicionado com sucesso', 'success');
  });
}

function atualizarTabelas() {
  // Atualizar tabela da Ficha Técnica
  const ftBody = document.getElementById('fichaTecnicaBody');
  ftBody.innerHTML = fichaTecnicaData.map(item => `
    <tr>
      <td>${escapeHtml(item.nome_professional || item.nome_profissional || '')}</td>
      <td>${escapeHtml(item.funcao || item.funcao || '')}</td>
      <td>${escapeHtml(item.cpf_cnpj || '')}</td>
      <td>R$ ${parseFloat(item.valor || 0).toFixed(2)}</td>
      <td>
        <button class="btn btn-delete btn-sm" onclick="removerItem('ficha', '${item.id}')">🗑️</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="5" class="empty-state">Nenhum profissional adicionado</td></tr>';

  // Atualizar tabela do Plano de Comunicação
  const pcBody = document.getElementById('planoComunicacaoBody');
  pcBody.innerHTML = planoComunicacaoData.map(item => `
    <tr>
      <td>${escapeHtml(item.item_servico || item.item || '')}</td>
      <td>${escapeHtml(item.formato_suporte || item.formato || item.suporte || '')}</td>
      <td>${escapeHtml(item.quantidade_periodo || item.quantidade || item.periodo || '')}</td>
      <td>${escapeHtml(item.veiculo_circulacao || item.veiculo || item.circulacao || '')}</td>
      <td>R$ ${parseFloat(item.valor || 0).toFixed(2)}</td>
      <td>
        <button class="btn btn-delete btn-sm" onclick="removerItem('comunicacao', '${item.id}')">🗑️</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="6" class="empty-state">Nenhum item adicionado</td></tr>';
}

function removerItem(tipo, id) {
  if (tipo === 'ficha') {
    fichaTecnicaData = fichaTecnicaData.filter(item => item.id !== id);
  } else {
    planoComunicacaoData = planoComunicacaoData.filter(item => item.id !== id);
  }
  atualizarTabelas();
  showToast('Item removido com sucesso', 'success');
}

// ============================================
// REVISÃO DO PROJETO
// ============================================

function gerarRevisao() {
  const reviewContent = document.getElementById('reviewContent');
  
  const quemElaborou = document.getElementById('quemElaborou').value;
  const nomeProjeto = document.getElementById('nomeProjeto').value;
  const objetoProjeto = document.getElementById('objetoProjeto').value;
  const justificativa = document.getElementById('justificativa').value;
  const perfilPublico = document.getElementById('perfilPublico').value;
  const estimativaPublico = document.getElementById('estimativaPublico').value;
  const periodoInicio = document.getElementById('periodoInicio').value;
  const periodoFim = document.getElementById('periodoFim').value;

  reviewContent.innerHTML = `
    <div class="review-item">
      <span class="review-label">Projeto:</span>
      <span class="review-value">${escapeHtml(nomeProjeto)}</span>
    </div>
    <div class="review-item">
      <span class="review-label">Elaborado por:</span>
      <span class="review-value">${escapeHtml(quemElaborou)}</span>
    </div>
    <div class="review-item">
      <span class="review-label">Objeto:</span>
      <span class="review-value">${escapeHtml(objetoProjeto) || '-'}</span>
    </div>
    <div class="review-item">
      <span class="review-label">Justificativa:</span>
      <span class="review-value">${escapeHtml(justificativa) || '-'}</span>
    </div>
    <div class="review-item">
      <span class="review-label">Público-alvo:</span>
      <span class="review-value">${escapeHtml(perfilPublico) || '-'}</span>
    </div>
    <div class="review-item">
      <span class="review-label">Estimativa de público:</span>
      <span class="review-value">${escapeHtml(estimativaPublico) || '-'}</span>
    </div>
    <div class="review-item">
      <span class="review-label">Período de Execução:</span>
      <span class="review-value">${periodoInicio ? formatDate(periodoInicio) : '-'} até ${periodoFim ? formatDate(periodoFim) : '-'}</span>
    </div>
    <div class="review-item">
      <span class="review-label">Equipe Técnica:</span>
      <span class="review-value">${fichaTecnicaData.length} profissionais cadastrados</span>
    </div>
    <div class="review-item">
      <span class="review-label">Plano de Comunicação:</span>
      <span class="review-value">${planoComunicacaoData.length} itens cadastrados</span>
    </div>
  `;
}

// ============================================
// SALVAR PROJETO
// ============================================

async function salvarProjeto(status) {
  const projetoData = {
    id: currentProjectId || generateId(),
    quem_elaborou: document.getElementById('quemElaborou').value,
    nome_projeto: document.getElementById('nomeProjeto').value,
    objeto_projeto: document.getElementById('objetoProjeto').value,
    objetivos: document.getElementById('objetivos').value,
    justificativa: document.getElementById('justificativa').value,
    metas_resultados: document.getElementById('metasResultados').value,
    perfil_publico: document.getElementById('perfilPublico').value,
    estimativa_publico: document.getElementById('estimativaPublico').value,
    estruturas_acessibilidade: document.getElementById('estruturasAcessibilidade').value,
    lei_acessibilidade_visual: document.getElementById('leiAcessibilidadeVisual').checked,
    cobranca_ingresso: document.getElementById('cobrancaIngresso').checked,
    arrecadacao_alimentos: document.getElementById('arrecadacaoAlimentos').checked,
    comercializacao_produtos: document.getElementById('comercializacaoProdutos').checked,
    recursos_outras_fontes: document.getElementById('recursosOutrasFontes').checked,
    periodo_execucao_inicio: document.getElementById('periodoInicio').value,
    periodo_execucao_fim: document.getElementById('periodoFim').value,
    status: document.getElementById('statusProjeto') ? document.getElementById('statusProjeto').value : status,
    data_cadastro: new Date().toISOString(),
    ficha_tecnica: [...fichaTecnicaData],
    plano_comunicacao: [...planoComunicacaoData]
  };

  try {
    await db.salvarProjeto(projetoData);
    showToast(status === 'finalizado' ? 'Projeto finalizado com sucesso!' : 'Rascunho salvo com sucesso!', 'success');
    
    resetForm();
    currentProjectId = null;
    navigateToPage('dashboard');
    await carregarEstatisticas();
    await carregarProjetosRecentes();
  } catch (error) {
    console.error('Erro ao salvar projeto:', error);
    showToast('Erro ao salvar projeto', 'error');
  }
}

function resetForm() {
  document.getElementById('projectForm').reset();
  currentStep = 1;
  fichaTecnicaData = [];
  planoComunicacaoData = [];
  currentProjectId = null;

  // Resetar steps
  document.querySelectorAll('.form-step').forEach((step, index) => {
    step.classList.toggle('active', index === 0);
  });

  document.querySelectorAll('.step').forEach((step, index) => {
    step.classList.remove('active', 'completed');
    if (index === 0) step.classList.add('active');
  });

  // Resetar abas
  document.querySelectorAll('.tab-btn').forEach((btn, index) => {
    btn.classList.toggle('active', index === 0);
  });

  document.querySelectorAll('.tab-content').forEach((content, index) => {
    content.classList.toggle('active', index === 0);
  });

  atualizarTabelas();
}

// ============================================
// CARREGAR DADOS DO BACKEND
// ============================================

async function carregarEstatisticas() {
  try {
    const projetos = await db.obterProjetos();
    const agora = new Date();
    const esteMes = projetos.filter(p => {
      const dataCadastro = new Date(p.data_cadastro);
      return dataCadastro.getMonth() === agora.getMonth() && 
             dataCadastro.getFullYear() === agora.getFullYear();
    });

    document.getElementById('totalProjetos').textContent = projetos.length;
    document.getElementById('projetosRascunho').textContent = projetos.filter(p => p.status === 'rascunho').length;
    document.getElementById('projetosFinalizados').textContent = projetos.filter(p => p.status === 'finalizado').length;
    document.getElementById('projetosEsteMes').textContent = esteMes.length;
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error);
  }
}

function carregarProjetosRecentes() {
  const projetos = JSON.parse(localStorage.getItem('projetos') || '[]');
  const tbody = document.getElementById('recentProjectsBody');
  const projetosRecentes = projetos.slice(-5).reverse();

  if (projetosRecentes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          <div class="empty-state-icon">📭</div>
          <p>Nenhum projeto cadastrado ainda</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = projetosRecentes.map(projeto => `
    <tr>
      <td><strong>${escapeHtml(projeto.nome_projeto)}</strong></td>
      <td>${escapeHtml(projeto.quem_elaborou)}</td>
      <td>${formatDate(projeto.data_cadastro)}</td>
      <td><span class="status-badge ${projeto.status}">${projeto.status === 'rascunho' ? 'Rascunho' : 'Finalizado'}</span></td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-primary btn-sm" onclick="visualizarProjeto('${projeto.id}')">👁️</button>
          <button class="btn btn-secondary btn-sm" onclick="editarProjeto('${projeto.id}')">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="excluirProjeto('${projeto.id}')">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function carregarTodosProjetos() {
  const projetos = JSON.parse(localStorage.getItem('projetos') || '[]');
  const tbody = document.getElementById('allProjectsBody');

  if (projetos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <div class="empty-state-icon">📭</div>
          <p>Nenhum projeto encontrado</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = projetos.map(projeto => `
    <tr>
      <td><strong>${escapeHtml(projeto.nome_projeto)}</strong></td>
      <td>${escapeHtml(projeto.quem_elaborou)}</td>
      <td>${projeto.periodo_execucao_inicio && projeto.periodo_execucao_fim 
        ? `${formatDate(projeto.periodo_execucao_inicio)} - ${formatDate(projeto.periodo_execucao_fim)}` 
        : '-'}</td>
      <td><span class="status-badge ${projeto.status}">${projeto.status === 'rascunho' ? 'Rascunho' : 'Finalizado'}</span></td>
      <td>${formatDate(projeto.data_cadastro)}</td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-primary btn-sm" onclick="visualizarProjeto('${projeto.id}')">👁️</button>
          <button class="btn btn-secondary btn-sm" onclick="editarProjeto('${projeto.id}')">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="excluirProjeto('${projeto.id}')">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ============================================
// VISUALIZAÇÃO E EDIÇÃO DE PROJETOS
// ============================================

function visualizarProjeto(id) {
  const projetos = JSON.parse(localStorage.getItem('projetos') || '[]');
  const projeto = projetos.find(p => p.id === id);
  
  if (!projeto) {
    showToast('Projeto não encontrado', 'error');
    return;
  }
  
  currentEditingProject = projeto;

  const modalTitle = document.getElementById('modalProjectTitle');
  const modalBody = document.getElementById('modalBody');

  modalTitle.textContent = projeto.nome_projeto;

  modalBody.innerHTML = `
    <div class="project-details">
      <div class="detail-section">
        <h4>Identificação</h4>
        <div class="detail-item">
          <strong>Elaborado por:</strong> ${escapeHtml(projeto.quem_elaborou)}
        </div>
        <div class="detail-item">
          <strong>Objeto:</strong> ${escapeHtml(projeto.objeto_projeto) || '-'}
        </div>
        <div class="detail-item">
          <strong>Objetivos:</strong> ${escapeHtml(projeto.objetivos) || '-'}
        </div>
        <div class="detail-item">
          <strong>Justificativa:</strong> ${escapeHtml(projeto.justificativa) || '-'}
        </div>
        <div class="detail-item">
          <strong>Metas e Resultados:</strong> ${escapeHtml(projeto.metas_resultados) || '-'}
        </div>
      </div>

      <div class="detail-section">
        <h4>Público e Acessibilidade</h4>
        <div class="detail-item">
          <strong>Perfil do público:</strong> ${escapeHtml(projeto.perfil_publico) || '-'}
        </div>
        <div class="detail-item">
          <strong>Estimativa de público:</strong> ${escapeHtml(projeto.estimativa_publico) || '-'}
        </div>
        <div class="detail-item">
          <strong>Estruturas de acessibilidade:</strong> ${escapeHtml(projeto.estruturas_acessibilidade) || '-'}
        </div>
        <div class="detail-item">
          <strong>Lei Distrital 6.858/2021:</strong> ${projeto.lei_acessibilidade_visual ? '✅ Atendido' : '❌ Não atendimento'}
        </div>
      </div>

      <div class="detail-section">
        <h4>Parâmetros</h4>
        <div class="detail-item">
          <strong>Cobrança de ingresso:</strong> ${projeto.cobranca_ingresso ? 'Sim' : 'Não'}
        </div>
        <div class="detail-item">
          <strong>Arrecadação de alimentos:</strong> ${projeto.arrecadacao_alimentos ? 'Sim' : 'Não'}
        </div>
        <div class="detail-item">
          <strong>Comercialização de produtos:</strong> ${projeto.comercializacao_produtos ? 'Sim' : 'Não'}
        </div>
        <div class="detail-item">
          <strong>Recursos de outras fontes:</strong> ${projeto.recursos_outras_fontes ? 'Sim' : 'Não'}
        </div>
        <div class="detail-item">
          <strong>Período de Execução:</strong> ${projeto.periodo_execucao_inicio && projeto.periodo_execucao_fim 
            ? `${formatDate(projeto.periodo_execucao_inicio)} até ${formatDate(projeto.periodo_execucao_fim)}` 
            : '-'}
        </div>
      </div>

      ${projeto.ficha_tecnica && projeto.ficha_tecnica.length > 0 ? `
        <div class="detail-section">
          <h4>Equipe Técnica (${projeto.ficha_tecnica.length} profissionais)</h4>
          <table class="data-table">
            <thead>
              <tr>
                <th>Profissional/Empresa</th>
                <th>Função</th>
                <th>CPF/CNPJ</th>
              </tr>
            </thead>
            <tbody>
              ${projeto.ficha_tecnica.map(item => `
                <tr>
                  <td>${escapeHtml(item.nome_profissional)}</td>
                  <td>${escapeHtml(item.funcao)}</td>
                  <td>${escapeHtml(item.cpf_cnpj)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      ${projeto.plano_comunicacao && projeto.plano_comunicacao.length > 0 ? `
        <div class="detail-section">
          <h4>Plano de Comunicação (${projeto.plano_comunicacao.length} itens)</h4>
          <table class="data-table">
            <thead>
              <tr>
                <th>Item/Serviço</th>
                <th>Formato/Suporte</th>
                <th>Quantidade/Período</th>
                <th>Veículo/Circulação</th>
              </tr>
            </thead>
            <tbody>
              ${projeto.plano_comunicacao.map(item => `
                <tr>
                  <td>${escapeHtml(item.item_servico)}</td>
                  <td>${escapeHtml(item.formato_suporte)}</td>
                  <td>${escapeHtml(item.quantidade_periodo)}</td>
                  <td>${escapeHtml(item.veiculo_circulacao)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
    </div>
  `;

  // Atualizar botões do modal
  document.getElementById('editProjectBtn').onclick = () => {
    fecharModal();
    editarProjeto(id);
  };

  document.getElementById('deleteProjectBtn').onclick = () => {
    if (confirm('Tem certeza que deseja excluir este projeto?')) {
      excluirProjeto(id);
      fecharModal();
    }
  };

  abrirModal();
}

function editarProjeto(id) {
  const projetos = JSON.parse(localStorage.getItem('projetos') || '[]');
  const projeto = projetos.find(p => p.id === id);
  
  if (!projeto) {
    showToast('Projeto não encontrado', 'error');
    return;
  }
  
  currentProjectId = id;

  // Preencher dados básicos
  document.getElementById('quemElaborou').value = projeto.quem_elaborou || '';
  document.getElementById('nomeProjeto').value = projeto.nome_projeto || '';
  document.getElementById('objetoProjeto').value = projeto.objeto_projeto || '';
  document.getElementById('objetivos').value = projeto.objetivos || '';
  document.getElementById('justificativa').value = projeto.justificativa || '';
  document.getElementById('metasResultados').value = projeto.metas_resultados || '';
  document.getElementById('perfilPublico').value = projeto.perfil_publico || '';
  document.getElementById('estimativaPublico').value = projeto.estimativa_publico || '';
  document.getElementById('estruturasAcessibilidade').value = projeto.estruturas_acessibilidade || '';
  document.getElementById('leiAcessibilidadeVisual').checked = projeto.lei_acessibilidade_visual === true;
  document.getElementById('cobrancaIngresso').checked = projeto.cobranca_ingresso === true;
  document.getElementById('arrecadacaoAlimentos').checked = projeto.arrecadacao_alimentos === true;
  document.getElementById('comercializacaoProdutos').checked = projeto.comercializacao_produtos === true;
  document.getElementById('recursosOutrasFontes').checked = projeto.recursos_outras_fontes === true;
  document.getElementById('periodoInicio').value = projeto.periodo_execucao_inicio || '';
  document.getElementById('periodoFim').value = projeto.periodo_execucao_fim || '';

  // Carregar dados das tabelas
  fichaTecnicaData = (projeto.ficha_tecnica || []).map(item => ({
    id: item.id || generateId(),
    nome_profissional: item.nome_profissional,
    funcao: item.funcao,
    cpf_cnpj: item.cpf_cnpj
  }));

  planoComunicacaoData = (projeto.plano_comunicacao || []).map(item => ({
    id: item.id || generateId(),
    item_servico: item.item_servico,
    formato_suporte: item.formato_suporte,
    quantidade_periodo: item.quantidade_periodo,
    veiculo_circulacao: item.veiculo_circulacao
  }));

  atualizarTabelas();

  // Ir para a página de edição
  navigateToPage('novo-projeto');
  showToast('Projeto carregado para edição', 'success');
}

function excluirProjeto(id) {
  if (!confirm('Tem certeza que deseja excluir este projeto?')) {
    return;
  }

  let projetos = JSON.parse(localStorage.getItem('projetos') || '[]');
  projetos = projetos.filter(p => p.id !== id);
  localStorage.setItem('projetos', JSON.stringify(projetos));
  
  showToast('Projeto excluído com sucesso!', 'success');
  carregarEstatisticas();
  carregarProjetosRecentes();
  carregarTodosProjetos();
}

// ============================================
// FILTROS
// ============================================

function setupFilters() {
  const searchInput = document.getElementById('searchProjetos');
  const filterStatus = document.getElementById('filterStatus');

  searchInput.addEventListener('input', filtrarProjetos);
  filterStatus.addEventListener('change', filtrarProjetos);
}

function filtrarProjetos() {
  const searchTerm = document.getElementById('searchProjetos').value.toLowerCase();
  const statusFilter = document.getElementById('filterStatus').value;

  let projetos = JSON.parse(localStorage.getItem('projetos') || '[]');

  // Aplicar filtro de busca
  if (searchTerm) {
    projetos = projetos.filter(p => 
      p.nome_projeto.toLowerCase().includes(searchTerm) ||
      p.quem_elaborou.toLowerCase().includes(searchTerm)
    );
  }

  // Aplicar filtro de status
  if (statusFilter) {
    projetos = projetos.filter(p => p.status === statusFilter);
  }

  const tbody = document.getElementById('allProjectsBody');

  if (projetos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <div class="empty-state-icon">📭</div>
          <p>Nenhum projeto encontrado</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = projetos.map(projeto => `
    <tr>
      <td><strong>${escapeHtml(projeto.nome_projeto)}</strong></td>
      <td>${escapeHtml(projeto.quem_elaborou)}</td>
      <td>${projeto.periodo_execucao_inicio && projeto.periodo_execucao_fim 
        ? `${formatDate(projeto.periodo_execucao_inicio)} - ${formatDate(projeto.periodo_execucao_fim)}` 
        : '-'}</td>
      <td><span class="status-badge ${projeto.status}">${projeto.status === 'rascunho' ? 'Rascunho' : 'Finalizado'}</span></td>
      <td>${formatDate(projeto.data_cadastro)}</td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-primary btn-sm" onclick="visualizarProjeto('${projeto.id}')">👁️</button>
          <button class="btn btn-secondary btn-sm" onclick="editarProjeto('${projeto.id}')">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="excluirProjeto('${projeto.id}')">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ============================================
// MODAL
// ============================================

function setupModal() {
  const modal = document.getElementById('projectModal');

  document.getElementById('closeModal').addEventListener('click', fecharModal);
  document.getElementById('closeModalBtn').addEventListener('click', fecharModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      fecharModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      fecharModal();
    }
  });
}

function abrirModal() {
  document.getElementById('projectModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function fecharModal() {
  document.getElementById('projectModal').classList.remove('active');
  document.body.style.overflow = '';
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  toast.innerHTML = `
    <span>${icons[type] || icons.info}</span>
    <span>${escapeHtml(message)}</span>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'toastSlideIn 0.3s ease reverse';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

function generateId() {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getStatusLabel(status) {
  const statusMap = {
    'rascunho': '📝 Rascunho',
    'escrito': '📝 Escrito',
    'aprovado': '✅ Aprovado',
    'em_execucao': '🚀 Em Execução',
    'prestacao_contas': '📊 Prestação de Contas',
    'finalizado': '✅ Finalizado'
  };
  return statusMap[status] || status;
}

function toggleFormReadonly(readonly) {
  const inputs = document.querySelectorAll('#projectForm input, #projectForm textarea, #projectForm select');
  inputs.forEach(input => {
    input.readOnly = readonly;
    input.disabled = readonly;
  });
  
  const buttons = document.querySelectorAll('#projectForm button');
  buttons.forEach(button => {
    button.disabled = readonly;
  });
}

// ============================================
// PROFISSIONAIS
// ============================================

function carregarProfissionais() {
  const profissionais = JSON.parse(localStorage.getItem('profissionais') || '[]');
  const tbody = document.getElementById('profissionaisBody');

  if (profissionais.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          <div class="empty-state-icon">👥</div>
          <p>Nenhum profissional cadastrado</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = profissionais.map(prof => `
    <tr>
      <td><strong>${escapeHtml(prof.nome)}</strong></td>
      <td>${escapeHtml(prof.telefone)}</td>
      <td>${escapeHtml(prof.ceac) || '-'}</td>
      <td>${prof.validade_ceac ? formatDate(prof.validade_ceac) : '-'}</td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-primary btn-sm" onclick="visualizarProfissional('${prof.id}')">👁️</button>
          <button class="btn btn-secondary btn-sm" onclick="editarProfissional('${prof.id}')">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="excluirProfissional('${prof.id}')">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function salvarProfissional() {
  const profissionalData = {
    id: currentProfissionalId || generateId(),
    nome: document.getElementById('profNome').value,
    telefone: document.getElementById('profTelefone').value,
    endereco: document.getElementById('profEndereco').value,
    data_nascimento: document.getElementById('profDataNascimento').value,
    rg: document.getElementById('profRg').value,
    cpf: document.getElementById('profCpf').value,
    ceac: document.getElementById('profCeac').value,
    validade_ceac: document.getElementById('profValidadeCeac').value,
    projetos: document.getElementById('profProjetos').value,
    data_cadastro: new Date().toISOString()
  };

  let profissionais = JSON.parse(localStorage.getItem('profissionais') || '[]');
  
  if (currentProfissionalId) {
    const index = profissionais.findIndex(p => p.id === currentProfissionalId);
    if (index !== -1) {
      profissionais[index] = { ...profissionais[index], ...profissionalData };
    }
  } else {
    profissionais.push(profissionalData);
  }
  
  localStorage.setItem('profissionais', JSON.stringify(profissionais));
  
  showToast('Profissional salvo com sucesso!', 'success');
  resetProfissionalForm();
  currentProfissionalId = null;
  navigateToPage('profissionais');
}

function editarProfissional(id) {
  const profissionais = JSON.parse(localStorage.getItem('profissionais') || '[]');
  const profissional = profissionais.find(p => p.id === id);
  
  if (!profissional) {
    showToast('Profissional não encontrado', 'error');
    return;
  }
  
  currentProfissionalId = id;
  
  document.getElementById('profNome').value = profissional.nome || '';
  document.getElementById('profTelefone').value = profissional.telefone || '';
  document.getElementById('profEndereco').value = profissional.endereco || '';
  document.getElementById('profDataNascimento').value = profissional.data_nascimento || '';
  document.getElementById('profRg').value = profissional.rg || '';
  document.getElementById('profCpf').value = profissional.cpf || '';
  document.getElementById('profCeac').value = profissional.ceac || '';
  document.getElementById('profValidadeCeac').value = profissional.validade_ceac || '';
  document.getElementById('profProjetos').value = profissional.projetos || '';
  
  document.getElementById('profissionalFormTitle').textContent = 'Editar Profissional';
  navigateToPage('novo-profissional');
  showToast('Profissional carregado para edição', 'success');
}

function excluirProfissional(id) {
  if (!confirm('Tem certeza que deseja excluir este profissional?')) {
    return;
  }

  let profissionais = JSON.parse(localStorage.getItem('profissionais') || '[]');
  profissionais = profissionais.filter(p => p.id !== id);
  localStorage.setItem('profissionais', JSON.stringify(profissionais));
  
  showToast('Profissional excluído com sucesso!', 'success');
  carregarProfissionais();
}

function visualizarProfissional(id) {
  const profissionais = JSON.parse(localStorage.getItem('profissionais') || '[]');
  const profissional = profissionais.find(p => p.id === id);
  
  if (!profissional) {
    showToast('Profissional não encontrado', 'error');
    return;
  }
  
  const modalTitle = document.getElementById('modalProjectTitle');
  const modalBody = document.getElementById('modalBody');

  modalTitle.textContent = profissional.nome;

  modalBody.innerHTML = `
    <div class="project-details">
      <div class="detail-section">
        <h4>Dados Pessoais</h4>
        <div class="detail-item">
          <strong>Nome:</strong> ${escapeHtml(profissional.nome)}
        </div>
        <div class="detail-item">
          <strong>Telefone:</strong> ${escapeHtml(profissional.telefone)}
        </div>
        <div class="detail-item">
          <strong>Endereço:</strong> ${escapeHtml(profissional.endereco) || '-'}
        </div>
        <div class="detail-item">
          <strong>Data de Nascimento:</strong> ${profissional.data_nascimento ? formatDate(profissional.data_nascimento) : '-'}
        </div>
        <div class="detail-item">
          <strong>RG:</strong> ${escapeHtml(profissional.rg) || '-'}
        </div>
        <div class="detail-item">
          <strong>CPF:</strong> ${escapeHtml(profissional.cpf) || '-'}
        </div>
      </div>

      <div class="detail-section">
        <h4>CEAC</h4>
        <div class="detail-item">
          <strong>Número:</strong> ${escapeHtml(profissional.ceac) || '-'}
        </div>
        <div class="detail-item">
          <strong>Validade:</strong> ${profissional.validade_ceac ? formatDate(profissional.validade_ceac) : '-'}
        </div>
      </div>

      <div class="detail-section">
        <h4>Projetos</h4>
        <div class="detail-item">
          ${escapeHtml(profissional.projetos) || 'Nenhum projeto informado'}
        </div>
      </div>
    </div>
  `;

  document.getElementById('editProjectBtn').onclick = () => {
    fecharModal();
    editarProfissional(id);
  };

  document.getElementById('deleteProjectBtn').onclick = () => {
    if (confirm('Tem certeza que deseja excluir este profissional?')) {
      excluirProfissional(id);
      fecharModal();
    }
  };

  abrirModal();
}

function resetProfissionalForm() {
  document.getElementById('profissionalForm').reset();
  currentProfissionalId = null;
  document.getElementById('profissionalFormTitle').textContent = 'Cadastrar Novo Profissional';
  
  // Limpar arquivos anexados
  document.getElementById('comprovanteResidenciaFile').style.display = 'none';
  document.getElementById('documentoOficialFile').style.display = 'none';
}

function setupDocumentUploads() {
  setupDocumentUpload('comprovanteResidenciaUpload', 'comprovante_residencia', 'comprovanteResidenciaFile');
  setupDocumentUpload('documentoOficialUpload', 'documento_oficial', 'documentoOficialFile');
}

function setupDocumentUpload(areaId, inputName, fileDisplayId) {
  const area = document.getElementById(areaId);
  const input = area.querySelector(`input[name="${inputName}"]`);
  const fileDisplay = document.getElementById(fileDisplayId);

  area.addEventListener('click', () => {
    input.click();
  });

  area.addEventListener('dragover', (e) => {
    e.preventDefault();
    area.classList.add('dragover');
  });

  area.addEventListener('dragleave', () => {
    area.classList.remove('dragover');
  });

  area.addEventListener('drop', (e) => {
    e.preventDefault();
    area.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleDocumentUpload(e.dataTransfer.files[0], fileDisplay);
    }
  });

  input.addEventListener('change', () => {
    if (input.files.length > 0) {
      handleDocumentUpload(input.files[0], fileDisplay);
    }
  });
}

function handleDocumentUpload(file, fileDisplay) {
  const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!validTypes.includes(file.type)) {
    showToast('Tipo de arquivo não suportado. Use PDF, JPG ou PNG.', 'error');
    return;
  }

  if (file.size > maxSize) {
    showToast('Arquivo muito grande. Máximo 5MB.', 'error');
    return;
  }

  // Simular upload (em produção, enviaria para servidor)
  const reader = new FileReader();
  reader.onload = (e) => {
    fileDisplay.innerHTML = `
      <span class="file-icon">✅</span>
      <span>${file.name}</span>
      <button type="button" class="remove-file" onclick="removeDocument('${fileDisplay.id}')">×</button>
    `;
    fileDisplay.style.display = 'flex';
    showToast('Documento anexado com sucesso', 'success');
  };
  reader.readAsDataURL(file);
}

function removeDocument(fileDisplayId) {
  document.getElementById(fileDisplayId).style.display = 'none';
  showToast('Documento removido', 'success');
}



// ============================================
// AUTENTICAÇÃO
// ============================================

function logout() {
  localStorage.removeItem('authenticated');
  window.location.href = 'login.html';
}
