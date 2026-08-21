const http = require('http');
const { readFile } = require('fs/promises');
const path = require('path');

const ROOT = __dirname;
const HTML_FILE = path.join(ROOT, 'calculadora_alquileres_simple.html');
const HOST = '127.0.0.1';
const PORT = 8765;
const TODAY = new Date().toISOString().slice(0, 10);
const IPC_URL = 'https://www.indec.gob.ar/ftp/calculadora_ipc/variacion_ipc.csv';
const IPC_SOURCE = 'INDEC - variacion_ipc.csv';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const BCRA_INDEXES = {
  ICL: { id: 40, source: 'BCRA - API Principales Variables', label: 'ICL', note: 'Indice para Contratos de Locacion.' },
  CER: { id: 30, source: 'BCRA - API Principales Variables', label: 'CER', note: 'Coeficiente de Estabilizacion de Referencia.' },
  UVA: { id: 31, source: 'BCRA - API Principales Variables', label: 'UVA', note: 'Unidad de Valor Adquisitivo.' },
};

const SUPPORTED = ['ICL', 'IPC', 'IPC Zona Cuyo', 'CER', 'UVA'];
const cache = {
  ipc: { at: 0, series: null },
  bcra: new Map(),
};

function monthKey(value) {
  return String(value).slice(0, 7);
}

function parseMonth(value) {
  const [year, month] = String(value).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1));
}

function diffMonths(start, end) {
  const a = parseMonth(start);
  const b = parseMonth(end);
  return (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
}

function addMonths(monthStr, monthsToAdd) {
  const d = parseMonth(monthStr);
  d.setUTCMonth(d.getUTCMonth() + monthsToAdd);
  return d.toISOString().slice(0, 7);
}

async function httpGetText(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} al pedir ${url}`);
  return await res.text();
}

async function httpGetJson(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} al pedir ${url}`);
  return await res.json();
}

async function loadIpcSeries() {
  const now = Date.now();
  if (cache.ipc.series && now - cache.ipc.at < CACHE_TTL_MS) return cache.ipc.series;

  const text = await httpGetText(IPC_URL);
  const lines = text.trim().split(/\r?\n/);
  const header = lines.shift().split(';');
  const idx = Object.fromEntries(header.map((name, i) => [name.trim(), i]));
  const series = {};

  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.split(';');
    const region = (parts[idx.Region] || '').trim();
    const division = (parts[idx.ramaProducto] || '').trim().toUpperCase();
    if (division !== 'NIVEL GENERAL') continue;

    const year = Number(parts[idx['Año']]);
    const month = Number(parts[idx.Mes]);
    const value = Number(String(parts[idx.VarIPC] || '').replace(',', '.'));
    if (!region || !year || !month || !Number.isFinite(value)) continue;

    const key = `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}`;
    if (!series[region]) series[region] = {};
    series[region][key] = value;
  }

  cache.ipc = { at: now, series };
  return series;
}

async function loadBcraSeries(indexCode) {
  const cached = cache.bcra.get(indexCode);
  const now = Date.now();
  if (cached && now - cached.at < CACHE_TTL_MS) return cached.series;

  const info = BCRA_INDEXES[indexCode];
  if (!info) throw new Error(`Indice desconocido: ${indexCode}`);
  const url = `https://api.bcra.gob.ar/estadisticas/v4.0/Monetarias/${info.id}?desde=2000-01-01&hasta=${TODAY}`;
  const payload = await httpGetJson(url);
  const detalle = payload?.results?.[0]?.detalle || [];
  const monthly = {};
  for (const item of [...detalle].sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)))) {
    monthly[monthKey(item.fecha)] = Number(item.valor);
  }
  cache.bcra.set(indexCode, { at: now, series: monthly });
  return monthly;
}

async function getSeriesForIndex(indexName) {
  if (BCRA_INDEXES[indexName]) {
    const series = await loadBcraSeries(indexName);
    const info = BCRA_INDEXES[indexName];
    return [series, info.source, info.note];
  }
  if (indexName === 'IPC') {
    const all = await loadIpcSeries();
    return [all.Nacional || {}, IPC_SOURCE, 'IPC nacional con cobertura de INDEC.'];
  }
  if (indexName === 'IPC Zona Cuyo') {
    const all = await loadIpcSeries();
    return [all.Cuyo || {}, IPC_SOURCE, 'IPC regional con cobertura para Cuyo de INDEC.'];
  }
  throw new Error('Ese indice todavia no esta conectado a una fuente automatica.');
}

function calculate(indexName, rent, startMonth, periodMonths) {
  return getSeriesForIndex(indexName).then(([series, source, sourceNote]) => {
    const months = Object.keys(series).sort();
    if (!months.length) {
      return { ok: false, index: indexName, source, source_note: sourceNote, error: 'No se pudieron cargar datos para ese indice.' };
    }

    const currentMonth = months[months.length - 1];
    if (!series[startMonth]) {
      return { ok: false, index: indexName, source, source_note: sourceNote, error: `No encontre datos para ${startMonth}.` };
    }

    const safePeriod = Math.max(1, Number(periodMonths) || 12);
    const periods = Math.max(0, Math.floor(diffMonths(startMonth, currentMonth) / safePeriod));
    const breakdown = [];
    let accumulatedFactor = 1;
    let accumulatedRent = rent;

    for (let periodIndex = 1; periodIndex <= periods; periodIndex++) {
      const factorStartMonth = addMonths(startMonth, (periodIndex - 1) * safePeriod);
      const factorEndMonth = addMonths(startMonth, periodIndex * safePeriod - 1);

      let startValue = Number(series[factorStartMonth]);
      let endValue = Number(series[factorEndMonth]);
      let periodFactor;

      if (indexName === 'IPC' || indexName === 'IPC Zona Cuyo') {
        let fac = 1;
        for (let m = 0; m < safePeriod; m++) {
          const targetMonth = addMonths(startMonth, (periodIndex - 1) * safePeriod + m);
          const val = Number(series[targetMonth]);
          if (!Number.isFinite(val)) {
            return {
              ok: false,
              index: indexName,
              source,
              source_note: sourceNote,
              error: `Faltan datos de variación para el mes ${targetMonth} en el período ${periodIndex}.`,
            };
          }
          fac *= (1 + val / 100);
        }
        periodFactor = fac;
      } else {
        if (!Number.isFinite(startValue) || !Number.isFinite(endValue) || startValue === 0) {
          return {
            ok: false,
            index: indexName,
            source,
            source_note: sourceNote,
            error: `Faltan datos para calcular el período ${periodIndex}.`,
          };
        }
        periodFactor = endValue / startValue;
      }
      accumulatedFactor *= periodFactor;
      accumulatedRent *= periodFactor;
      breakdown.push({
        period: periodIndex,
        factor_start_month: factorStartMonth,
        factor_end_month: factorEndMonth,
        active_from: addMonths(startMonth, periodIndex * safePeriod),
        active_to: addMonths(startMonth, (periodIndex + 1) * safePeriod - 1),
        start_value: startValue,
        end_value: endValue,
        factor: periodFactor,
        accumulated_factor: accumulatedFactor,
        accumulated_rent: accumulatedRent,
      });
    }

    const nextUpdate = addMonths(startMonth, (periods + 1) * safePeriod);

    return {
      ok: true,
      index: indexName,
      source,
      source_note: sourceNote,
      current_month: currentMonth,
      current_period_start: addMonths(startMonth, periods * safePeriod),
      current_period_end: addMonths(startMonth, (periods + 1) * safePeriod - 1),
      start_month: startMonth,
      start_value: Number(series[startMonth]),
      current_value: Number(series[currentMonth]),
      factor: accumulatedFactor,
      updated_rent: accumulatedRent,
      periods,
      next_update: nextUpdate,
      current_as_of: currentMonth,
      breakdown,
      error: null,
    };
  }).catch((error) => ({ ok: false, index: indexName, source: '', source_note: '', error: error.message || String(error) }));
}

function sendJson(res, status, data) {
  const body = Buffer.from(JSON.stringify(data, null, 0), 'utf8');
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body);
}

function sendHtml(res, status, content) {
  const body = Buffer.from(content, 'utf8');
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': body.length,
  });
  res.end(body);
}

async function main() {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Content-Length': '0',
        });
        res.end();
        return;
      }

      if (req.method !== 'GET') {
        res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Method not allowed');
        return;
      }

      if (url.pathname === '/' || url.pathname === '/index.html' || url.pathname === '/calculadora_alquileres_simple.html') {
        const html = await readFile(HTML_FILE, 'utf8');
        sendHtml(res, 200, html);
        return;
      }

      if (url.pathname === '/api/indices') {
        sendJson(res, 200, {
          ok: true,
          supported: SUPPORTED,
          sourceMap: {
            ICL: { source: BCRA_INDEXES.ICL.source, note: BCRA_INDEXES.ICL.note },
            CER: { source: BCRA_INDEXES.CER.source, note: BCRA_INDEXES.CER.note },
            UVA: { source: BCRA_INDEXES.UVA.source, note: BCRA_INDEXES.UVA.note },
            IPC: { source: IPC_SOURCE, note: 'IPC nacional con cobertura de INDEC.' },
            'IPC Zona Cuyo': { source: IPC_SOURCE, note: 'IPC regional con cobertura para Cuyo de INDEC.' },
          },
        });
        return;
      }

      if (url.pathname === '/api/calculate') {
        const indexName = url.searchParams.get('index') || 'ICL';
        const rent = Number(url.searchParams.get('rent') || '300000');
        const startMonth = url.searchParams.get('startMonth') || '';
        const periodMonths = Number(url.searchParams.get('periodMonths') || '12');
        if (!startMonth) {
          sendJson(res, 400, { ok: false, error: 'Falta startMonth.' });
          return;
        }
        const result = await calculate(indexName, rent, startMonth, periodMonths);
        sendJson(res, 200, result);
        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
    } catch (error) {
      sendJson(res, 500, { ok: false, error: error.message || String(error) });
    }
  });

  server.listen(PORT, HOST, () => {
    console.log(`Serving on http://${HOST}:${PORT}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
