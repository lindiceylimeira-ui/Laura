import express, { Request, Response } from 'express';
import { getDb, getSchemaSql } from './db.js';

export const apiRouter = express.Router();

// ==========================================
// 1. CONFIGURAÇÕES & IDENTIFICAÇÃO DO RESPONSÁVEL
// ==========================================
apiRouter.get('/config', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const rows = db.all<{ chave: string; valor: string; descricao: string }>('SELECT chave, valor, descricao FROM configuracoes');
    const configMap: Record<string, string> = {};
    for (const r of rows) {
      configMap[r.chave] = r.valor;
    }
    res.json({
      aluno_responsavel: configMap['aluno_responsavel'] || 'Laura Lavínia',
      matricula_aluno: configMap['matricula_aluno'] || '2026.ENG.1048',
      curso_instituicao: configMap['curso_instituicao'] || 'Engenharia / Gestão Operacional',
      nome_almoxarifado: configMap['nome_almoxarifado'] || 'Almoxarifado Central de Operações & Manutenção',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao obter configurações: ' + err.message });
  }
});

apiRouter.put('/config', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { aluno_responsavel, matricula_aluno, curso_instituicao, nome_almoxarifado } = req.body;

    if (aluno_responsavel) {
      db.run("INSERT OR REPLACE INTO configuracoes (chave, valor) VALUES ('aluno_responsavel', ?)", [aluno_responsavel]);
    }
    if (matricula_aluno) {
      db.run("INSERT OR REPLACE INTO configuracoes (chave, valor) VALUES ('matricula_aluno', ?)", [matricula_aluno]);
    }
    if (curso_instituicao) {
      db.run("INSERT OR REPLACE INTO configuracoes (chave, valor) VALUES ('curso_instituicao', ?)", [curso_instituicao]);
    }
    if (nome_almoxarifado) {
      db.run("INSERT OR REPLACE INTO configuracoes (chave, valor) VALUES ('nome_almoxarifado', ?)", [nome_almoxarifado]);
    }

    res.json({ success: true, message: 'Configurações atualizadas com sucesso' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao atualizar configurações: ' + err.message });
  }
});

// ==========================================
// 2. GESTÃO DE MATERIAIS
// ==========================================
apiRouter.get('/materiais', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { busca, categoria, apenas_criticos } = req.query;

    let sql = `
      SELECT 
        m.*,
        CASE 
          WHEN m.estoque_atual <= 0 THEN 'CRITICO'
          WHEN m.estoque_atual <= m.estoque_minimo THEN 'ALERTA'
          WHEN m.estoque_atual > (m.estoque_minimo * 3) THEN 'EXCESSO'
          ELSE 'NORMAL'
        END AS status_estoque,
        ROUND(m.estoque_atual * m.preco_unitario, 2) AS valor_total_estoque
      FROM materiais m
      WHERE 1=1
    `;
    const params: any[] = [];

    if (busca && typeof busca === 'string') {
      sql += ' AND (m.nome LIKE ? OR m.codigo LIKE ? OR m.descricao LIKE ?)';
      params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
    }

    if (categoria && typeof categoria === 'string' && categoria !== 'TODAS') {
      sql += ' AND m.categoria = ?';
      params.push(categoria);
    }

    if (apenas_criticos === 'true') {
      sql += ' AND m.estoque_atual <= m.estoque_minimo';
    }

    sql += ' ORDER BY m.nome ASC';

    const materiais = db.all(sql, params);
    res.json(materiais);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao listar materiais: ' + err.message });
  }
});

apiRouter.post('/materiais', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { codigo, nome, descricao, categoria, unidade_medida, estoque_atual, estoque_minimo, localizacao, preco_unitario } = req.body;

    if (!codigo || !nome || !categoria || !unidade_medida) {
      return res.status(400).json({ error: 'Código, nome, categoria e unidade de medida são obrigatórios' });
    }

    // Verificar se código já existe
    const existing = db.get('SELECT id FROM materiais WHERE codigo = ?', [codigo]);
    if (existing) {
      return res.status(400).json({ error: `Já existe um material cadastrado com o código ${codigo}` });
    }

    const initialStock = Number(estoque_atual) || 0;
    const minStock = Number(estoque_minimo) || 0;
    const price = Number(preco_unitario) || 0;

    const result = db.run(
      `INSERT INTO materiais (codigo, nome, descricao, categoria, unidade_medida, estoque_atual, estoque_minimo, localizacao, preco_unitario)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [codigo.toUpperCase().trim(), nome.trim(), descricao || '', categoria.trim(), unidade_medida.toUpperCase().trim(), initialStock, minStock, localizacao || '', price]
    );

    // Se houver estoque inicial maior que zero, registrar movimentação inicial de saldo
    if (initialStock > 0) {
      db.run(
        `INSERT INTO movimentacoes (material_id, tipo, quantidade, motivo, documento_referencia, responsavel_movimentacao, saldo_anterior, saldo_novo)
         VALUES (?, 'ENTRADA', ?, 'Implantação de Saldo Inicial', 'INVENTÁRIO-INICIAL', 'Sistema / Almoxarifado', 0, ?)`,
        [result.lastInsertRowid, initialStock, initialStock]
      );
    }

    res.status(201).json({ success: true, id: result.lastInsertRowid, message: 'Material cadastrado com sucesso' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao cadastrar material: ' + err.message });
  }
});

apiRouter.put('/materiais/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const id = Number(req.params.id);
    const { nome, descricao, categoria, unidade_medida, estoque_minimo, localizacao, preco_unitario } = req.body;

    const existing = db.get('SELECT id FROM materiais WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Material não encontrado' });
    }

    db.run(
      `UPDATE materiais 
       SET nome = ?, descricao = ?, categoria = ?, unidade_medida = ?, estoque_minimo = ?, localizacao = ?, preco_unitario = ?
       WHERE id = ?`,
      [nome.trim(), descricao || '', categoria.trim(), unidade_medida.toUpperCase().trim(), Number(estoque_minimo) || 0, localizacao || '', Number(preco_unitario) || 0, id]
    );

    res.json({ success: true, message: 'Material atualizado com sucesso' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao atualizar material: ' + err.message });
  }
});

apiRouter.delete('/materiais/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const id = Number(req.params.id);

    const movCount = db.get<{ count: number }>('SELECT COUNT(*) as count FROM movimentacoes WHERE material_id = ?', [id]);
    if (movCount && movCount.count > 0) {
      return res.status(400).json({ error: `Não é possível excluir este material pois ele possui ${movCount.count} movimentação(ões) registrada(s). Para zerar, lance uma saída de ajuste.` });
    }

    db.run('DELETE FROM materiais WHERE id = ?', [id]);
    res.json({ success: true, message: 'Material excluído com sucesso' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao excluir material: ' + err.message });
  }
});

// ==========================================
// 3. MOVIMENTAÇÕES DE ESTOQUE (ENTRADAS E SAÍDAS)
// ==========================================
apiRouter.get('/movimentacoes', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { tipo, material_id, limite } = req.query;

    let sql = `
      SELECT 
        m.id,
        m.material_id,
        m.tipo,
        m.quantidade,
        m.motivo,
        m.documento_referencia,
        m.responsavel_movimentacao,
        m.data_movimentacao,
        m.saldo_anterior,
        m.saldo_novo,
        m.observacoes,
        mat.codigo AS material_codigo,
        mat.nome AS material_nome,
        mat.unidade_medida AS material_unidade,
        mat.categoria AS material_categoria
      FROM movimentacoes m
      JOIN materiais mat ON mat.id = m.material_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (tipo && (tipo === 'ENTRADA' || tipo === 'SAIDA')) {
      sql += ' AND m.tipo = ?';
      params.push(tipo);
    }

    if (material_id) {
      sql += ' AND m.material_id = ?';
      params.push(Number(material_id));
    }

    sql += ' ORDER BY m.data_movimentacao DESC, m.id DESC';

    if (limite) {
      sql += ' LIMIT ?';
      params.push(Number(limite));
    }

    const rows = db.all(sql, params);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao listar movimentações: ' + err.message });
  }
});

apiRouter.post('/movimentacoes', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { material_id, tipo, quantidade, motivo, documento_referencia, responsavel_movimentacao, observacoes, data_movimentacao } = req.body;

    if (!material_id || !tipo || !quantidade || !motivo) {
      return res.status(400).json({ error: 'Material, tipo (ENTRADA/SAIDA), quantidade e motivo são obrigatórios' });
    }

    const qtd = Number(quantidade);
    if (isNaN(qtd) || qtd <= 0) {
      return res.status(400).json({ error: 'A quantidade deve ser um número positivo maior que zero' });
    }

    if (tipo !== 'ENTRADA' && tipo !== 'SAIDA') {
      return res.status(400).json({ error: "O tipo de movimentação deve ser 'ENTRADA' ou 'SAIDA'" });
    }

    // Buscar material e saldo atual
    const material = db.get<any>('SELECT * FROM materiais WHERE id = ?', [Number(material_id)]);
    if (!material) {
      return res.status(404).json({ error: 'Material selecionado não foi encontrado' });
    }

    const saldoAnterior = Number(material.estoque_atual);
    let saldoNovo: number;

    if (tipo === 'SAIDA') {
      if (saldoAnterior < qtd) {
        return res.status(400).json({
          error: `Saldo insuficiente! Saldo atual disponível: ${saldoAnterior} ${material.unidade_medida}. Quantidade solicitada para saída: ${qtd} ${material.unidade_medida}.`,
        });
      }
      saldoNovo = saldoAnterior - qtd;
    } else {
      saldoNovo = saldoAnterior + qtd;
    }

    // Obter responsável padrão se não informado
    let resp = responsavel_movimentacao;
    if (!resp) {
      const cfgResp = db.get<{ valor: string }>("SELECT valor FROM configuracoes WHERE chave = 'aluno_responsavel'");
      resp = cfgResp?.valor || 'Almoxarife Responsável';
    }

    // Formatar data se enviada
    const dataHora = data_movimentacao ? data_movimentacao : new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Inserir movimentação
    const insertRes = db.run(
      `INSERT INTO movimentacoes (
        material_id, tipo, quantidade, motivo, documento_referencia, responsavel_movimentacao, data_movimentacao, saldo_anterior, saldo_novo, observacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [material.id, tipo, qtd, motivo.trim(), documento_referencia || '', resp.trim(), dataHora, saldoAnterior, saldoNovo, observacoes || '']
    );

    // Atualizar saldo do material
    db.run('UPDATE materiais SET estoque_atual = ? WHERE id = ?', [saldoNovo, material.id]);

    res.status(201).json({
      success: true,
      id: insertRes.lastInsertRowid,
      saldo_anterior: saldoAnterior,
      saldo_novo: saldoNovo,
      message: `Movimentação de ${tipo} de ${qtd} ${material.unidade_medida} registrada com sucesso. Novo saldo: ${saldoNovo} ${material.unidade_medida}.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao registrar movimentação: ' + err.message });
  }
});

// ==========================================
// 4. REQUISIÇÕES DE MATERIAL
// ==========================================
apiRouter.get('/requisicoes', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { status } = req.query;

    let sql = `
      SELECT 
        r.*,
        COUNT(i.id) as total_itens,
        SUM(i.quantidade_solicitada) as total_qtd_solicitada,
        SUM(i.quantidade_atendida) as total_qtd_atendida
      FROM requisicoes r
      LEFT JOIN itens_requisicao i ON i.requisicao_id = r.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && typeof status === 'string' && status !== 'TODAS') {
      sql += ' AND r.status = ?';
      params.push(status);
    }

    sql += ' GROUP BY r.id ORDER BY r.data_solicitacao DESC, r.id DESC';

    const requisicoes = db.all(sql, params);

    // Obter itens para cada requisição para facilidade do frontend
    for (const reqItem of requisicoes) {
      reqItem.itens = db.all(
        `SELECT 
          i.*,
          m.codigo as material_codigo,
          m.nome as material_nome,
          m.unidade_medida as material_unidade,
          m.estoque_atual as material_estoque_atual
         FROM itens_requisicao i
         JOIN materiais m ON m.id = i.material_id
         WHERE i.requisicao_id = ?`,
        [reqItem.id]
      );
    }

    res.json(requisicoes);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao listar requisições: ' + err.message });
  }
});

apiRouter.get('/requisicoes/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const id = Number(req.params.id);

    const reqItem = db.get('SELECT * FROM requisicoes WHERE id = ?', [id]);
    if (!reqItem) {
      return res.status(404).json({ error: 'Requisição não encontrada' });
    }

    const itens = db.all(
      `SELECT 
        i.*,
        m.codigo as material_codigo,
        m.nome as material_nome,
        m.unidade_medida as material_unidade,
        m.estoque_atual as material_estoque_atual,
        m.localizacao as material_localizacao
       FROM itens_requisicao i
       JOIN materiais m ON m.id = i.material_id
       WHERE i.requisicao_id = ?`,
      [id]
    );

    // Obter dados do responsável técnico
    const configResp = db.get<{ valor: string }>("SELECT valor FROM configuracoes WHERE chave = 'aluno_responsavel'");
    const configMatr = db.get<{ valor: string }>("SELECT valor FROM configuracoes WHERE chave = 'matricula_aluno'");
    const configAlmox = db.get<{ valor: string }>("SELECT valor FROM configuracoes WHERE chave = 'nome_almoxarifado'");

    res.json({
      ...reqItem,
      itens,
      responsavel_tecnico: configResp?.valor || 'Laura Lavínia',
      matricula_responsavel: configMatr?.valor || '2026.ENG.1048',
      nome_almoxarifado: configAlmox?.valor || 'Almoxarifado Central de Operações & Manutenção',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao obter requisição: ' + err.message });
  }
});

apiRouter.post('/requisicoes', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { solicitante, departamento, prioridade, justificativa, itens, observacoes } = req.body;

    if (!solicitante || !departamento || !justificativa) {
      return res.status(400).json({ error: 'Solicitante, departamento e justificativa são obrigatórios' });
    }

    if (!Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ error: 'A requisição deve conter ao menos 1 item solicitado' });
    }

    // Gerar número sequencial único REQ-ANO-XXX
    const anoAtual = new Date().getFullYear();
    const ultSeq = db.get<{ maxId: number }>('SELECT COALESCE(MAX(id), 0) as maxId FROM requisicoes');
    const proximoNum = (ultSeq?.maxId || 0) + 1;
    const numero = `REQ-${anoAtual}-${String(proximoNum).padStart(3, '0')}`;

    // Inserir cabeçalho da requisição
    const reqRes = db.run(
      `INSERT INTO requisicoes (numero, solicitante, departamento, prioridade, status, justificativa, observacoes)
       VALUES (?, ?, ?, ?, 'PENDENTE', ?, ?)`,
      [numero, solicitante.trim(), departamento.trim(), prioridade || 'MEDIA', justificativa.trim(), observacoes || '']
    );

    const requisicaoId = reqRes.lastInsertRowid;

    // Inserir itens
    for (const item of itens) {
      const matId = Number(item.material_id);
      const qtd = Number(item.quantidade_solicitada);
      if (matId && qtd > 0) {
        db.run(
          `INSERT INTO itens_requisicao (requisicao_id, material_id, quantidade_solicitada, quantidade_atendida, observacoes)
           VALUES (?, ?, ?, 0, ?)`,
          [requisicaoId, matId, qtd, item.observacoes || '']
        );
      }
    }

    res.status(201).json({
      success: true,
      id: requisicaoId,
      numero,
      message: `Requisição ${numero} criada com sucesso com ${itens.length} item(ns).`,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao criar requisição: ' + err.message });
  }
});

// Atender requisição e baixar estoque automaticamente
apiRouter.post('/requisicoes/:id/atender', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const id = Number(req.params.id);
    const { responsavel_atendimento } = req.body;

    const reqItem = db.get<any>('SELECT * FROM requisicoes WHERE id = ?', [id]);
    if (!reqItem) {
      return res.status(404).json({ error: 'Requisição não encontrada' });
    }

    if (reqItem.status === 'ATENDIDA') {
      return res.status(400).json({ error: 'Esta requisição já foi atendida anteriormente' });
    }

    if (reqItem.status === 'CANCELADA') {
      return res.status(400).json({ error: 'Não é possível atender uma requisição cancelada' });
    }

    const itens = db.all<any>(
      `SELECT i.*, m.nome as material_nome, m.estoque_atual, m.unidade_medida
       FROM itens_requisicao i
       JOIN materiais m ON m.id = i.material_id
       WHERE i.requisicao_id = ?`,
      [id]
    );

    if (itens.length === 0) {
      return res.status(400).json({ error: 'A requisição não possui itens cadastrados' });
    }

    // Verificar se há estoque suficiente para TODOS os itens antes de prosseguir
    const faltantes: string[] = [];
    for (const item of itens) {
      const necessita = item.quantidade_solicitada - item.quantidade_atendida;
      if (necessita > 0 && item.estoque_atual < necessita) {
        faltantes.push(`${item.material_nome}: necessário ${necessita} ${item.unidade_medida}, disponível ${item.estoque_atual}`);
      }
    }

    if (faltantes.length > 0) {
      return res.status(400).json({
        error: `Estoque insuficiente para atendimento total da requisição: ${faltantes.join('; ')}`,
      });
    }

    // Obter responsável técnico
    let resp = responsavel_atendimento;
    if (!resp) {
      const cfgResp = db.get<{ valor: string }>("SELECT valor FROM configuracoes WHERE chave = 'aluno_responsavel'");
      resp = cfgResp?.valor || 'Almoxarife Responsável';
    }

    const agora = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Baixar cada item do estoque e registrar movimentação de SAÍDA
    for (const item of itens) {
      const qtdBaixar = item.quantidade_solicitada - item.quantidade_atendida;
      if (qtdBaixar > 0) {
        const saldoAnterior = Number(item.estoque_atual);
        const saldoNovo = saldoAnterior - qtdBaixar;

        // Atualizar saldo na tabela materiais
        db.run('UPDATE materiais SET estoque_atual = ? WHERE id = ?', [saldoNovo, item.material_id]);

        // Atualizar quantidade atendida no item da requisição
        db.run('UPDATE itens_requisicao SET quantidade_atendida = ? WHERE id = ?', [item.quantidade_solicitada, item.id]);

        // Inserir movimentação oficial de saída vinculada à requisição
        db.run(
          `INSERT INTO movimentacoes (
            material_id, tipo, quantidade, motivo, documento_referencia, responsavel_movimentacao, data_movimentacao, saldo_anterior, saldo_novo, observacoes
          ) VALUES (?, 'SAIDA', ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.material_id,
            qtdBaixar,
            `Atendimento Requisição ${reqItem.numero} (${reqItem.departamento} - ${reqItem.solicitante})`,
            reqItem.numero,
            resp,
            agora,
            saldoAnterior,
            saldoNovo,
            `Baixa automática via atendimento da solicitação de material ${reqItem.numero}`,
          ]
        );
      }
    }

    // Atualizar status da requisição
    db.run(
      `UPDATE requisicoes 
       SET status = 'ATENDIDA', data_atendimento = ?, responsavel_atendimento = ?
       WHERE id = ?`,
      [agora, resp, id]
    );

    res.json({
      success: true,
      message: `Requisição ${reqItem.numero} atendida com sucesso! Todos os ${itens.length} itens foram baixados do estoque e as saídas foram registradas.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao atender requisição: ' + err.message });
  }
});

apiRouter.put('/requisicoes/:id/status', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!['PENDENTE', 'APROVADA', 'CANCELADA'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    db.run('UPDATE requisicoes SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true, message: `Status da requisição alterado para ${status}` });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao alterar status: ' + err.message });
  }
});

// ==========================================
// 5. RELATÓRIOS
// ==========================================
// Posição Atual dos Estoques (quantidade disponível, status, valor)
apiRouter.get('/relatorios/posicao-estoque', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { categoria, status } = req.query;

    let sql = `
      SELECT 
        m.id,
        m.codigo,
        m.nome,
        m.descricao,
        m.categoria,
        m.unidade_medida,
        m.estoque_atual,
        m.estoque_minimo,
        m.localizacao,
        m.preco_unitario,
        ROUND(m.estoque_atual * m.preco_unitario, 2) AS valor_total,
        CASE 
          WHEN m.estoque_atual <= 0 THEN 'CRITICO'
          WHEN m.estoque_atual <= m.estoque_minimo THEN 'ALERTA'
          WHEN m.estoque_atual > (m.estoque_minimo * 3) THEN 'EXCESSO'
          ELSE 'NORMAL'
        END AS status_estoque,
        (SELECT MAX(data_movimentacao) FROM movimentacoes WHERE material_id = m.id) AS ultima_movimentacao
      FROM materiais m
      WHERE 1=1
    `;
    const params: any[] = [];

    if (categoria && typeof categoria === 'string' && categoria !== 'TODAS') {
      sql += ' AND m.categoria = ?';
      params.push(categoria);
    }

    sql += ' ORDER BY status_estoque ASC, m.nome ASC';

    let materiais = db.all(sql, params);

    if (status && typeof status === 'string' && status !== 'TODOS') {
      materiais = materiais.filter((m) => m.status_estoque === status);
    }

    // Totais do relatório
    const totalItensCadastrados = materiais.length;
    const totalUnidadesEstoque = materiais.reduce((acc, m) => acc + (Number(m.estoque_atual) || 0), 0);
    const totalValorEstoque = materiais.reduce((acc, m) => acc + (Number(m.valor_total) || 0), 0);
    const itensCriticos = materiais.filter((m) => m.status_estoque === 'CRITICO' || m.status_estoque === 'ALERTA').length;

    // Dados do responsável técnico para o cabeçalho/rodapé do relatório impresso
    const configResp = db.get<{ valor: string }>("SELECT valor FROM configuracoes WHERE chave = 'aluno_responsavel'");
    const configMatr = db.get<{ valor: string }>("SELECT valor FROM configuracoes WHERE chave = 'matricula_aluno'");
    const configCurso = db.get<{ valor: string }>("SELECT valor FROM configuracoes WHERE chave = 'curso_instituicao'");
    const configAlmox = db.get<{ valor: string }>("SELECT valor FROM configuracoes WHERE chave = 'nome_almoxarifado'");

    res.json({
      materiais,
      totais: {
        total_itens: totalItensCadastrados,
        total_unidades: Math.round(totalUnidadesEstoque * 100) / 100,
        total_valor: Math.round(totalValorEstoque * 100) / 100,
        itens_criticos: itensCriticos,
      },
      responsavel_tecnico: configResp?.valor || 'Laura Lavínia',
      matricula_responsavel: configMatr?.valor || '2026.ENG.1048',
      curso_instituicao: configCurso?.valor || 'Engenharia / Gestão Operacional',
      nome_almoxarifado: configAlmox?.valor || 'Almoxarifado Central de Operações & Manutenção',
      data_geracao: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao gerar relatório de posição de estoque: ' + err.message });
  }
});

// ==========================================
// 6. INDICADORES DE DESEMPENHO (KPIS)
// ==========================================
apiRouter.get('/indicadores', async (req: Request, res: Response) => {
  try {
    const db = await getDb();

    // 1. Total de movimentações (entradas + saídas)
    const totalMovsRes = db.get<{ total: number; entradas: number; saidas: number }>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN tipo = 'ENTRADA' THEN 1 ELSE 0 END) as entradas,
        SUM(CASE WHEN tipo = 'SAIDA' THEN 1 ELSE 0 END) as saidas
      FROM movimentacoes
    `);

    // 2. Quantidade total movimentada e médias por movimentação
    const qtdMovsRes = db.get<{
      qtd_entradas: number;
      qtd_saidas: number;
      media_entrada: number;
      media_saida: number;
    }>(`
      SELECT 
        COALESCE(SUM(CASE WHEN tipo = 'ENTRADA' THEN quantidade ELSE 0 END), 0) as qtd_entradas,
        COALESCE(SUM(CASE WHEN tipo = 'SAIDA' THEN quantidade ELSE 0 END), 0) as qtd_saidas,
        COALESCE(AVG(CASE WHEN tipo = 'ENTRADA' THEN quantidade ELSE NULL END), 0) as media_entrada,
        COALESCE(AVG(CASE WHEN tipo = 'SAIDA' THEN quantidade ELSE NULL END), 0) as media_saida
      FROM movimentacoes
    `);

    // 3. Materiais em estoque atual e itens críticos
    const matsStats = db.get<{
      total_itens: number;
      itens_criticos: number;
      itens_alerta: number;
      estoque_total_unidades: number;
      valor_total_inventario: number;
    }>(`
      SELECT 
        COUNT(*) as total_itens,
        SUM(CASE WHEN estoque_atual <= 0 THEN 1 ELSE 0 END) as itens_criticos,
        SUM(CASE WHEN estoque_atual > 0 AND estoque_atual <= estoque_minimo THEN 1 ELSE 0 END) as itens_alerta,
        COALESCE(SUM(estoque_atual), 0) as estoque_total_unidades,
        COALESCE(SUM(estoque_atual * preco_unitario), 0) as valor_total_inventario
      FROM materiais
    `);

    // 4. Taxa de Rotatividade / Giro de Estoque
    // Giro = Total de Saídas no período / Estoque Médio (ou Estoque Atual)
    const totalSaidasQtd = qtdMovsRes?.qtd_saidas || 0;
    const estoqueAtualTotal = matsStats?.estoque_total_unidades || 1;
    // Se o estoque for positivo, calcular giro; senão 0
    const taxaRotatividade = estoqueAtualTotal > 0 ? (totalSaidasQtd / estoqueAtualTotal) : 0;

    // 5. Histórico recente de movimentações por dia para gráfico/tendência
    const movsPorDia = db.all<{ dia: string; entradas: number; saidas: number }>(`
      SELECT 
        substr(data_movimentacao, 1, 10) as dia,
        SUM(CASE WHEN tipo = 'ENTRADA' THEN quantidade ELSE 0 END) as entradas,
        SUM(CASE WHEN tipo = 'SAIDA' THEN quantidade ELSE 0 END) as saidas
      FROM movimentacoes
      GROUP BY substr(data_movimentacao, 1, 10)
      ORDER BY dia ASC
      LIMIT 14
    `);

    // 6. Requisições pendentes e atendidas
    const reqStats = db.get<{ total: number; pendentes: number; atendidas: number }>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'PENDENTE' THEN 1 ELSE 0 END) as pendentes,
        SUM(CASE WHEN status = 'ATENDIDA' THEN 1 ELSE 0 END) as atendidas
      FROM requisicoes
    `);

    // 7. Responsável Técnico
    const configResp = db.get<{ valor: string }>("SELECT valor FROM configuracoes WHERE chave = 'aluno_responsavel'");

    res.json({
      total_movimentacoes: totalMovsRes?.total || 0,
      total_entradas_count: totalMovsRes?.entradas || 0,
      total_saidas_count: totalMovsRes?.saidas || 0,
      quantidade_total_entradas: qtdMovsRes?.qtd_entradas || 0,
      quantidade_total_saidas: qtdMovsRes?.qtd_saidas || 0,
      entrada_media: Math.round((qtdMovsRes?.media_entrada || 0) * 10) / 10,
      saida_media: Math.round((qtdMovsRes?.media_saida || 0) * 10) / 10,
      taxa_rotatividade: Math.round(taxaRotatividade * 100) / 100,
      total_itens_cadastrados: matsStats?.total_itens || 0,
      itens_criticos_zerados: matsStats?.itens_criticos || 0,
      itens_em_alerta_minimo: matsStats?.itens_alerta || 0,
      estoque_total_unidades: Math.round((matsStats?.estoque_total_unidades || 0) * 10) / 10,
      valor_total_inventario: Math.round((matsStats?.valor_total_inventario || 0) * 100) / 100,
      requisicoes_total: reqStats?.total || 0,
      requisicoes_pendentes: reqStats?.pendentes || 0,
      requisicoes_atendidas: reqStats?.atendidas || 0,
      movimentacoes_por_dia: movsPorDia,
      aluno_responsavel: configResp?.valor || 'Laura Lavínia',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao calcular indicadores: ' + err.message });
  }
});

// ==========================================
// 7. SETUP, INFORMAÇÕES TÉCNICAS & RESET
// ==========================================
apiRouter.get('/setup-info', async (req: Request, res: Response) => {
  try {
    const schemaSql = getSchemaSql();
    res.json({
      banco_de_dados: 'SQLite 3 (WASM / sql.js com persistência em disco em data/estoque.sqlite)',
      arquivo_banco: 'data/estoque.sqlite',
      schema_sql: schemaSql,
      instrucoes_instalacao: [
        '1. Clonar ou extrair os arquivos do projeto;',
        '2. Instalar dependências: execute `npm install`;',
        '3. Iniciar o servidor em modo desenvolvimento: execute `npm run dev`;',
        '4. A aplicação inicia na porta 3000 (http://localhost:3000) e cria automaticamente o banco de dados relacional SQLite com o catálogo e histórico inicial;',
        '5. Para gerar o build de produção: execute `npm run build` e em seguida `npm start`.',
      ],
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao obter informações de setup: ' + err.message });
  }
});

apiRouter.post('/database/reset', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    db.resetDatabase();
    res.json({ success: true, message: 'Banco de dados SQLite reinicializado com sucesso com dados padrão de demonstração.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao reinicializar banco de dados: ' + err.message });
  }
});
