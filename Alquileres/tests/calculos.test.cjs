const fs = require('fs');
const path = require('path');
const assert = require('assert');
const test = require('node:test');

// Mock seguro del DOM para evitar errores de propiedades sobre elementos inexistentes
const domMock = {
  textContent: '',
  style: {},
  classList: { add: () => {}, remove: () => {}, toggle: () => {} },
  getAttribute: () => '',
  setAttribute: () => {},
  addEventListener: () => {},
  appendChild: () => {},
  value: ''
};

global.window = {
  location: {
    pathname: '/dashboard.html',
    search: ''
  }
};
global.sessionStorage = {
  getItem: () => '[]',
  setItem: () => {}
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};
global.document = {
  readyState: 'complete',
  addEventListener: () => {},
  querySelectorAll: () => [],
  getElementById: () => domMock
};
global.fetch = () => Promise.resolve({
  json: () => Promise.resolve({})
});

// Cargar app.js y remover la inicialización automática al final
const appJsPath = path.join(__dirname, '../app.js');
let appJsCode = fs.readFileSync(appJsPath, 'utf8');

// Eliminar el bloque autoejecutable al final del archivo
appJsCode = appJsCode.replace(/if\s*\(document\.readyState\s*===\s*'loading'\)[\s\S]*?else\s*\{[\s\S]*?initApp\(\);[\s\S]*?\}/, '');

// Definir IPC_DATA de prueba global
global.IPC_DATA = [
  { mes: '2024-12', nac: 3.0, cuy: 3.5, icl: 10.0 }, // ICL inicial base (desfase 1 mes desde Ene 2025)
  { mes: '2025-01', nac: 4.0, cuy: 4.0, icl: 10.4 }, 
  { mes: '2025-02', nac: 3.0, cuy: 3.0, icl: 10.712 }, 
  // FALTARÁ 2025-03 para el test de robustez
  { mes: '2025-04', nac: 5.0, cuy: 4.5, icl: 11.472 }, 
  { mes: '2025-05', nac: 3.0, cuy: 3.0, icl: 11.816 }, 
  { mes: '2025-06', nac: 4.0, cuy: 4.0, icl: 12.289 }, // ICL de Junio 2025 (desfase 1 mes para Julio 2025)
];

// Inyectar el enlace de la variable local de app.js con el global del test
appJsCode += "\nIPC_DATA = global.IPC_DATA;\n";

// Evaluar en el contexto global
eval(appJsCode);

// Exponer las funciones necesarias explícitamente a global si no lo están
global.getMontoActual = getMontoActual;
global.calcFactorIPC = calcFactorIPC;
global.pd = pd;
global.getPromedioInflacionReciente = getPromedioInflacionReciente;
global.getEvolucionCanon = getEvolucionCanon;

test('Cálculo de Ajuste Fijo', () => {
  const tienda = {
    monto: 100000,
    ini: '2025-01-01',
    ajuste: 'Semestral',
    indice: 'Fijo',
    pctFijo: 10
  };
  
  const res = global.getMontoActual(tienda, '2025-07-01', true);
  assert.strictEqual(res.periodos, 1);
  assert.ok(Math.abs(res.montoActual - 110000) < 0.01, `Esperado: 110000, Obtenido: ${res.montoActual}`);
  
  const res2 = global.getMontoActual(tienda, '2026-01-01', true);
  assert.strictEqual(res2.periodos, 2);
  assert.ok(Math.abs(res2.montoActual - 121000) < 0.01, `Esperado: 121000, Obtenido: ${res2.montoActual}`);
});

test('Cálculo de Ajuste por IPC Nacional (Semestral) - Datos Completos', () => {
  // Para esta prueba inyectamos temporalmente el mes que falta de forma in-place
  global.IPC_DATA.push({ mes: '2025-03', nac: 2.0, cuy: 2.5, icl: 10.926 });
  global.IPC_DATA.sort((a,b)=>a.mes.localeCompare(b.mes));
  
  const tienda = {
    monto: 100000,
    ini: '2025-01-01',
    ajuste: 'Semestral',
    indice: 'IPC Nacional',
    desfase: 1
  };
  
  const res = global.getMontoActual(tienda, '2025-07-01', true);
  
  const expectedFactor = 1.03 * 1.04 * 1.03 * 1.02 * 1.05 * 1.03;
  const expectedMonto = 100000 * expectedFactor;
  
  assert.strictEqual(res.periodos, 1);
  assert.ok(Math.abs(res.montoActual - expectedMonto) < 0.01, `Esperado: ${expectedMonto}, Obtenido: ${res.montoActual}`);
});

test('Cálculo de Ajuste por IPC Nacional (Semestral) - Datos Faltantes', () => {
  // Removemos el mes 2025-03 in-place para simular datos incompletos
  const idx = global.IPC_DATA.findIndex(x => x.mes === '2025-03');
  if (idx !== -1) global.IPC_DATA.splice(idx, 1);
  
  const tienda = {
    monto: 100000,
    ini: '2025-01-01',
    ajuste: 'Semestral',
    indice: 'IPC Nacional',
    desfase: 1
  };
  
  const res = global.getMontoActual(tienda, '2025-07-01', true);
  
  // Debería detectar que faltan datos, mantener el monto original y detallarlo
  assert.strictEqual(res.montoActual, 100000);
  assert.strictEqual(res.detalle, 'Índices IPC no cargados completamente para el período');
});

test('Cálculo de Ajuste por ICL (Semestral)', () => {
  const tienda = {
    monto: 100000,
    ini: '2025-01-01',
    ajuste: 'Semestral',
    indice: 'ICL',
    iclIni: 10.0,
    desfase: 1
  };
  
  const res = global.getMontoActual(tienda, '2025-07-01', true);
  const expectedMonto = 100000 * (12.289 / 10.0);
  
  assert.strictEqual(res.periodos, 1);
  assert.ok(Math.abs(res.montoActual - expectedMonto) < 0.01, `Esperado: ${expectedMonto}, Obtenido: ${res.montoActual}`);
});

test('Cálculo de Promedio de Inflación Reciente', () => {
  const promedio = global.getPromedioInflacionReciente('IPC Nacional', '2025-06');
  assert.ok(Math.abs(promedio - 4.0) < 0.01, `Esperado: 4.0, Obtenido: ${promedio}`);
});

test('Cálculo de Evolución del Canon (Serie Histórica y Proyectada)', () => {
  const tienda = {
    monto: 100000,
    ini: '2025-01-01',
    locFin: '2026-01-01',
    ajuste: 'Semestral',
    indice: 'Fijo',
    pctFijo: 10
  };
  
  const hitos = global.getEvolucionCanon(tienda);
  assert.strictEqual(hitos.length, 3);
  assert.strictEqual(hitos[0].monto, 100000);
  assert.ok(Math.abs(hitos[1].monto - 110000) < 0.01);
  assert.ok(Math.abs(hitos[2].monto - 121000) < 0.01);
});
