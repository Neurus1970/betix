const path = require('path');
const express = require('express');
const cors = require('cors');
const estadisticasRouter = require('./routes/estadisticas');
const mapaRouter = require('./routes/mapa');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'betix-api' }));

app.use('/api/estadisticas', estadisticasRouter);
app.use('/api/mapa-estadisticas', mapaRouter);
app.get('/mapa-estadisticas', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'mapa.html'))
);

if (require.main === module) {
  app.listen(PORT, () => console.log(`Betix API corriendo en puerto ${PORT}`));
}

module.exports = app;
