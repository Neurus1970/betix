const express = require('express');
const cors = require('cors');
const estadisticasRouter = require('./routes/estadisticas');
const reportesRouter = require('./routes/reportes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'betix-api' }));

app.use('/api/estadisticas', estadisticasRouter);
app.use('/api/reportes', reportesRouter);

if (require.main === module) {
  app.listen(PORT, () => console.log(`Betix API corriendo en puerto ${PORT}`));
}

module.exports = app;
