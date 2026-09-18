import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes.js';
import { getDb } from './server/db.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares essenciais
  app.use(express.json());

  // Inicializar banco de dados SQLite
  try {
    await getDb();
    console.log('[Server] Banco de dados SQLite inicializado com sucesso.');
  } catch (err) {
    console.error('[Server] Falha ao inicializar banco de dados SQLite:', err);
  }

  // Rotas de API ANTES do Vite
  app.use('/api', apiRouter);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Vite middleware em modo dev, arquivos estáticos em produção
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Almoxarifado rodando em http://localhost:${PORT}`);
  });
}

startServer();
