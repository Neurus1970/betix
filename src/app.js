const path = require('path');
const express = require('express');
const cors = require('cors');
const logger = require('./logger');
const healthRouter       = require('./routes/health');
const geodataRouter      = require('./routes/geodata');
const proyectadoRouter   = require('./routes/proyectado');

const app = express();
const PORT = process.env.BETIX_PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(healthRouter);
app.use('/api/datos', geodataRouter);
app.use('/api/datos', proyectadoRouter);

app.get('/dashboard', (_req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'))
);

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(502).json({ status: 'error', message: 'Core service unavailable' });
});

if (require.main === module) {
  app.listen(PORT, () => logger.info(`Betix API corriendo en puerto ${PORT}`));
}

module.exports = app;
