const path = require('path');
const express = require('express');
const cors = require('cors');
const logger = require('./logger');
const healthRouter       = require('./routes/health');
const geodataRouter      = require('./routes/geodata');
const proyectadoRouter   = require('./routes/proyectado');
const mapaBurbujasRouter = require('./routes/mapaBurbujas');

const app = express();
const PORT = process.env.BETIX_PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(healthRouter);
app.use('/api/datos', geodataRouter);
app.use('/api/datos', proyectadoRouter);
app.use('/api/datos', mapaBurbujasRouter);

app.get('/proyectado', (_req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'proyectado.html'))
);

app.get('/dashboard-interactivo', (_req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'dashboard-interactivo.html'))
);

app.get('/dashboard', (_req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'))
);

app.get('/mapa-burbujas', (_req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'mapa-burbujas.html'))
);

if (require.main === module) {
  app.listen(PORT, () => logger.info(`Betix API corriendo en puerto ${PORT}`));
}

module.exports = app;
