import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';
import type { Database, QueryExecResult } from 'sql.js';

let dbInstance: Database | null = null;
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'estoque.sqlite');

export interface DbHelper {
  all: <T = any>(sql: string, params?: any[]) => T[];
  get: <T = any>(sql: string, params?: any[]) => T | null;
  run: (sql: string, params?: any[]) => { changes: number; lastInsertRowid: number };
  exec: (sql: string) => QueryExecResult[];
  save: () => void;
  resetDatabase: () => void;
}

export async function getDb(): Promise<DbHelper> {
  if (dbInstance) {
    return createHelper(dbInstance);
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();
  let db: Database;

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(fileBuffer);
      console.log(`[Database] Banco SQLite carregado de ${DB_FILE}`);
    } catch (err) {
      console.error('[Database] Erro ao carregar arquivo existente, recriando:', err);
      db = new SQL.Database();
      initializeSchema(db);
    }
  } else {
    console.log('[Database] Criando novo banco SQLite...');
    db = new SQL.Database();
    initializeSchema(db);
  }

  dbInstance = db;
  const helper = createHelper(db);
  helper.save();
  return helper;
}

function createHelper(db: Database): DbHelper {
  const save = () => {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_FILE, buffer);
    } catch (err) {
      console.error('[Database] Falha ao persistir banco SQLite em disco:', err);
    }
  };

  const all = <T = any>(sql: string, params: any[] = []): T[] => {
    const stmt = db.prepare(sql);
    if (params.length > 0) {
      stmt.bind(params);
    }
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as T);
    }
    stmt.free();
    return results;
  };

  const get = <T = any>(sql: string, params: any[] = []): T | null => {
    const results = all<T>(sql, params);
    return results.length > 0 ? results[0] : null;
  };

  const run = (sql: string, params: any[] = []): { changes: number; lastInsertRowid: number } => {
    db.run(sql, params);
    save();
    
    // Obter rowid inserido e número de alterações
    let lastInsertRowid = 0;
    try {
      const rowIdExec = db.exec('SELECT last_insert_rowid()');
      if (rowIdExec.length > 0 && rowIdExec[0].values.length > 0) {
        lastInsertRowid = Number(rowIdExec[0].values[0][0]) || 0;
      }
    } catch {
      // ignore
    }

    const changes = typeof db.getRowsModified === 'function' ? db.getRowsModified() : 0;
    
    return {
      lastInsertRowid,
      changes,
    };
  };

  const exec = (sql: string): QueryExecResult[] => {
    const res = db.exec(sql);
    save();
    return res;
  };

  const resetDatabase = () => {
    db.run('DROP TABLE IF EXISTS itens_requisicao;');
    db.run('DROP TABLE IF EXISTS requisicoes;');
    db.run('DROP TABLE IF EXISTS movimentacoes;');
    db.run('DROP TABLE IF EXISTS materiais;');
    db.run('DROP TABLE IF EXISTS configuracoes;');
    initializeSchema(db);
    save();
  };

  return { all, get, run, exec, save, resetDatabase };
}

export function getSchemaSql(): string {
  return `
-- ==========================================================
-- SISTEMA DE CONTROLE DE ESTOQUE & ALMOXARIFADO
-- SCRIPT DE INICIALIZAÇÃO DO BANCO RELACIONAL SQLITE
-- ==========================================================

-- 1. Tabela de Configurações Gerais e Identificação do Responsável
CREATE TABLE IF NOT EXISTS configuracoes (
  chave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  descricao TEXT,
  atualizado_em TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 2. Tabela de Materiais / Catálogo de Estoque
CREATE TABLE IF NOT EXISTS materiais (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL,
  unidade_medida TEXT NOT NULL,
  estoque_atual REAL NOT NULL DEFAULT 0,
  estoque_minimo REAL NOT NULL DEFAULT 0,
  localizacao TEXT,
  preco_unitario REAL DEFAULT 0,
  criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- 3. Tabela de Histórico de Movimentações (Entradas e Saídas)
CREATE TABLE IF NOT EXISTS movimentacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_id INTEGER NOT NULL REFERENCES materiais(id) ON DELETE RESTRICT,
  tipo TEXT NOT NULL CHECK (tipo IN ('ENTRADA', 'SAIDA')),
  quantidade REAL NOT NULL CHECK (quantidade > 0),
  motivo TEXT NOT NULL,
  documento_referencia TEXT,
  responsavel_movimentacao TEXT,
  data_movimentacao TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  saldo_anterior REAL NOT NULL,
  saldo_novo REAL NOT NULL,
  observacoes TEXT
);

-- 4. Tabela de Requisições de Material
CREATE TABLE IF NOT EXISTS requisicoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero TEXT UNIQUE NOT NULL,
  solicitante TEXT NOT NULL,
  departamento TEXT NOT NULL,
  prioridade TEXT NOT NULL DEFAULT 'MEDIA' CHECK (prioridade IN ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE')),
  status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'APROVADA', 'ATENDIDA', 'CANCELADA')),
  justificativa TEXT NOT NULL,
  data_solicitacao TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  data_atendimento TEXT,
  responsavel_atendimento TEXT,
  observacoes TEXT
);

-- 5. Tabela de Itens da Requisição
CREATE TABLE IF NOT EXISTS itens_requisicao (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requisicao_id INTEGER NOT NULL REFERENCES requisicoes(id) ON DELETE CASCADE,
  material_id INTEGER NOT NULL REFERENCES materiais(id) ON DELETE RESTRICT,
  quantidade_solicitada REAL NOT NULL CHECK (quantidade_solicitada > 0),
  quantidade_atendida REAL NOT NULL DEFAULT 0,
  observacoes TEXT
);

-- Índices de Desempenho
CREATE INDEX IF NOT EXISTS idx_movimentacoes_material ON movimentacoes(material_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_data ON movimentacoes(data_movimentacao);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_tipo ON movimentacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_requisicoes_status ON requisicoes(status);
CREATE INDEX IF NOT EXISTS idx_itens_req_requisicao ON itens_requisicao(requisicao_id);
`;
}

function initializeSchema(db: Database) {
  const schema = getSchemaSql();
  db.run(schema);

  // Inserir configurações iniciais (Responsável Técnico)
  db.run(`
    INSERT OR REPLACE INTO configuracoes (chave, valor, descricao) VALUES
    ('aluno_responsavel', 'Laura Lavínia', 'Nome do Aluno Responsável Técnico pelo Almoxarifado'),
    ('matricula_aluno', '2026.ENG.1048', 'Matrícula ou R.A. do Responsável Técnico'),
    ('curso_instituicao', 'Engenharia / Gestão Operacional', 'Curso ou Departamento Acadêmico'),
    ('nome_almoxarifado', 'Almoxarifado Central de Operações & Manutenção', 'Nome da unidade de estoque');
  `);

  // Inserir materiais iniciais realistas
  const initialMaterials = [
    { cod: 'EPI-001', nome: 'Capacete de Segurança com Jugular', desc: 'Capacete classe B para proteção contra impactos', cat: 'EPI & Segurança', un: 'UN', atual: 45, min: 20, loc: 'Prateleira A1', preco: 48.50 },
    { cod: 'EPI-002', nome: 'Luva de Vaqueta Mista', desc: 'Luva de segurança para proteção mecânica e solda', cat: 'EPI & Segurança', un: 'PAR', atual: 120, min: 50, loc: 'Prateleira A2', preco: 18.90 },
    { cod: 'EPI-003', nome: 'Óculos de Proteção Antirrisco', desc: 'Lente incolor com proteção UVA/UVB', cat: 'EPI & Segurança', un: 'UN', atual: 8, min: 25, loc: 'Prateleira A3', preco: 14.20 }, // Crítico
    { cod: 'ELT-101', nome: 'Cabo Flexível 2,5mm² 750V (Rolo 100m)', desc: 'Cabo de cobre antichama azul para fiação elétrica', cat: 'Elétrica', un: 'RL', atual: 18, min: 10, loc: 'Rack B1', preco: 185.00 },
    { cod: 'ELT-102', nome: 'Disjuntor Bipolar Din 20A Curva C', desc: 'Disjuntor termomagnético trilho DIN padrão NBR', cat: 'Elétrica', un: 'UN', atual: 5, min: 15, loc: 'Gaveteiro E1', preco: 34.90 }, // Crítico
    { cod: 'ELT-103', nome: 'Fita Isolante 19mm x 20m', desc: 'Fita isolante antichama classe A', cat: 'Elétrica', un: 'UN', atual: 65, min: 30, loc: 'Gaveteiro E2', preco: 8.50 },
    { cod: 'MEC-201', nome: 'Chave Philips 1/4 x 6 Pol', desc: 'Haste em aço cromo vanádio com ponta imantada', cat: 'Ferramentas & Mecânica', un: 'UN', atual: 14, min: 8, loc: 'Painel F1', preco: 22.00 },
    { cod: 'MEC-202', nome: 'Alicate Universal 8 Pol Isolado 1000V', desc: 'Alicate profissional para corte e aperto', cat: 'Ferramentas & Mecânica', un: 'UN', atual: 12, min: 6, loc: 'Painel F2', preco: 62.00 },
    { cod: 'MEC-203', nome: 'Disco de Corte Inox 4.1/2 x 1,0mm', desc: 'Disco abrasivo para esmerilhadeira angular', cat: 'Ferramentas & Mecânica', un: 'UN', atual: 90, min: 40, loc: 'Prateleira C1', preco: 5.80 },
    { cod: 'HID-301', nome: 'Tubo Soldável PVC 25mm 3/4 (Barra 6m)', desc: 'Tubo de água fria classe 15', cat: 'Hidráulica', un: 'BR', atual: 30, min: 15, loc: 'Tubo R1', preco: 32.50 },
    { cod: 'HID-302', nome: 'Fita Veda Rosca 18mm x 50m', desc: 'Fita de PTFE pura para vedação de conexões', cat: 'Hidráulica', un: 'UN', atual: 4, min: 12, loc: 'Gaveteiro H1', preco: 11.00 }, // Crítico
    { cod: 'LUB-401', nome: 'Óleo Desengripante Spray 300ml', desc: 'Lubrificante protetivo antiferrugem', cat: 'Consumíveis & Química', un: 'LT', atual: 28, min: 15, loc: 'Armário Q1', preco: 19.90 },
    { cod: 'ESC-501', nome: 'Papel Sulfite A4 75g (Resma 500 folhas)', desc: 'Papel alcalino multiuso para impressões operacionais', cat: 'Escritório & Adm', un: 'CX', atual: 15, min: 8, loc: 'Prateleira S1', preco: 29.90 },
  ];

  for (const m of initialMaterials) {
    db.run(
      `INSERT INTO materiais (codigo, nome, descricao, categoria, unidade_medida, estoque_atual, estoque_minimo, localizacao, preco_unitario)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [m.cod, m.nome, m.desc, m.cat, m.un, m.atual, m.min, m.loc, m.preco]
    );
  }

  // Inserir histórico inicial de movimentações
  const movs = [
    { matCod: 'EPI-001', tipo: 'ENTRADA', qtd: 50, mot: 'Recebimento de Fornecedor', doc: 'NF-89210', resp: 'Laura Lavínia', prev: 0, post: 50, date: '2026-09-10 08:30:00' },
    { matCod: 'EPI-001', tipo: 'SAIDA', qtd: 5, mot: 'Saída para Manutenção Operacional', doc: 'REQ-2026-001', resp: 'Carlos Santos', prev: 50, post: 45, date: '2026-09-12 14:15:00' },
    { matCod: 'ELT-101', tipo: 'ENTRADA', qtd: 20, mot: 'Compra Direta de Estoque', doc: 'NF-89304', resp: 'Laura Lavínia', prev: 0, post: 20, date: '2026-09-11 09:00:00' },
    { matCod: 'ELT-101', tipo: 'SAIDA', qtd: 2, mot: 'Saída para Reforma Sala de Máquinas', doc: 'REQ-2026-002', resp: 'Marcos Oliveira', prev: 20, post: 18, date: '2026-09-14 11:20:00' },
    { matCod: 'EPI-003', tipo: 'ENTRADA', qtd: 30, mot: 'Recebimento Mensal', doc: 'NF-89412', resp: 'Laura Lavínia', prev: 0, post: 30, date: '2026-09-08 10:00:00' },
    { matCod: 'EPI-003', tipo: 'SAIDA', qtd: 22, mot: 'Entrega para Turma de Soldagem', doc: 'REQ-2026-003', resp: 'Laura Lavínia', prev: 30, post: 8, date: '2026-09-16 16:45:00' },
    { matCod: 'MEC-203', tipo: 'ENTRADA', qtd: 100, mot: 'Reposição Periódica', doc: 'NF-89550', resp: 'Laura Lavínia', prev: 0, post: 100, date: '2026-09-13 13:00:00' },
    { matCod: 'MEC-203', tipo: 'SAIDA', qtd: 10, mot: 'Uso na Oficina de Serralheria', doc: 'REQ-2026-004', resp: 'João Silva', prev: 100, post: 90, date: '2026-09-17 10:15:00' },
  ];

  for (const mv of movs) {
    // Buscar id do material
    const res = db.exec(`SELECT id FROM materiais WHERE codigo = '${mv.matCod}'`);
    if (res.length > 0 && res[0].values.length > 0) {
      const matId = res[0].values[0][0];
      db.run(
        `INSERT INTO movimentacoes (material_id, tipo, quantidade, motivo, documento_referencia, responsavel_movimentacao, data_movimentacao, saldo_anterior, saldo_novo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [matId, mv.tipo, mv.qtd, mv.mot, mv.doc, mv.resp, mv.date, mv.prev, mv.post]
      );
    }
  }

  // Inserir Requisições iniciais de exemplo
  db.run(`
    INSERT INTO requisicoes (numero, solicitante, departamento, prioridade, status, justificativa, data_solicitacao, data_atendimento, responsavel_atendimento)
    VALUES 
    ('REQ-2026-001', 'Carlos Santos (Técnico Mecânico)', 'Manutenção Preventiva', 'ALTA', 'ATENDIDA', 'Atendimento para troca de EPIs da equipe do turno matutino', '2026-09-12 13:50:00', '2026-09-12 14:15:00', 'Laura Lavínia'),
    ('REQ-2026-002', 'Marcos Oliveira (Eletricista)', 'Instalações Elétricas', 'MEDIA', 'ATENDIDA', 'Fiação da linha de alimentação secundária do galpão B', '2026-09-14 10:30:00', '2026-09-14 11:20:00', 'Laura Lavínia'),
    ('REQ-2026-003', 'Profª Mariana Duarte', 'Laboratório de Solda', 'URGENTE', 'ATENDIDA', 'Distribuição obrigatória de óculos para aula prática', '2026-09-16 15:20:00', '2026-09-16 16:45:00', 'Laura Lavínia'),
    ('REQ-2026-004', 'Roberto Mendes (Almoxarife Jr)', 'Oficina Geral', 'MEDIA', 'ATENDIDA', 'Reposição de consumíveis de corte para serra policorte', '2026-09-17 09:40:00', '2026-09-17 10:15:00', 'Laura Lavínia'),
    ('REQ-2026-005', 'Juliana Ramos (Engenharia Civil)', 'Obras & Infraestrutura', 'ALTA', 'PENDENTE', 'Solicitação de materiais para reforma hidráulica e elétrica do bloco 3', '2026-09-18 08:30:00', NULL, NULL);
  `);

  // Itens da requisição REQ-2026-005 (Pendente)
  const req5Res = db.exec("SELECT id FROM requisicoes WHERE numero = 'REQ-2026-005'");
  if (req5Res.length > 0 && req5Res[0].values.length > 0) {
    const req5Id = req5Res[0].values[0][0];
    const matTubos = db.exec("SELECT id FROM materiais WHERE codigo = 'HID-301'")[0]?.values[0][0];
    const matFita = db.exec("SELECT id FROM materiais WHERE codigo = 'HID-302'")[0]?.values[0][0];
    const matDisj = db.exec("SELECT id FROM materiais WHERE codigo = 'ELT-102'")[0]?.values[0][0];

    if (matTubos) db.run('INSERT INTO itens_requisicao (requisicao_id, material_id, quantidade_solicitada, quantidade_atendida) VALUES (?, ?, ?, ?)', [req5Id, matTubos, 5, 0]);
    if (matFita) db.run('INSERT INTO itens_requisicao (requisicao_id, material_id, quantidade_solicitada, quantidade_atendida) VALUES (?, ?, ?, ?)', [req5Id, matFita, 2, 0]);
    if (matDisj) db.run('INSERT INTO itens_requisicao (requisicao_id, material_id, quantidade_solicitada, quantidade_atendida) VALUES (?, ?, ?, ?)', [req5Id, matDisj, 2, 0]);
  }

  // Itens da requisição REQ-2026-001 (Atendida)
  const req1Res = db.exec("SELECT id FROM requisicoes WHERE numero = 'REQ-2026-001'");
  if (req1Res.length > 0 && req1Res[0].values.length > 0) {
    const req1Id = req1Res[0].values[0][0];
    const matCapacete = db.exec("SELECT id FROM materiais WHERE codigo = 'EPI-001'")[0]?.values[0][0];
    if (matCapacete) db.run('INSERT INTO itens_requisicao (requisicao_id, material_id, quantidade_solicitada, quantidade_atendida) VALUES (?, ?, ?, ?)', [req1Id, matCapacete, 5, 5]);
  }
}
