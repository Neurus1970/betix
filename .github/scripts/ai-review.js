const fs = require('fs');
const https = require('https');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const PR_TITLE = process.env.PR_TITLE || 'Sin título';
const PR_BODY = process.env.PR_BODY || '';

function readFile(path) {
  try { return fs.readFileSync(path, 'utf8'); } catch { return ''; }
}

function callClaude(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }]
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const parsed = JSON.parse(data);
        resolve(parsed.content[0].text);
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const diff = readFile('pr_diff.txt');
  const junitResults = readFile('test-results/junit.xml');

  const prompt = `Eres un revisor de código experto para la plataforma Betix (API de estadísticas de tickets de lotería).

Analiza el siguiente diff de la Pull Request y los resultados de tests, luego genera un reporte en markdown con:

## 1. Resumen de Cambios
Descripción clara de qué cambia esta PR y por qué.

## 2. Análisis de Calidad del Código
- Puntos fuertes
- Posibles mejoras
- Riesgos identificados

## 3. Resultados de Tests
Resumen de los tests ejecutados (pasados/fallidos).

## 4. Documentación de la API
Si hay endpoints nuevos o modificados, documentarlos con ejemplos.

## 5. Veredicto
✅ Aprobado / ⚠️ Aprobado con observaciones / ❌ Requiere cambios

---
PR: ${PR_TITLE}
${PR_BODY ? 'Descripción: ' + PR_BODY : ''}

DIFF:
\`\`\`diff
${diff.slice(0, 8000)}
\`\`\`

RESULTADOS DE TESTS (JUnit XML):
\`\`\`xml
${junitResults.slice(0, 2000)}
\`\`\`

Genera el reporte en español.`;

  const report = await callClaude(prompt);

  const fullReport = `## 🤖 Revisión Automática con IA (Claude)\n\n${report}\n\n---\n*Generado automáticamente por Claude en el pipeline de CI/CD de Betix*`;

  fs.writeFileSync('ai-report.md', fullReport);
  console.log('Reporte generado: ai-report.md');
}

main().catch(err => {
  console.error('Error al generar reporte:', err.message);
  fs.writeFileSync('ai-report.md', '## ⚠️ Error al generar reporte de IA\n\nNo se pudo conectar con Claude API.');
  process.exit(0);
});
