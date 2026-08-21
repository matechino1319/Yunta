// ══════════════════════════════════════════════
// DATA
// ══════════════════════════════════════════════
let USERS={admin:{pass:'1',name:'Administrador',role:'admin'}};
let CU=null,EID=null,PCTX=null,YEAR_PAGOS=2026;
const DEFAULT_IPC_DATA = [
  { mes: '2024-01', nac: 20.6, cuy: 20.0, icl: 18.0 }, { mes: '2024-02', nac: 13.2, cuy: 13.0, icl: 14.0 },
  { mes: '2024-03', nac: 11.0, cuy: 11.0, icl: 12.0 }, { mes: '2024-04', nac: 8.8, cuy: 8.5, icl: 10.0 },
  { mes: '2024-05', nac: 4.2, cuy: 4.0, icl: 8.0 }, { mes: '2024-06', nac: 4.6, cuy: 4.5, icl: 7.5 },
  { mes: '2024-07', nac: 4.0, cuy: 4.0, icl: 7.0 }, { mes: '2024-08', nac: 4.2, cuy: 4.1, icl: 6.8 },
  { mes: '2024-09', nac: 3.5, cuy: 3.4, icl: 6.2 }, { mes: '2024-10', nac: 2.7, cuy: 2.8, icl: 5.5 },
  { mes: '2024-11', nac: 2.4, cuy: 2.5, icl: 4.8 }, { mes: '2024-12', nac: 2.7, cuy: 2.6, icl: 4.5 },
  { mes: '2025-01', nac: 2.3, cuy: 2.2, icl: 4.0 }, { mes: '2025-02', nac: 2.1, cuy: 2.0, icl: 3.8 },
  { mes: '2025-03', nac: 2.5, cuy: 2.4, icl: 3.6 }, { mes: '2025-04', nac: 2.2, cuy: 2.1, icl: 3.5 },
  { mes: '2025-05', nac: 2.0, cuy: 2.0, icl: 3.2 }, { mes: '2025-06', nac: 2.1, cuy: 2.1, icl: 3.0 },
  { mes: '2025-07', nac: 2.2, cuy: 2.2, icl: 3.0 }, { mes: '2025-08', nac: 2.0, cuy: 2.0, icl: 2.9 },
  { mes: '2025-09', nac: 2.1, cuy: 2.1, icl: 2.8 }, { mes: '2025-10', nac: 2.0, cuy: 2.0, icl: 2.7 },
  { mes: '2025-11', nac: 2.2, cuy: 2.1, icl: 2.7 }, { mes: '2025-12', nac: 2.1, cuy: 2.0, icl: 2.6 },
  { mes: '2026-01', nac: 2.3, cuy: 2.2, icl: 2.5 }, { mes: '2026-02', nac: 2.0, cuy: 2.0, icl: 2.5 },
  { mes: '2026-03', nac: 2.1, cuy: 2.1, icl: 2.4 }, { mes: '2026-04', nac: 2.0, cuy: 2.0, icl: 2.4 },
  { mes: '2026-05', nac: 2.0, cuy: 2.0, icl: 2.3 }, { mes: '2026-06', nac: 2.0, cuy: 2.0, icl: 2.3 }
];
let TIENDAS=[],PAGOS={},IPC_DATA=[...DEFAULT_IPC_DATA],ARCHIVADOS=[],CHECKLIST={},CONTACTOS=[];
const MESES=['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
const MESES_S=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// ══ SIDEBAR MÓVIL ══
function toggleMobSidebar() {
  const sb = document.querySelector('.sidebar');
  const bd = document.getElementById('sb-backdrop');
  if (!sb) return;
  const isOpen = sb.classList.toggle('open');
  if (bd) bd.classList.toggle('open', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
}
function closeMobSidebar() {
  const sb = document.querySelector('.sidebar');
  const bd = document.getElementById('sb-backdrop');
  if (sb) sb.classList.remove('open');
  if (bd) bd.classList.remove('open');
  document.body.style.overflow = '';
}


let _saveTimer = null;

function getCurrentPageId() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  if (path === 'index.html' || path === '') return 'login';
  return path.replace('.html', '');
}

const NAV_HISTORY = JSON.parse(sessionStorage.getItem('nav_history') || '[]');
function saveNavHistory() {
  sessionStorage.setItem('nav_history', JSON.stringify(NAV_HISTORY));
}

function renderCurrentPage() {
  const pageId = getCurrentPageId();
  if (pageId === 'login') return;

  if (pageId !== 'legajo') {
    if (!NAV_HISTORY.includes(pageId)) {
      NAV_HISTORY.push(pageId);
      if (NAV_HISTORY.length > 20) NAV_HISTORY.shift();
      saveNavHistory();
    }
  }

  // Marcar nav activa
  document.querySelectorAll('.nav').forEach(n => {
    if (n.getAttribute('onclick')?.includes(`'${pageId}'`)) {
      n.classList.add('active');
    } else {
      n.classList.remove('active');
    }
  });

  const map = {
    dashboard: renderDashboard,
    tiendas: renderTiendas,
    pagos: renderPagos,
    alertas: renderAlertas,
    checklist: renderChecklist,
    ipc: renderIPC,
    cuentas: renderCuentas,
    archivados: renderArchivados,
    contactos: renderContactos,
    reportes: renderReportes,
    ajustes: () => {
      renderAjustesPendientes();
      renderCalcTipo();
    },
    legajo: () => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('id')) {
        EID = urlParams.get('id');
        verLegajo(EID);
      }
    }
  };
  if (map[pageId]) map[pageId]();
  updateBackButtons();
}

function initMobileNav() {
  if (document.getElementById('mobile-top-bar')) return;
  
  const topBar = document.createElement('div');
  topBar.id = 'mobile-top-bar';
  topBar.className = 'mobile-top-header';
  
  const admin = isAdmin();
  
  topBar.innerHTML = `
    <div class="mobile-logo">GestorAlquileres <span style="font-size: 8px; color: var(--t4); font-weight: 400; font-family: var(--fm);">// v3.0</span></div>
    <div style="display:flex; align-items:center; gap:8px;">
      <button id="mobile-logout-btn" style="background:none; border:none; color:var(--t3); cursor:pointer; display:flex; align-items:center; justify-content:center; padding:6px; transition:color .2s;" onclick="doLogout()" title="Cerrar sesión">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      </button>
      ${!admin ? `
      <button id="mobile-menu-btn" class="mobile-menu-trigger" title="Menú">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      ` : ''}
    </div>
  `;
  
  document.body.appendChild(topBar);

  if (!admin) {
    const btn = topBar.querySelector('#mobile-menu-btn');
    if (btn) {
      btn.onclick = (e) => {
        e.stopPropagation();
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.classList.toggle('open');
      };
    }
  }

  const logoutBtn = topBar.querySelector('#mobile-logout-btn');
  if (logoutBtn) {
    logoutBtn.onmouseenter = () => logoutBtn.style.color = 'var(--danger)';
    logoutBtn.onmouseleave = () => logoutBtn.style.color = 'var(--t3)';
  }

  document.addEventListener('click', (e) => {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && sidebar.classList.contains('open') && !sidebar.contains(e.target) && !topBar.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });
}

function initApp() {
  const pageId = getCurrentPageId();
  const savedUser = sessionStorage.getItem('ga_user');

  if (savedUser) {
    CU = JSON.parse(savedUser);
    const isAdminUser = CU.role === 'admin';
    
    // Redirección forzada por rol para evitar acceso a páginas no permitidas
    if (isAdminUser && pageId !== 'cuentas') {
      window.location.href = 'cuentas.html';
      return;
    }
    if (!isAdminUser && pageId === 'cuentas') {
      window.location.href = 'dashboard.html';
      return;
    }

    if (pageId === 'login') {
      window.location.href = isAdminUser ? 'cuentas.html' : 'dashboard.html';
      return;
    }
    
    load().then(() => {
      const uav = document.getElementById('uav');
      if (uav) uav.textContent = CU.name[0];
      const uname = document.getElementById('uname');
      if (uname) uname.textContent = CU.name;

      seed();
      initYearPills();
      renderCurrentPage();
      if (!window._badgeInterval) {
        window._badgeInterval = setInterval(updateBadge, 60000);
      }
      applyPermisos();

      const appEl = document.getElementById('app');
      if (appEl) appEl.style.display = 'block';
      initMobileNav();
    });
  } else {
    CU = null;
    if (pageId !== 'login') {
      window.location.href = 'index.html';
    } else {
      const appEl = document.getElementById('app');
      if (appEl) appEl.style.display = 'none';
      const loginEl = document.getElementById('login');
      if (loginEl) loginEl.style.display = 'flex';
    }
  }
}

// Ejecutar inicialización después de que el documento cargue
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}


function loadSupabaseLibrary() {
  return new Promise((resolve, reject) => {
    if (window.supabase) return resolve(window.supabase);
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = () => resolve(window.supabase);
    script.onerror = () => reject(new Error('No se pudo cargar Supabase desde el CDN.'));
    document.head.appendChild(script);
  });
}

let _supabaseClient = null;

async function getSupabase() {
  if (_supabaseClient) return _supabaseClient;
  try {
    await loadSupabaseLibrary();
    const su = atob('aHR0cHM6Ly9yanBycXl1Y3hreWR0Y2JmYWtybC5zdXBhYmFzZS5jbw==');
    const sk = atob('ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmhZbUZ6WlNJc0luSmxaaUk2SW5KcWNISnhlWFZqZUd0NVpIUmpZbVpoYTNKc0lpd2ljbTlzWlNJNkltRnViMjRpTENKcFlYUWlPakUzT0RReU5EVXlNRElzSW1WNGNDSTZNakE1T1RneU1USXdNbjAuUEVhcWtSWjVmdzZudGM4NG1OckQtU2YzTUZKR0F2SERfY01RTzk1Zi0zWQ==');
    if (window.supabase) {
      _supabaseClient = window.supabase.createClient(su, sk);
      return _supabaseClient;
    }
  } catch(e) {
    console.warn("No se pudo inicializar el cliente de Supabase.", e);
  }
  return null;
}

function save(){
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(()=>_pushData(), 600);
}

async function _pushData(){
  serverSetStatus('saving');
  try {
    const sb = await getSupabase();
    if (sb) {
      const payload = {TIENDAS, PAGOS, IPC_DATA, USERS, ARCHIVADOS, CHECKLIST, CONTACTOS};
      const promises = [];

      // 1. Usuarios
      if (USERS && Object.keys(USERS).length > 0) {
        const uRows = Object.entries(USERS).map(([u, info]) => ({
          username: u,
          name: info.name || u,
          pass: info.pass || '',
          role: info.role || 'operador'
        }));
        promises.push(sb.from('usuarios').upsert(uRows));
      }

      // 2. Tiendas
      if (TIENDAS && TIENDAS.length > 0) {
        const tRows = TIENDAS.map(t => ({
          id: t.id,
          nombre: t.nombre || '',
          num: t.num || '',
          tipo: t.tipo || '',
          depar: t.depar || '',
          dir: t.dir || '',
          prop: t.prop || '',
          cuit: t.cuit || '',
          tel: t.tel || '',
          monto: t.monto || 0,
          ajuste: t.ajuste || '',
          indice: t.indice || '',
          data: t
        }));
        promises.push(sb.from('tiendas').upsert(tRows));
      }

      // 3. Checklist
      if (CHECKLIST && Object.keys(CHECKLIST).length > 0) {
        const cRows = Object.entries(CHECKLIST).map(([per, tareas]) => ({
          periodo: per,
          tareas: tareas
        }));
        promises.push(sb.from('checklist').upsert(cRows));
      }

      // 4. Contactos
      if (CONTACTOS && CONTACTOS.length > 0) {
        const ctRows = CONTACTOS.map(c => ({
          id: c.id || String(Date.now()),
          nombre: c.nombre || '',
          tel: c.tel || '',
          email: c.email || '',
          cuit: c.cuit || '',
          data: c
        }));
        promises.push(sb.from('contactos').upsert(ctRows));
      }

      // 5. Pagos
      if (PAGOS && Object.keys(PAGOS).length > 0) {
        const pRows = Object.entries(PAGOS).map(([k, v]) => ({
          id: k,
          data: v
        }));
        promises.push(sb.from('pagos').upsert(pRows));
      }

      // 6. IPC Data
      if (IPC_DATA && IPC_DATA.length > 0) {
        const iRows = IPC_DATA.map((item, idx) => ({
          id: item.fecha || String(idx),
          fecha: item.fecha || '',
          valor: item.valor || 0,
          data: item
        }));
        promises.push(sb.from('ipc_data').upsert(iRows));
      }

      // 7. Archivados
      if (ARCHIVADOS && ARCHIVADOS.length > 0) {
        const aRows = ARCHIVADOS.map(a => ({
          id: a.id || String(Date.now()),
          data: a
        }));
        promises.push(sb.from('archivados').upsert(aRows));
      }

      // Compatibilidad fallback
      promises.push(sb.from('alquileres_data').upsert({ id: 1, data: payload, updated_at: new Date().toISOString() }).catch(()=>{}));

      await Promise.allSettled(promises);
      serverSetStatus('ok');
    } else {
      throw new Error('Supabase no configurado');
    }
  } catch(e){
    console.warn("Fallo al guardar en Supabase. Intentando fallback local:", e);
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({TIENDAS, PAGOS, IPC_DATA, USERS, ARCHIVADOS, CHECKLIST, CONTACTOS})
      });
      serverSetStatus('ok');
    } catch(err){
      serverSetStatus('error');
    }
  }
  saveLocalStorageBackup();
}

async function loadLocalFallback() {
  try {
    const res = await fetch('/api/data');
    const d = await res.json();
    if (d && d.TIENDAS) return d;
  } catch (e) {
    console.log("Local Flask server not available for fallback/migration.", e);
  }
  try {
    const local = localStorage.getItem('ga_v3');
    if (local) return JSON.parse(local);
  } catch (e) {
    console.error("localStorage not available.", e);
  }
  return null;
}

function saveLocalStorageBackup() {
  try {
    localStorage.setItem('ga_v3', JSON.stringify({TIENDAS, PAGOS, IPC_DATA, USERS, ARCHIVADOS, CHECKLIST, CONTACTOS}));
  } catch (e) {
    console.error("localStorage backup write failed.", e);
  }
}

async function load(){
  try {
    const sb = await getSupabase();
    if (sb) {
      const [resUsers, resTiendas, resChecklist, resContactos, resPagos, resIpc, resArchivados] = await Promise.allSettled([
        sb.from('usuarios').select('*'),
        sb.from('tiendas').select('*'),
        sb.from('checklist').select('*'),
        sb.from('contactos').select('*'),
        sb.from('pagos').select('*'),
        sb.from('ipc_data').select('*'),
        sb.from('archivados').select('*')
      ]);

      let loadedAny = false;

      if (resUsers.status === 'fulfilled' && resUsers.value?.data?.length) {
        USERS = {};
        resUsers.value.data.forEach(u => {
          if (u.username) {
            USERS[u.username.toLowerCase()] = { name: u.name, pass: u.pass, role: u.role };
          }
        });
        loadedAny = true;
      }

      if (resTiendas.status === 'fulfilled' && resTiendas.value?.data?.length) {
        TIENDAS = resTiendas.value.data.map(row => row.data || row);
        loadedAny = true;
      }

      if (resChecklist.status === 'fulfilled' && resChecklist.value?.data?.length) {
        CHECKLIST = {};
        resChecklist.value.data.forEach(c => {
          if (c.periodo) CHECKLIST[c.periodo] = c.tareas;
        });
        loadedAny = true;
      }

      if (resContactos.status === 'fulfilled' && resContactos.value?.data?.length) {
        CONTACTOS = resContactos.value.data.map(c => c.data || c);
        loadedAny = true;
      }

      if (resPagos.status === 'fulfilled' && resPagos.value?.data?.length) {
        PAGOS = {};
        resPagos.value.data.forEach(p => {
          PAGOS[p.id] = p.data || p;
        });
        loadedAny = true;
      }

      if (resIpc.status === 'fulfilled' && resIpc.value?.data?.length) {
        IPC_DATA = resIpc.value.data.map(i => i.data || i);
        loadedAny = true;
      }

      if (resArchivados.status === 'fulfilled' && resArchivados.value?.data?.length) {
        ARCHIVADOS = resArchivados.value.data.map(a => a.data || a);
        loadedAny = true;
      }

      if (resMono.status === 'fulfilled' && resMono.value?.data?.data) {
        const d = resMono.value.data.data;
        if (!loadedAny && d.TIENDAS) TIENDAS = d.TIENDAS;
        if (d.PAGOS) PAGOS = d.PAGOS;
        if (d.IPC_DATA) IPC_DATA = d.IPC_DATA;
        if (d.ARCHIVADOS) ARCHIVADOS = d.ARCHIVADOS;
        if (!loadedAny && d.USERS) USERS = d.USERS;
        if (!loadedAny && d.CHECKLIST) CHECKLIST = d.CHECKLIST;
        if (!loadedAny && d.CONTACTOS) CONTACTOS = d.CONTACTOS;
        loadedAny = true;
      }

      if (loadedAny) {
        serverSetStatus('ok');
        return;
      }
    }
    throw new Error('Supabase no disponible');
  } catch(e){
    console.warn("Fallo carga desde Supabase, intentando fallback local:", e);
    try {
      const res = await fetch('/api/data');
      const d   = await res.json();
      if(d.TIENDAS)   TIENDAS   = d.TIENDAS;
      if(d.PAGOS)     PAGOS     = d.PAGOS;
      if(d.IPC_DATA)  IPC_DATA  = d.IPC_DATA;
      if(d.USERS)     USERS     = d.USERS;
      if(d.ARCHIVADOS)ARCHIVADOS= d.ARCHIVADOS;
      if(d.CHECKLIST) CHECKLIST = d.CHECKLIST;
      if(d.CONTACTOS) CONTACTOS = d.CONTACTOS;
      serverSetStatus('ok');
    } catch(err){
      const local = localStorage.getItem('ga_v3');
      if(local){
        const p=JSON.parse(local);
        TIENDAS=p.TIENDAS||[];
        PAGOS=p.PAGOS||{};
        IPC_DATA=p.IPC_DATA||[];
        if(p.USERS)USERS=p.USERS;
        if(p.ARCHIVADOS)ARCHIVADOS=p.ARCHIVADOS;
        if(p.CHECKLIST)CHECKLIST=p.CHECKLIST;
        if(p.CONTACTOS)CONTACTOS=p.CONTACTOS;
        serverSetStatus('ok');
        return;
      }
      serverSetStatus('error');
    }
  }
}


// ══ CUENTAS ══
let _editUser = null; // username que se está editando

function isAdmin(){ return CU && CU.role === 'admin'; }

function renderCuentas(){
  if(!isAdmin()){ document.getElementById('cuentas-tbody').innerHTML='<tr><td colspan="4" class="empty">Sin permisos</td></tr>'; return; }
  
  // Calcular métricas
  const total = Object.keys(USERS).length;
  const admins = Object.values(USERS).filter(u => u.role === 'admin').length;
  const operadores = total - admins;
  
  const metricsHtml = `
    <div class="card metric-card" style="padding:16px; display:flex; align-items:center; gap:16px; background:var(--s2); border:1px solid var(--bdr); border-radius:10px;">
      <div style="width:38px; height:38px; border-radius:8px; background:rgba(59,130,246,0.08); display:flex; align-items:center; justify-content:center; color:#3b82f6; border:1px solid rgba(59,130,246,0.15);">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
      </div>
      <div>
        <div style="font-size:10px; color:var(--t3); text-transform:uppercase; font-family:var(--fm); letter-spacing:0.06em;">Total Cuentas</div>
        <div style="font-size:18px; font-weight:700; color:var(--t1); margin-top:1px;">${total}</div>
      </div>
    </div>
    <div class="card metric-card" style="padding:16px; display:flex; align-items:center; gap:16px; background:var(--s2); border:1px solid var(--bdr); border-radius:10px;">
      <div style="width:38px; height:38px; border-radius:8px; background:rgba(16,185,129,0.08); display:flex; align-items:center; justify-content:center; color:#10b981; border:1px solid rgba(16,185,129,0.15);">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      </div>
      <div>
        <div style="font-size:10px; color:var(--t3); text-transform:uppercase; font-family:var(--fm); letter-spacing:0.06em;">Administradores</div>
        <div style="font-size:18px; font-weight:700; color:var(--t1); margin-top:1px;">${admins}</div>
      </div>
    </div>
    <div class="card metric-card" style="padding:16px; display:flex; align-items:center; gap:16px; background:var(--s2); border:1px solid var(--bdr); border-radius:10px;">
      <div style="width:38px; height:38px; border-radius:8px; background:rgba(245,158,11,0.08); display:flex; align-items:center; justify-content:center; color:#f59e0b; border:1px solid rgba(245,158,11,0.15);">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </div>
      <div>
        <div style="font-size:10px; color:var(--t3); text-transform:uppercase; font-family:var(--fm); letter-spacing:0.06em;">Operadores</div>
        <div style="font-size:18px; font-weight:700; color:var(--t1); margin-top:1px;">${operadores}</div>
      </div>
    </div>
  `;
  const metricsEl = document.getElementById('cuentas-metrics');
  if (metricsEl) metricsEl.innerHTML = metricsHtml;

  const rows = Object.entries(USERS).map(([u,d])=>{
    const esAdmin = d.role==='admin';
    const badge = esAdmin
      ? `<span style="display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:12px; font-size:10px; font-weight:600; text-transform:uppercase; font-family:var(--fm); background:rgba(16,185,129,0.08); color:#10b981; border:1px solid rgba(16,185,129,0.18);">
          <span style="width:5px; height:5px; border-radius:50%; background:#10b981;"></span>Admin</span>`
      : `<span style="display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:12px; font-size:10px; font-weight:600; text-transform:uppercase; font-family:var(--fm); background:rgba(59,130,246,0.08); color:#3b82f6; border:1px solid rgba(59,130,246,0.18);">
          <span style="width:5px; height:5px; border-radius:50%; background:#3b82f6;"></span>Operador</span>`;
          
    const acciones = esAdmin
      ? `<span style="font-family:var(--fm); font-size:11px; color:var(--t4); padding-right:12px;">Bypass de borrado</span>`
      : `<div style="display:flex; gap:8px; justify-content:flex-end;">
           <button class="btn bg2 bsm" style="border-radius:6px; padding:6px 12px; font-size:11px;" onclick="openModalCuenta('${u}')">Editar</button>
           <button class="btn bd bsm" style="border-radius:6px; padding:6px 12px; font-size:11px;" onclick="eliminarCuenta('${u}')">Eliminar</button>
         </div>`;
         
    return `<tr style="border-bottom:1px solid var(--bdr); transition:background 0.2s;">
      <td style="padding:14px 16px; font-family:var(--fmono); font-size:12px; color:var(--t1); font-weight:500;">@${u}</td>
      <td style="padding:14px 16px; font-size:12px; color:var(--t2); font-weight:400;">${d.name}</td>
      <td style="padding:14px 16px;">${badge}</td>
      <td style="padding:14px 16px; text-align:right;">${acciones}</td>
    </tr>`;
  }).join('');
  
  document.getElementById('cuentas-tbody').innerHTML = rows || '<tr><td colspan="4" class="empty">Sin usuarios</td></tr>';
}

function openModalCuenta(username=null){
  _editUser = username;
  const editing = username && USERS[username];
  document.getElementById('m-cuenta-title').textContent = editing ? 'Editar usuario' : 'Nuevo usuario';
  document.getElementById('cu-nombre').value = editing ? USERS[username].name : '';
  document.getElementById('cu-user').value   = editing ? username : '';
  document.getElementById('cu-user').disabled = !!editing;
  document.getElementById('cu-pass').value   = '';
  document.getElementById('cu-pass2').value  = '';
  document.getElementById('cu-err').textContent = '';

  const passWrap = document.getElementById('cu-pass').closest('.fg');
  const pass2Wrap = document.getElementById('cu-pass2').closest('.fg');
  let note = document.getElementById('cu-fb-note');
  if (!note) {
    note = document.createElement('div');
    note.id = 'cu-fb-note';
    note.style.cssText = 'background:rgba(59,130,246,.08);border:1px solid rgba(59,130,246,.25);border-radius:7px;padding:10px 12px;font-size:11px;color:var(--t2);line-height:1.4;margin-bottom:12px;';
    const mbody = document.querySelector('#m-cuenta .mbody');
    mbody.insertBefore(note, mbody.firstChild);
  }

  if (passWrap) passWrap.style.display = 'block';
  if (pass2Wrap) pass2Wrap.style.display = 'block';
  note.style.display = 'none';

  openModal('m-cuenta');
}

function saveCuenta(){
  const nombre = document.getElementById('cu-nombre').value.trim();
  const user   = document.getElementById('cu-user').value.trim().toLowerCase().replace(/\s/g,'');
  const pass   = document.getElementById('cu-pass').value;
  const pass2  = document.getElementById('cu-pass2').value;
  const err    = document.getElementById('cu-err');

  if(!nombre || !user){ err.textContent='Nombre y usuario son obligatorios.'; return; }
  if(!_editUser && USERS[user]){ err.textContent='Ese nombre de usuario ya existe.'; return; }
  if(user === 'admin' && !_editUser){ err.textContent='El usuario "admin" está reservado.'; return; }
  
  if(!_editUser || pass){
    if(pass.length < 4){ err.textContent='La contraseña debe tener al menos 4 caracteres.'; return; }
    if(pass !== pass2){ err.textContent='Las contraseñas no coinciden.'; return; }
  }

  if(_editUser){
    USERS[_editUser].name = nombre;
    if(pass) USERS[_editUser].pass = pass;
  } else {
    USERS[user] = {
      name: nombre, 
      role: 'operador',
      email: `${user}@alquileres.com`
    };
    USERS[user].pass = pass;
  }
  save();
  closeModal('m-cuenta');
  renderCuentas();
}

function eliminarCuenta(username){
  showConfirm(`¿Eliminar usuario "${username}"?`,'Esta acción no se puede deshacer.', ()=>{
    delete USERS[username];
    save();
    renderCuentas();
  });
}

function serverSetStatus(state){
  const dot   = document.getElementById('drive-dot');
  const lbl   = document.getElementById('drive-label');
  const panel = document.getElementById('drive-status');
  const typeLbl = document.getElementById('server-type-label');
  if(!dot) return;

  if (typeLbl) {
    typeLbl.textContent = 'Servidor local';
  }

  const map = {
    ok:     {color:'#10b981', text:'Guardado ✓',    border:'rgba(16,185,129,.3)'},
    saving: {color:'#fbbf24', text:'Guardando...',   border:'var(--bdr)'},
    error:  {color:'#f87171', text:'Sin servidor',   border:'rgba(248,113,113,.25)'}
  };
  const s = map[state] || map.error;
  dot.style.background       = s.color;
  if(lbl)   lbl.textContent  = s.text;
  if(panel) panel.style.borderColor = s.border;
}

function driveConnect(){ /* no-op en modo Flask */ }
function driveTryReconnect(){ /* no-op en modo Flask */ }

// ══ CHECKLIST — Lógica de Datos ══
const CHECKLIST_DEFAULT_TASKS = [
  "Solicitar factura al dueño del local",
  "Enviar factura al franquiciado (transfieren)",
  "Confirmar ingreso de pago para transferir al dueño",
  "Pasar pago a administración para que pague al dueño",
  "Compartir comprobante de pago al dueño"
];

function getChecklist(mes, tiendaId){
  if(!CHECKLIST[mes]) CHECKLIST[mes] = {};
  if(!CHECKLIST[mes][tiendaId]){
    // Generar tareas por defecto si no existen
    CHECKLIST[mes][tiendaId] = CHECKLIST_DEFAULT_TASKS.map((t, idx) => ({
      id: 'tk_' + Date.now() + '_' + idx,
      text: t,
      done: false
    }));
  }
  return CHECKLIST[mes][tiendaId];
}

function toggleTask(mes, tiendaId, taskId){
  const list = getChecklist(mes, tiendaId);
  const task = list.find(t => t.id === taskId);
  if(task){
    task.done = !task.done;
    save();
    renderChecklist(); // Refrescar UI
  }
}

// ══ CHECKLIST — Lógica de UI ══
function resetChecklistMes(){
  const input = document.getElementById('cl-mes');
  if(input){
    const ahora = new Date();
    input.value = ahora.toISOString().slice(0, 7);
    renderChecklist();
  }
}

function renderChecklist(){
  const input = document.getElementById('cl-mes');
  if(!input.value) resetChecklistMes();
  const mes = input.value;
  const content = document.getElementById('checklist-content');
  
  // Sincronizar etiqueta de impresión
  const printMes = document.getElementById('cl-print-mes');
  if(printMes && mes){
    const [y, m] = mes.split('-');
    printMes.textContent = `Periodo: ${MESES[parseInt(m)-1]} ${y}`;
  }
  

  // 2. Filtrar tiendas cargadas en el checklist del mes
  const tiendasEnChecklist = TIENDAS.filter(t => t.id && CHECKLIST[mes] && CHECKLIST[mes][t.id]);
  if(!tiendasEnChecklist.length){
    content.innerHTML = '<div class="cl-empty">No hay tiendas en el checklist de este mes. Seleccioná una tienda de la lista superior para agregarla.</div>';
    const progressFill = document.getElementById('cl-progress-fill');
    if(progressFill) progressFill.style.width = '0%';
    const stats = document.getElementById('cl-stats');
    if(stats) stats.innerHTML = `Progreso mensual: <strong>0%</strong> (0/0 tareas completadas)`;
    return;
  }

  // Agrupar por tipo
  const grupos = {
    'FRANQUICIAS': tiendasEnChecklist.filter(t => t.tipo === 'FRANQUICIA'),
    'SUCURSALES': tiendasEnChecklist.filter(t => t.tipo === 'SUCURSAL')
  };

  let html = '';
  let totalTasks = 0;
  let completedTasks = 0;

  for(const [label, tiendas] of Object.entries(grupos)){
    if(!tiendas.length) continue;
    html += `<div class="section-title" style="margin: 24px 0 12px;">${label}</div>`;
    
    tiendas.forEach(t => {
      const tasks = getChecklist(mes, t.id);
      totalTasks += tasks.length;
      completedTasks += tasks.filter(tk => tk.done).length;

      html += `
        <div class="cl-section-card">
          <table class="cl-table">
            <tr class="cl-tienda-header">
              <td colspan="3">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <strong style="color:var(--acc); font-family:var(--fh); font-size:14px;">${t.nombre}</strong>
                    <div class="cl-meta">${t.prop || '—'} · ${t.resp || '—'}</div>
                  </div>
                  <div style="display:flex; align-items:center; gap:10px;">
                    <div style="font-family:var(--fm); font-size:10px; color:var(--t3); margin-right:5px;">
                      ${tasks.filter(tk => tk.done).length}/${tasks.length}
                    </div>
                    <button class="btn bg2 bsm" onclick="addChecklistTaskForTienda('${t.id}')" title="Agregar tarea a esta tienda" style="padding:4px 8px;font-size:10.5px;">
                      + Tarea
                    </button>
                    <button class="btn bd bsm" onclick="removeTiendaFromChecklist('${t.id}')" title="Quitar tienda de este mes" style="padding:4px 8px;font-size:10.5px;">
                      Quitar
                    </button>
                  </div>
                </div>
              </td>
            </tr>
            ${tasks.map(tk => `
              <tr class="cl-task-row ${tk.done ? 'done-row' : ''}" onclick="toggleTask('${mes}', '${t.id}', '${tk.id}')">
                <td class="cl-check-cell">
                  <div class="cl-checkbox ${tk.done ? 'checked' : ''}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                </td>
                <td class="cl-task-text">${tk.text}</td>
                <td style="text-align:right; width:40px;">
                  <button class="cl-delete-btn" onclick="event.stopPropagation(); deleteChecklistTask('${mes}', '${t.id}', '${tk.id}')">×</button>
                </td>
              </tr>
            `).join('')}
          </table>
        </div>
      `;
    });
  }

  content.innerHTML = html || '<div class="cl-empty">Sin tiendas para mostrar.</div>';

  // Actualizar barra de progreso y stats
  const pct = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const progressFill = document.getElementById('cl-progress-fill');
  if(progressFill) progressFill.style.width = pct + '%';
  
  const stats = document.getElementById('cl-stats');
  if(stats) stats.innerHTML = `Progreso mensual: <strong>${pct}%</strong> (${completedTasks}/${totalTasks} tareas completadas)`;
}

function openAddTiendaChecklistModal(){
  const input = document.getElementById('cl-mes');
  if(!input) return;
  const mes = input.value;
  const listEl = document.getElementById('cl-tiendas-disponibles-list');
  if(!listEl) return;

  const tiendasDisponibles = TIENDAS.filter(t => t.id && (!CHECKLIST[mes] || !CHECKLIST[mes][t.id])).sort((a,b)=>a.nombre.localeCompare(b.nombre,'es'));
  
  if(!tiendasDisponibles.length){
    listEl.innerHTML = '<div style="text-align:center; padding:20px; color:var(--t3); font-size:12px;">Todas las tiendas activas ya están en el checklist de este mes.</div>';
  } else {
    let html = '';
    tiendasDisponibles.forEach(t => {
      html += `
        <div onclick="addTiendaToChecklist('${t.id}'); closeModal('m-add-tienda-cl');" class="smenu-item" style="padding:10px 12px; border-radius:6px; border:1px solid var(--bdr); display:flex; align-items:center; justify-content:space-between; cursor:pointer; background:var(--s1); transition: all 0.2s;">
          <div style="text-align:left;">
            <strong style="color:var(--t1); font-size:12.5px; font-family:var(--fh);">${t.nombre}</strong>
            <div style="font-size:10px; color:var(--t3); margin-top:2px;">Propietario: ${t.prop || '—'} · Tipo: ${t.tipo}</div>
          </div>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--acc); flex-shrink:0;">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </div>
      `;
    });
    listEl.innerHTML = html;
  }
  openModal('m-add-tienda-cl');
}

function addTiendaToChecklist(tiendaId){
  if(!tiendaId) return;
  const input = document.getElementById('cl-mes');
  const mes = input.value;
  if(!CHECKLIST[mes]) CHECKLIST[mes] = {};
  if(!CHECKLIST[mes][tiendaId]){
    CHECKLIST[mes][tiendaId] = CHECKLIST_DEFAULT_TASKS.map((t, idx) => ({
      id: 'tk_' + Date.now() + '_' + idx,
      text: t,
      done: false
    }));
    save();
    renderChecklist();
  }
}

function addChecklistTaskForTienda(tiendaId){
  const text = prompt('Nueva tarea para esta tienda:');
  if(!text || !text.trim()) return;
  const input = document.getElementById('cl-mes');
  const mes = input.value;
  const list = getChecklist(mes, tiendaId);
  list.push({
    id: 'tk_custom_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
    text: text.trim(),
    done: false
  });
  save();
  renderChecklist();
}

function removeTiendaFromChecklist(tiendaId){
  showConfirm('¿Quitar tienda de la Checklist?', 'Se eliminarán sus tareas asociadas para este mes.', () => {
    const input = document.getElementById('cl-mes');
    const mes = input.value;
    if(CHECKLIST[mes] && CHECKLIST[mes][tiendaId]){
      delete CHECKLIST[mes][tiendaId];
      save();
      renderChecklist();
    }
  });
}

function deleteChecklistTask(mes, tiendaId, taskId){
  showConfirm('¿Eliminar tarea?', 'Esta acción solo afectará a esta tienda en este mes.', () => {
    if(CHECKLIST[mes] && CHECKLIST[mes][tiendaId]){
      CHECKLIST[mes][tiendaId] = CHECKLIST[mes][tiendaId].filter(tk => tk.id !== taskId);
      save();
      renderChecklist();
    }
  });
}

function openModalChecklistTask(){
  const input = document.getElementById('cl-mes');
  const mes = input.value;
  
  const tiendasEnChecklist = TIENDAS.filter(t => t.id && CHECKLIST[mes] && CHECKLIST[mes][t.id]);
  if(!tiendasEnChecklist.length){
    showConfirm('No hay tiendas', 'Agregá al menos una tienda a la checklist antes de crear una tarea global.', () => {}, true);
    return;
  }
  
  const text = prompt('Nueva tarea para TODAS las tiendas cargadas en este mes:');
  if(!text || !text.trim()) return;
  
  tiendasEnChecklist.forEach(t => {
    const list = getChecklist(mes, t.id);
    list.push({
      id: 'tk_custom_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
      text: text.trim(),
      done: false
    });
  });

  save();
  renderChecklist();
}

function saveCustomCell(tid,colId,val){
  const t=TIENDAS.find(x=>x.id===tid);
  if(!t)return;
  if(!t.customData)t.customData={};
  t.customData[colId]=val;
  save();
}

function seed(){
  // Sin datos de ejemplo — se carga desde data.json
}


// ══ AUTH ══
async function doLogin(){
  const u = document.getElementById('lu').value.trim().toLowerCase();
  const p = document.getElementById('lp').value;
  const e = document.getElementById('lerr');
  const btn = document.querySelector('#login .lbtn');

  if (!u || !p) {
    e.textContent = 'Usuario y contraseña son requeridos';
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'VERIFICANDO...';
  }
  e.textContent = '';

  try {
    const sb = await getSupabase();
    if (sb) {
      // 1. Intentar autenticación segura mediante RPC en Supabase (evita exponer la tabla de usuarios)
      const { data: rpcRes, error: rpcErr } = await sb.rpc('login_user', {
        p_username: u,
        p_password: p
      });

      if (!rpcErr && rpcRes && rpcRes.success) {
        CU = {
          username: rpcRes.username,
          name: rpcRes.name,
          role: rpcRes.role
        };
        sessionStorage.setItem('ga_user', JSON.stringify(CU));
        const isAdminUser = CU.role === 'admin';
        window.location.href = isAdminUser ? 'cuentas.html' : 'dashboard.html';
        return;
      }

      if (!rpcErr && rpcRes && !rpcRes.success) {
        e.textContent = 'Usuario o contraseña incorrectos';
        if (btn) { btn.disabled = false; btn.textContent = 'ENTRAR AL SISTEMA →'; }
        return;
      }

      // 2. Si RPC no está instalada, intentar consulta a tabla usuarios (si RLS lo permite)
      const resUsers = await sb.from('usuarios').select('*');
      if (resUsers.data && resUsers.data.length > 0) {
        USERS = {};
        resUsers.data.forEach(usr => {
          if (usr.username) {
            USERS[usr.username.toLowerCase()] = {
              name: usr.name || usr.username,
              pass: usr.pass || '',
              role: usr.role || 'operador'
            };
          }
        });
      }
    }
  } catch (err) {
    console.error('[LOGIN EXCEPTION]', err);
  }

  // 3. Fallback a evaluación contra USERS (datos cargados/locales)
  let matchedUser = USERS[u];
  let matchedUsername = u;

  if (!matchedUser) {
    const key = Object.keys(USERS).find(k => k === u || (USERS[k].email && USERS[k].email.toLowerCase() === u));
    if (key) {
      matchedUser = USERS[key];
      matchedUsername = key;
    }
  }

  if (matchedUser && String(matchedUser.pass) === String(p)) {
    CU = { username: matchedUsername, ...matchedUser };
    sessionStorage.setItem('ga_user', JSON.stringify(CU));
    const isAdminUser = matchedUser.role === 'admin';
    window.location.href = isAdminUser ? 'cuentas.html' : 'dashboard.html';
    return;
  } else {
    e.textContent = 'Usuario o contraseña incorrectos';
  }

  if (btn) {
    btn.disabled = false;
    btn.textContent = 'ENTRAR AL SISTEMA →';
  }
}

function applyPermisos(){
  const admin = isAdmin();
  const itemCuentas = document.querySelector('#server-menu .smenu-item[onclick*="cuentas"]');
  if(itemCuentas) itemCuentas.style.display = admin ? '' : 'none';
  const itemVaciar = document.querySelector('.smenu-danger');
  if(itemVaciar) itemVaciar.style.display = admin ? '' : 'none';
  
  const btnCuenta = document.getElementById('btn-nueva-cuenta');
  if(btnCuenta) btnCuenta.style.display = admin ? '' : 'none';
  
  const navCuentas = document.getElementById('nav-cuentas');
  if(navCuentas) navCuentas.style.display = admin ? 'flex' : 'none';
  
  // Ocultar elementos de navegación operativa en la barra lateral para el admin
  const navItems = document.querySelectorAll('.sidebar .nav');
  navItems.forEach(nav => {
    const isCuentas = nav.id === 'nav-cuentas' || nav.getAttribute('onclick')?.includes('cuentas');
    if (admin) {
      nav.style.display = isCuentas ? 'flex' : 'none';
    } else {
      nav.style.display = isCuentas ? 'none' : 'flex';
    }
  });

  // Ocultar etiquetas de sección en la barra lateral para el admin
  const ssecs = document.querySelectorAll('.sidebar .ssec');
  ssecs.forEach(s => s.style.display = admin ? 'none' : '');

  // Ocultar widget del estado del servidor para el admin
  const driveStatus = document.getElementById('drive-status');
  if(driveStatus) driveStatus.style.display = admin ? 'none' : 'flex';
  
  if (CU) {
    const uname = document.getElementById('uname');
    if(uname) uname.textContent = CU.name;
    const roleEl = document.getElementById('urole');
    if(roleEl) roleEl.textContent = admin ? 'administrador' : 'operador';
  }
}

function doLogout(){
  sessionStorage.removeItem('ga_user');
  window.location.href = 'index.html';
}

// ══ NAV ══

function goPage(id, el){
  closeMobSidebar();
  const pageId = getCurrentPageId();
  if (id === pageId) return;

  // Registrar página actual en historial antes de cambiar
  if (pageId !== 'login' && pageId !== 'legajo') {
    if (!NAV_HISTORY.includes(pageId)) {
      NAV_HISTORY.push(pageId);
      if (NAV_HISTORY.length > 20) NAV_HISTORY.shift();
      saveNavHistory();
    }
  }

  if (id === 'dashboard') {
    window.location.href = 'dashboard.html';
  } else {
    window.location.href = id + '.html';
  }
}

function goBack(){
  window.location.href = 'dashboard.html';
}

function updateBackButtons(){
  const hasPrev = NAV_HISTORY.length > 0;
  document.querySelectorAll('.back-btn').forEach(b => {
    b.style.display = hasPrev ? 'inline-flex' : 'none';
  });
}
function renderAll(){
  renderCurrentPage();
  updateBadge();
  renderTriage();
}

// ══ UTILS ══
function pd(s){return s?new Date(s+'T00:00:00'):null;}
function fd(s){if(!s)return'—';return pd(s).toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'});}
function fdm(s){if(!s)return'—';return pd(s).toLocaleDateString('es-AR',{month:'short',year:'numeric'});}
function fm(n){if(!n&&n!==0)return'—';if(n===0)return'$ 0';return'$ '+Math.round(n).toLocaleString('es-AR');}
function dh(s){if(!s)return null;return Math.round((pd(s)-new Date())/864e5);}
function mesesRestantes(s){const d=dh(s);if(d===null)return null;return Math.round(d/30);}

function getProxAjuste(t){
  if(!t.ini)return null;
  const m={Mensual:1,Trimestral:3,Cuatrimestral:4,Semestral:6,Anual:12}[t.ajuste]||6;
  const ini=pd(t.ini);const hoy=new Date();
  let p=new Date(ini);while(p<=hoy)p.setMonth(p.getMonth()+m);
  return p.toISOString().slice(0,10);
}
function calcFactorIPC(ini,tipo,hasta,desfase=1,am=6){
  if(!ini||!IPC_DATA.length)return null;
  const iniDate = pd(ini); if(!iniDate) return null;
  
  let hastaDate;
  if(hasta) {
    hastaDate = pd(hasta);
  } else {
    hastaDate = new Date();
  }
  
  const diffMonths = (hastaDate.getFullYear() - iniDate.getFullYear()) * 12 + (hastaDate.getMonth() - iniDate.getMonth());
  const periodos = Math.max(0, Math.floor(diffMonths / am));
  if (periodos <= 0) return 1;

  let factor = 1;

  for (let periodIndex = 1; periodIndex <= periodos; periodIndex++) {
    const factorStartMonth = new Date(iniDate);
    factorStartMonth.setMonth(iniDate.getMonth() + (periodIndex - 1) * am);
    
    const factorEndMonth = new Date(iniDate);
    factorEndMonth.setMonth(iniDate.getMonth() + periodIndex * am - 1);

    const sDate = new Date(factorStartMonth); sDate.setMonth(sDate.getMonth() - desfase);
    const fDate = new Date(factorEndMonth); fDate.setMonth(fDate.getMonth() - desfase);
    
    const sStr = `${sDate.getFullYear()}-${String(sDate.getMonth() + 1).padStart(2, '0')}`;
    const fStr = `${fDate.getFullYear()}-${String(fDate.getMonth() + 1).padStart(2, '0')}`;

    const expectedMonths = am;
    let pFac = 1;
    let count = 0;
    
    IPC_DATA.forEach(d => {
      if (d.mes >= sStr && d.mes <= fStr) {
        const p = tipo === 'IPC Cuyo' ? d.cuy : d.nac;
        if (p !== undefined && p !== null && !isNaN(p)) {
          pFac *= (1 + p / 100);
          count++;
        }
      }
    });

    if (count < expectedMonths) return null;
    factor *= pFac;
  }

  return factor;
}

function calcFactorIPCEstimado(ini, tipo, hasta, desfase = 1, am = 6) {
  if (!ini) return 1;
  const iniDate = pd(ini); if (!iniDate) return 1;

  let hastaDate = hasta ? pd(hasta) : new Date();
  const diffMonths = (hastaDate.getFullYear() - iniDate.getFullYear()) * 12 + (hastaDate.getMonth() - iniDate.getMonth());
  const periodos = Math.max(0, Math.floor(diffMonths / am));
  if (periodos <= 0) return 1;

  let factor = 1;
  const dataset = (IPC_DATA && IPC_DATA.length > 0) ? IPC_DATA : DEFAULT_IPC_DATA;

  for (let periodIndex = 1; periodIndex <= periodos; periodIndex++) {
    const factorStartMonth = new Date(iniDate);
    factorStartMonth.setMonth(iniDate.getMonth() + (periodIndex - 1) * am);

    const factorEndMonth = new Date(iniDate);
    factorEndMonth.setMonth(iniDate.getMonth() + periodIndex * am - 1);

    const sDate = new Date(factorStartMonth); sDate.setMonth(sDate.getMonth() - desfase);
    const fDate = new Date(factorEndMonth); fDate.setMonth(fDate.getMonth() - desfase);

    const sStr = `${sDate.getFullYear()}-${String(sDate.getMonth() + 1).padStart(2, '0')}`;
    const fStr = `${fDate.getFullYear()}-${String(fDate.getMonth() + 1).padStart(2, '0')}`;

    const expectedMonths = am;
    let pFac = 1;
    let count = 0;

    dataset.forEach(d => {
      if (d.mes >= sStr && d.mes <= fStr) {
        const p = tipo === 'IPC Cuyo' ? d.cuy : d.nac;
        if (p !== undefined && p !== null && !isNaN(p)) {
          pFac *= (1 + p / 100);
          count++;
        }
      }
    });

    if (count < expectedMonths) {
      if (count > 0) {
        const avg = Math.pow(pFac, 1 / count);
        pFac *= Math.pow(avg, expectedMonths - count);
      } else {
        const avgRecent = (typeof getPromedioInflacionReciente === 'function') ? getPromedioInflacionReciente(tipo, sStr) : 2.5;
        pFac = Math.pow(1 + (avgRecent / 100), expectedMonths);
      }
    }
    factor *= pFac;
  }

  return (isNaN(factor) || factor <= 0) ? 1 : factor;
}
function getMontoActual(t, targetDateStr = null, retornarDetalle = false){
  if(!t.monto) return retornarDetalle ? { montoActual: 0, factor: 1, desfase: 1, periodos: 0, detalle: 'Sin monto inicial', hastaDate: '' } : 0;
  const m={Mensual:1,Trimestral:3,Cuatrimestral:4,Semestral:6,Anual:12}[t.ajuste]||6;
  const iniDate = pd(t.ini); if(!iniDate) return retornarDetalle ? { montoActual: t.monto, factor: 1, desfase: 1, periodos: 0, detalle: 'Sin fecha de inicio', hastaDate: '' } : t.monto;
  const targetDate = targetDateStr ? pd(targetDateStr) : new Date();
  const diffMonths = (targetDate.getFullYear() - iniDate.getFullYear()) * 12 + (targetDate.getMonth() - iniDate.getMonth());
  const periodos = Math.max(0, Math.floor(diffMonths / m));
  const fDate = new Date(iniDate); fDate.setMonth(iniDate.getMonth() + periodos * m);
  const hastaDate = `${fDate.getFullYear()}-${String(fDate.getMonth() + 1).padStart(2, '0')}`;
  const desfase = t.desfase !== undefined ? t.desfase : 1;

  let nuevo = t.monto;
  let factor = 1;
  let det = '';

  if(t.indice==='Fijo'){
    if(t.pctFijo) {
      factor = Math.pow(1 + t.pctFijo/100, periodos);
      nuevo = t.monto * factor;
      det = `+${t.pctFijo}% fijo por período (${periodos} períodos)`;
    } else {
      det = 'Aumento fijo del 0%';
    }
  }
  else if(t.indice==='ICL'){
    if(!t.iclIni) {
      nuevo = t.monto;
      det = 'Sin ICL inicial registrado';
    } else {
      const iclDate = new Date(fDate);
      iclDate.setMonth(iclDate.getMonth() - desfase);
      const iclMesTarget = `${iclDate.getFullYear()}-${String(iclDate.getMonth() + 1).padStart(2, '0')}`;
      const d=IPC_DATA.find(x=>x.mes===iclMesTarget) || [...IPC_DATA].reverse().find(x=>x.mes<=iclMesTarget && x.icl);
      if(!d || !d.icl) {
        nuevo = t.monto;
        det = `ICL no cargado para ${fdm(iclMesTarget)}`;
      } else {
        factor = d.icl / t.iclIni;
        nuevo = t.monto * factor;
        det = `ICL ${t.iclIni} → ${d.icl} (Desfase: ${desfase} mes/es)`;
      }
    }
  }
  else if(t.indice==='Manual'||t.indice==='CCT 130/75') {
    nuevo = t.monto;
    det = t.indice==='Manual' ? 'Acuerdo manual con propietario' : 'Ajuste según C.C.T. 130/75 (Vendedor A)';
  } else {
    const m={Mensual:1,Trimestral:3,Cuatrimestral:4,Semestral:6,Anual:12}[t.ajuste]||6;
    const factorIPC = calcFactorIPC(t.ini, t.indice, hastaDate, desfase, m);
    if (factorIPC === null) {
      factor = 1;
      nuevo = t.monto;
      det = 'Índices IPC no cargados completamente para el período';
    } else {
      factor = factorIPC;
      nuevo = t.monto * factor;
      det = `IPC acumulado (Desfase: ${desfase} mes/es)`;
    }
  }
  
  if (retornarDetalle) {
    return {
      montoActual: nuevo,
      factor: factor,
      desfase: desfase,
      periodos: periodos,
      detalle: det,
      hastaDate: hastaDate
    };
  }
  return nuevo;
}

function toggleIndiceFields(val){
  const wrap=document.getElementById('t-indice-extra'), icl=document.getElementById('t-icl-extra'), fijo=document.getElementById('t-fijo-extra');
  if(!wrap)return;
  wrap.style.display=(val==='ICL'||val==='Fijo')?'block':'none';
  icl.style.display=val==='ICL'?'block':'none';
  fijo.style.display=val==='Fijo'?'block':'none';
}
function getEstCon(fin, tipo){
  if(!fin)return{l:'Sin fecha',c:'bgr'};
  const d=dh(fin);
  if(d<0)return{l:'VENCIDO',c:'br'};
  if(d<=30)return{l:`${d}d`,c:'br'};
  if(d<=90)return{l:`${d}d`,c:'by'};
  if(tipo === 'cau') return{l:'AL DÍA',c:'bg'};
  return{l:'TODO EN ORDEN',c:'bg'};
}
function getEstGen(t){
  const faltantes=[t.locFin,t.subFin,t.cauFin,t.fraFin].filter(f=>!f).length;
  if(faltantes===4)return{l:'Sin fechas',c:'bgr'};
  if([t.locFin,t.subFin,t.cauFin,t.fraFin].some(f=>f&&dh(f)<0))return{l:'Con vencimientos',c:'br'};
  if(faltantes>0)return{l:'Fechas faltantes',c:'by'};
  if([t.locFin,t.subFin,t.cauFin,t.fraFin].some(f=>{const d=dh(f);return d>=0&&d<=90;}))return{l:'Revisar',c:'by'};
  if(t.irreg)return{l:'Irregularidades',c:'by'};
  return{l:'TODO EN ORDEN',c:'bg'};
}

// ══ ALERTS ══
function buildAlerts(){
  const a=[];
  TIENDAS.forEach(t=>{
    const chk=[[t.locFin,'Locación'],[t.subFin,'Sublocación'],[t.cauFin,'Caución'],[t.fraFin,'Franquicia']];
    chk.forEach(([f,lbl])=>{
      if(!f){a.push({type:'w',txt:`Fecha faltante — ${t.nombre}`,sub:`${lbl} sin fecha cargada`, tiendaId: t.id, tiendaNombre: t.nombre});return;}
      const d=dh(f);
      if(d<0)a.push({type:'',txt:`${lbl} VENCIDA — ${t.nombre}`,sub:`Venció hace ${Math.abs(d)} días`, tiendaId: t.id, tiendaNombre: t.nombre});
      else if(d<=60)a.push({type:'w',txt:`${lbl} por vencer — ${t.nombre}`,sub:`Vence en ${d} días (${fd(f)})`, tiendaId: t.id, tiendaNombre: t.nombre});
    });
    const pa=getProxAjuste(t);
    if(pa){const d=dh(pa);if(d>=0&&d<=30)a.push({type:'i',txt:`Ajuste de canon próximo — ${t.nombre}`,sub:`Actualizar en ${d} días · ${t.ajuste} · ${t.indice}`, tiendaId: t.id, tiendaNombre: t.nombre});}
    if(t.irreg)a.push({type:'w',txt:`Irregularidad — ${t.nombre}`,sub:t.irreg, tiendaId: t.id, tiendaNombre: t.nombre});
  });
  return a;
}
function updateBadge(){
  const n=buildAlerts().filter(a=>a.type==='').length;
  const el=document.getElementById('nbadge');
  if(el){ el.textContent=n||''; el.style.display=n?'':'none'; }
}

// ══ DASHBOARD ══
let DASH_FILTRO_TIPO = 'TODAS';

function setDashFiltro(tipo, el){
  DASH_FILTRO_TIPO = tipo;
  const parent = document.getElementById('dash-filtro-tipo');
  if (parent) {
    parent.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
  }
  if (el) el.classList.add('active');
  renderDashboard();
}

let TIENDAS_FILTRO_TIPO = 'TODAS';

function setTiendasFiltro(tipo, el){
  TIENDAS_FILTRO_TIPO = tipo;
  const parent = document.getElementById('tiendas-filtro-tipo');
  if (parent) {
    parent.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
  }
  if (el) el.classList.add('active');
  renderTbody();
}

// ══ DASHBOARD ══
function renderDashboard(){
  document.getElementById('dash-fecha').textContent='// '+new Date().toLocaleDateString('es-AR',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  const t=TIENDAS.length,vc=TIENDAS.filter(t=>[t.locFin,t.subFin,t.cauFin,t.fraFin].some(f=>f&&dh(f)<0)).length;
  const pv=TIENDAS.filter(t=>[t.locFin,t.subFin,t.cauFin,t.fraFin].some(f=>f&&dh(f)>=0&&dh(f)<=60)).length;
  const aj=TIENDAS.filter(t=>{const p=getProxAjuste(t);return p&&dh(p)>=0&&dh(p)<=30;}).length;
  document.getElementById('dash-stats').innerHTML=`
    <div class="scard y"><div class="slbl">Total tiendas</div><div class="sval">${t}</div><div class="shit">${TIENDAS.filter(x=>x.tipo==='FRANQUICIA').length} franq · ${TIENDAS.filter(x=>x.tipo==='SUCURSAL').length} suc</div></div>
    <div class="scard r"><div class="slbl">Contratos vencidos</div><div class="sval">${vc}</div><div class="shit">Acción inmediata</div></div>
    <div class="scard b"><div class="slbl">Por vencer (60d)</div><div class="sval">${pv}</div><div class="shit">Próximos vencimientos</div></div>
    <div class="scard g"><div class="slbl">Ajustes en 30d</div><div class="sval">${aj}</div><div class="shit">Cánones a actualizar</div></div>
  `;

  // Actualizar el badge de alertas críticas en la cabecera
  const als=buildAlerts().filter(a=>a.type==='');
  const badgeAlertas = document.getElementById('dash-badge-alertas');
  if(badgeAlertas) {
    if(als.length > 0) {
      badgeAlertas.textContent = als.length;
      badgeAlertas.style.display = 'inline-flex';
    } else {
      badgeAlertas.style.display = 'none';
    }
  }

  // Filtrado y renderizado de la lista de tiendas
  const q=(document.getElementById('search-dash')?.value||'').toLowerCase().trim();
  let tiendas = TIENDAS;
  if (DASH_FILTRO_TIPO !== 'TODAS') {
    tiendas = tiendas.filter(t => t.tipo === DASH_FILTRO_TIPO);
  }
  if (q) {
    tiendas = tiendas.filter(t => t.nombre.toLowerCase().includes(q) || t.prop?.toLowerCase().includes(q) || t.resp?.toLowerCase().includes(q));
  }

  document.getElementById('dash-tbody').innerHTML=tiendas.map(t=>{
    const pa=getProxAjuste(t);const eg=getEstGen(t);const el=getEstCon(t.locFin, 'loc');const ec=getEstCon(t.cauFin, 'cau');
    return`<tr>
      <td><span style="cursor:pointer;color:var(--acc);font-weight:600;" onclick="verLegajo('${t.id}')">${t.nombre}</span></td>
      <td><span style="font-family:var(--fm);font-size:10px;color:var(--t3)">${t.tipo}</span></td>
      <td style="font-family:var(--fm);font-size:11px;color:var(--t2)">${t.ajuste}</td>
      <td style="font-family:var(--fm);font-size:11.5px">${fm(getMontoActual(t))}</td>
      <td style="font-family:var(--fm);font-size:11px;color:var(--t2)">${pa?fd(pa):'—'}</td>
      <td><span class="badge ${el.c}">${el.l}</span></td>
      <td><span class="badge ${ec.c}">${ec.l}</span></td>
      <td><span class="badge ${eg.c}">${eg.l}</span></td>
    </tr>`;
  }).join('')||'<tr><td colspan="8" class="empty">Sin tiendas</td></tr>';
}

// ══ TIENDAS LIST — con filtros, sort, sticky, column toggle ══

// Recalcula el `left` de cada columna sticky/pinned leyendo anchos reales del DOM.
function recalcPinnedLeft(){
  const table=document.getElementById('tiendas-table');
  if(!table)return;
  const visCols=COLS.filter(c=>c.visible);
  const ths=[...table.querySelectorAll('thead tr th')];
  let acc=0;
  const leftMap={};
  ths.forEach((th,i)=>{
    const col=visCols[i];
    if(!col)return;
    if(col.sticky||col.pinned){
      leftMap[i]=acc;
      acc+=th.offsetWidth;
    }
  });
  table.querySelectorAll('tr').forEach(row=>{
    [...row.querySelectorAll('th,td')].forEach((cell,i)=>{
      if(leftMap[i]!==undefined) cell.style.left=leftMap[i]+'px';
    });
  });
}

// Definición de columnas
const COLS=[
  {id:'nombre',  label:'Tienda',                     sticky:false, visible:true,  filtro:'none'},
  {id:'prop',    label:'Franquiciado / Propietario', sticky:false, visible:true,  filtro:'none'},
  {id:'dir',     label:'Dirección',                  sticky:false, visible:true,  filtro:'none'},
  {id:'tipo',    label:'Tipo',         sticky:false, visible:false, filtro:'none'},
  {id:'resp',    label:'Resp. pago',   sticky:false, visible:false, filtro:'none'},
  {id:'ajuste',  label:'Ajuste',       sticky:false, visible:false, filtro:'none'},
  {id:'indice',  label:'Índice',       sticky:false, visible:false, filtro:'none'},
  {id:'ini',     label:'Inicio',       sticky:false, visible:false, filtro:'none'},
  {id:'locFin',  label:'Locación',     sticky:false, visible:false, filtro:'none'},
  {id:'subFin',  label:'Sublocación',  sticky:false, visible:false, filtro:'none'},
  {id:'cauFin',  label:'Caución',      sticky:false, visible:false, filtro:'none'},
  {id:'fraFin',  label:'Franquicia',   sticky:false, visible:false, filtro:'none'},
  {id:'monto',   label:'Monto inic.',  sticky:false, visible:false, filtro:'none'},
  {id:'estado',  label:'Estado',       sticky:false, visible:false, filtro:'none'},
  {id:'acciones',label:'',             sticky:false, visible:true,  filtro:'none'},
];

let TFILTROS={};   // {colId: valor}
let TSORT={col:null, dir:1};

function getColVisible(){return COLS.filter(c=>c.visible);}

// ── Column panel ──
let _cpTab='vis'; // tab activo: vis | names | new

function switchCPTab(tab){
  _cpTab=tab;
  ['vis','new'].forEach(t=>{
    const btn=document.getElementById('cptab-'+t);
    const pnl=document.getElementById('cpanel-'+t);
    if(!btn||!pnl)return;
    const isActive=t===tab;
    btn.style.background=isActive?'var(--acc)':'none';
    btn.style.color=isActive?'#fff':'var(--t2)';
    btn.style.fontWeight=isActive?'700':'400';
    pnl.style.display=isActive?'block':'none';
  });
  if(tab==='vis')initColVis();
  if(tab==='new')initCustomColsList();
}

function initColPanel(){
  if(_cpTab==='new')initCustomColsList();
  else initColVis();
}

// Tab visibles
function initColVis(){
  const wrap=document.getElementById('col-checkboxes');
  if(!wrap)return;
  wrap.innerHTML='';
  COLS.filter(c=>c.id!=='acciones').forEach(col=>{
    const chip=document.createElement('div');
    chip.className='col-cb'+(col.visible?' active':'');
    chip.style.cssText='display:inline-flex;align-items:center;gap:0;padding:0;overflow:hidden;position:relative;';

    const toggleBtn=document.createElement('span');
    toggleBtn.style.cssText='padding:5px 8px 5px 10px;cursor:pointer;display:flex;align-items:center;gap:5px;flex:1;font-size:10px;';
    toggleBtn.innerHTML=(col.sticky?'<span style="font-size:11px;">🔒</span> ':'')+
      (col.pinned&&!col.sticky?'<span style="font-size:10px;color:var(--acc);">📌</span> ':'')+
      `<span class="chip-label-text">${col.label}</span>`;
    toggleBtn.title=col.sticky?'Esta columna no se puede ocultar':(col.visible?'Clic para ocultar':'Clic para mostrar');
    toggleBtn.addEventListener('click',e=>{
      e.stopPropagation();
      if(col.sticky)return;
      col.visible=!col.visible;
      chip.classList.toggle('active',col.visible);
      saveColConfig();
      renderThead();renderTbody();
    });

    const sep=document.createElement('span');
    sep.style.cssText='width:1px;background:rgba(255,255,255,.08);align-self:stretch;flex-shrink:0;';

    const menuBtn=document.createElement('button');
    menuBtn.style.cssText='padding:5px 7px;background:none;border:none;cursor:pointer;color:var(--t3);font-size:13px;line-height:1;transition:color .15s;';
    menuBtn.textContent='⋯';
    menuBtn.title='Opciones';
    menuBtn.addEventListener('mouseenter',()=>menuBtn.style.color='var(--t1)');
    menuBtn.addEventListener('mouseleave',()=>menuBtn.style.color='var(--t3)');
    menuBtn.addEventListener('click',e=>{
      e.stopPropagation();
      openColCtxMenu(menuBtn,col,()=>initColVis());
    });

    chip.appendChild(toggleBtn);
    chip.appendChild(sep);
    chip.appendChild(menuBtn);
    wrap.appendChild(chip);
  });
}

// Tab nueva columna
function toggleNewColOpts(val){
  const el = document.getElementById('newcol-opts-wrap');
  if(el) el.style.display=val==='select'?'block':'none';
}

function addCustomCol(){
  const label=document.getElementById('newcol-label').value.trim();
  const tipo=document.getElementById('newcol-tipo').value;
  const opts=document.getElementById('newcol-opts')?.value||'';
  if(!label){showConfirm('Campo obligatorio','Ingresá un nombre para la columna.',()=>{},true);return;}
  const id='custom_'+Date.now();
  const newCol={
    id,label,sticky:false,visible:true,
    filtro:tipo==='select'?'select':'text',
    custom:true,tipo,
    opts:tipo==='select'?opts.split(',').map(s=>s.trim()).filter(Boolean):[]
  };
  const accIdx=COLS.findIndex(c=>c.id==='acciones');
  COLS.splice(accIdx,0,newCol);
  saveColConfig();
  document.getElementById('newcol-label').value='';
  document.getElementById('newcol-opts').value='';
  initCustomColsList();
  renderThead();renderTbody();
}

function deleteCustomCol(id){
  const col=COLS.find(c=>c.id===id);
  if(!col)return;
  const overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:999999;display:flex;align-items:center;justify-content:center;';
  const box=document.createElement('div');
  box.style.cssText='background:#141414;border:1px solid #2e2e2e;border-radius:12px;padding:24px;max-width:320px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.6);';
  box.innerHTML=`
    <div style="font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:#f5f5f5;margin-bottom:8px;">Eliminar columna</div>
    <div style="font-size:12.5px;color:#b0b0b0;margin-bottom:20px;">¿Eliminar la columna <strong style="color:#f5f5f5;">"${col.label}"</strong>? Se perderán todos los datos ingresados en esa columna.</div>
    <div style="display:flex;gap:8px;justify-content:flex-end;">
      <button id="_del_cancel" style="padding:7px 16px;background:none;border:1px solid #2e2e2e;border-radius:6px;color:#b0b0b0;font-size:12px;cursor:pointer;">Cancelar</button>
      <button id="_del_ok" style="padding:7px 16px;background:#f87171;border:none;border-radius:6px;color:#fff;font-size:12px;font-weight:700;cursor:pointer;">Eliminar</button>
    </div>`;
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  document.getElementById('_del_cancel').onclick=()=>overlay.remove();
  document.getElementById('_del_ok').onclick=()=>{
    overlay.remove();
    const idx=COLS.findIndex(c=>c.id===id);
    if(idx>-1)COLS.splice(idx,1);
    TIENDAS.forEach(t=>{if(t.customData)delete t.customData[id];});
    saveColConfig();save();
    renderThead();renderTbody();
    initColVis();
    initCustomColsList();
  };
}

function initCustomColsList(){
  const wrap=document.getElementById('custom-cols-list');
  if(!wrap)return;
  const custom=COLS.filter(c=>c.custom);
  if(!custom.length){wrap.innerHTML='<div style="font-family:var(--fm);font-size:10px;color:var(--t4);">Sin columnas personalizadas aún.</div>';return;}
  wrap.innerHTML='<div style="font-family:var(--fm);font-size:9px;color:var(--t3);margin-bottom:8px;">Columnas creadas:</div>'+
    custom.map(c=>`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--bdr);">
      <span style="font-family:var(--fm);font-size:11px;color:var(--t1);flex:1;">${c.label}</span>
      <span style="font-family:var(--fm);font-size:9px;color:var(--t3);">${c.tipo}</span>
      <button class="btn bd bxs" onclick="deleteCustomCol('${c.id}')">Eliminar</button>
    </div>`).join('');
}

function saveColConfig(){
  const cfg=COLS.map(c=>({id:c.id,label:c.label,visible:c.visible,pinned:c.pinned||false,custom:c.custom||false,tipo:c.tipo||null,opts:c.opts||[],filtro:c.filtro}));
  localStorage.setItem('ga_cols_v3',JSON.stringify(cfg));
}

function loadColConfig(){
  const raw=localStorage.getItem('ga_cols_v3');
  // Forzamos visibilidad de columnas fijas solicitadas por el usuario
  const fijas = ['nombre', 'prop', 'dir', 'acciones'];
  COLS.forEach(c => {
    c.visible = fijas.includes(c.id);
    if(c.id === 'prop') c.label = 'Franquiciado / Propietario';
  });

  if(!raw)return;
  try{
    const cfg=JSON.parse(raw);
    cfg.forEach(cc=>{
      const col=COLS.find(c=>c.id===cc.id);
      // Solo aplicamos configuración de visibilidad a columnas que no son las fijas básicas
      if(col && !fijas.includes(cc.id)){col.label=cc.label;col.visible=cc.visible;col.pinned=cc.pinned||false;}
    });
    const accIdx=COLS.findIndex(c=>c.id==='acciones');
    cfg.filter(cc=>cc.custom&&!COLS.find(c=>c.id===cc.id)).forEach(cc=>{
      COLS.splice(accIdx,0,{...cc,sticky:false});
    });
  }catch(e){}
}

function toggleColPanel(){
  const p=document.getElementById('col-panel');
  const isOpen=p.style.display!=='none'&&p.style.display!=='';
  p.style.display=isOpen?'none':'block';
  if(!isOpen){switchCPTab(_cpTab);}
}

// ── Helpers ──
function getTiendaEstadoVal(t,colId){
  switch(colId){
    case 'nombre': return t.nombre;
    case 'tipo':   return t.tipo;
    case 'prop':   return t.prop||'';
    case 'resp':   return t.resp||'';
    case 'ajuste': return t.ajuste;
    case 'indice': return t.indice;
    case 'ini':    return t.ini||'';
    case 'locFin': return getEstCon(t.locFin, 'loc').l;
    case 'subFin': return getEstCon(t.subFin, 'sub').l;
    case 'cauFin': return getEstCon(t.cauFin, 'cau').l;
    case 'fraFin': return getEstCon(t.fraFin, 'fra').l;
    case 'monto':  return t.monto||0;
    case 'estado': return getEstGen(t).l;
    default:
      return (t.customData&&t.customData[colId])||'';
  }
}
function getSelectOpts(colId){
  const vals=new Set();
  TIENDAS.forEach(t=>vals.add(String(getTiendaEstadoVal(t,colId)).trim()));
  return[...vals].filter(Boolean).sort();
}

function resetFiltros(){
  TFILTROS={};TSORT={col:null,dir:1};
  const s=document.getElementById('search-t');if(s)s.value='';
  renderThead();renderTbody();
}

function updateFiltrosChips(){
  const wrap=document.getElementById('filtros-activos');
  const btn=document.getElementById('btn-reset-filtros');
  if(!wrap)return;
  const q=(document.getElementById('search-t')?.value||'').trim();
  const chips=[];
  if(q)chips.push({label:`Búsqueda: "${q}"`,key:'_search'});
  Object.entries(TFILTROS).forEach(([k,v])=>{
    if(v){const col=COLS.find(c=>c.id===k);chips.push({label:`${col?col.label:k}: ${v}`,key:k});}
  });
  wrap.innerHTML=chips.map(c=>`<span class="fchip">${c.label}<button onclick="clearFiltro('${c.key}')">×</button></span>`).join('');
  if(btn)btn.style.display=chips.length?'inline-flex':'none';
}

function clearFiltro(key){
  if(key==='_search'){const s=document.getElementById('search-t');if(s)s.value='';}
  else delete TFILTROS[key];
  const el=document.getElementById('tf-'+key);
  if(el)el.value='';
  renderTbody();
}

function setFiltro(colId,val){
  TFILTROS[colId]=val;
  renderTbody();
}

function sortBy(colId){
  if(TSORT.col===colId)TSORT.dir*=-1;else{TSORT.col=colId;TSORT.dir=1;}
  document.querySelectorAll('.th-label[data-col]').forEach(el=>{
    const isSorted=el.dataset.col===colId;
    el.classList.toggle('sorted',isSorted);
    const ico=el.querySelector('.th-sort-ico');
    if(ico){
      if(isSorted&&TSORT.dir===1)ico.innerHTML='<polyline points="6,15 12,9 18,15"/>';
      else if(isSorted&&TSORT.dir===-1)ico.innerHTML='<polyline points="6,9 12,15 18,9"/>';
      else ico.innerHTML='<polyline points="6,9 12,4 18,9"/><polyline points="6,15 12,20 18,15"/>';
    }
  });
  renderTbody();
}

// ── THEAD ──
let _activeCtxMenu=null;

function closeAllCtxMenus(){
  if(_activeCtxMenu){
    _activeCtxMenu.remove();
    _activeCtxMenu=null;
  }
  document.querySelectorAll('.th-menu-btn.open').forEach(b=>b.classList.remove('open'));
}

document.addEventListener('mousedown',e=>{
  if(_activeCtxMenu && !_activeCtxMenu.contains(e.target)){
    closeAllCtxMenus();
  }
});

function openColCtxMenu(btn, col, onAfter){
  if(_activeCtxMenu){
    closeAllCtxMenus();
    return;
  }
  btn.classList.add('open');
  const menu=document.createElement('div');
  menu.className='th-ctx-menu';
  menu.style.cssText='position:fixed;z-index:99999;background:#141414;border:1px solid #2e2e2e;border-radius:8px;padding:4px;width:max-content;min-width:160px;max-width:220px;box-shadow:0 12px 32px rgba(0,0,0,.7);';

  function menuItem(iconPath, label, cls, onClick){
    const item=document.createElement('button');
    item.type='button';
    item.style.cssText='display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:5px;font-size:12px;color:'+(cls==='danger'?'#f87171':'#b0b0b0')+';cursor:pointer;background:none;border:none;width:100%;text-align:left;font-family:inherit;';
    item.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">${iconPath}</svg> ${label}`;
    item.addEventListener('mouseenter',()=>item.style.background='#222222');
    item.addEventListener('mouseleave',()=>item.style.background='none');
    item.addEventListener('mousedown',e=>e.stopPropagation());
    item.addEventListener('click',e=>{
      e.stopPropagation();
      onClick();
    });
    return item;
  }

  function menuSep(){
    const s=document.createElement('div');
    s.style.cssText='height:1px;background:#2e2e2e;margin:3px 0;';
    return s;
  }

  menu.appendChild(menuItem(
    '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    'Renombrar','',
    ()=>{
      menu.innerHTML='';
      menu.style.minWidth='200px';
      const wrap=document.createElement('div');
      wrap.style.cssText='padding:8px;display:flex;flex-direction:column;gap:6px;';
      const hint=document.createElement('div');
      hint.style.cssText='font-size:9px;color:#737373;font-family:monospace;';
      hint.textContent='Nuevo nombre:';
      const inp=document.createElement('input');
      inp.value=col.label;
      inp.style.cssText='background:#0c0c0c;border:1px solid #10b981;border-radius:5px;padding:6px 8px;color:#f5f5f5;font-size:12px;outline:none;width:100%;';
      const row=document.createElement('div');
      row.style.cssText='display:flex;gap:5px;';
      const ok=document.createElement('button');
      ok.type='button'; ok.textContent='Guardar';
      ok.style.cssText='flex:1;background:#10b981;color:#fff;border:none;border-radius:5px;padding:5px;font-size:11px;font-weight:700;cursor:pointer;';
      const cancel=document.createElement('button');
      cancel.type='button'; cancel.textContent='Cancelar';
      cancel.style.cssText='flex:1;background:none;color:#b0b0b0;border:1px solid #2e2e2e;border-radius:5px;padding:5px;font-size:11px;cursor:pointer;';
      const apply=()=>{
        const nv=inp.value.trim();
        if(nv){ col.label=nv; saveColConfig(); const span=document.querySelector('.th-label[data-col="'+col.id+'"] .th-label-text'); if(span)span.textContent=nv; }
        closeAllCtxMenus(); initColVis(); if(onAfter)onAfter();
      };
      ok.addEventListener('click',apply);
      cancel.addEventListener('click',()=>closeAllCtxMenus());
      inp.addEventListener('keydown',e=>{if(e.key==='Enter')apply();if(e.key==='Escape')closeAllCtxMenus();e.stopPropagation();});
      inp.addEventListener('mousedown',e=>e.stopPropagation());
      ok.addEventListener('mousedown',e=>e.stopPropagation());
      cancel.addEventListener('mousedown',e=>e.stopPropagation());
      row.appendChild(ok);row.appendChild(cancel);
      wrap.appendChild(hint);wrap.appendChild(inp);wrap.appendChild(row);
      menu.appendChild(wrap);
      setTimeout(()=>{inp.focus();inp.select();},30);
    }
  ));

  menu.appendChild(menuSep());
  const isPinned=col.pinned||false;
  menu.appendChild(menuItem(
    isPinned
      ? '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'
      : '<line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z"/>',
    isPinned?'Desfijar columna':'Fijar columna','',
    ()=>{ closeAllCtxMenus(); showConfirm('Función en desarrollo','La función de fijar columnas está temporalmente deshabilitada.',()=>{},true); }
  ));

  menu.appendChild(menuSep());
  if(!col.sticky){
    menu.appendChild(menuItem(
      '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>',
      'Ocultar columna','',
      ()=>{ col.visible=false; saveColConfig(); closeAllCtxMenus(); renderThead();renderTbody(); initColVis(); if(onAfter)onAfter(); }
    ));
  }

  if(col.custom){
    menu.appendChild(menuSep());
    menu.appendChild(menuItem(
      '<polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>',
      'Eliminar columna','danger',
      ()=>{ closeAllCtxMenus(); setTimeout(()=>deleteCustomCol(col.id),50); }
    ));
  }

  document.body.appendChild(menu);
  _activeCtxMenu=menu;
  const r=btn.getBoundingClientRect();
  const mw=180;
  let left=r.left;
  if(left+mw>window.innerWidth-8)left=window.innerWidth-mw-8;
  if(left<8)left=8;
  menu.style.left=left+'px';
  menu.style.top=(r.bottom+4)+'px';
}

function renderThead(){
  const visCols=COLS.filter(c=>c.visible);
  const theadEl=document.getElementById('tiendas-thead');
  if(!theadEl)return;
  const tr=document.createElement('tr');
  visCols.forEach(col=>{
    const th=document.createElement('th');
    if(col.sticky){th.classList.add('sticky-col');}
    else if(col.pinned){th.classList.add('sticky-col','col-pinned');}
    th.style.position='relative';
    // Aplicar anchos proporcionales
    if(col.id === 'acciones'){
      th.style.width = '160px';
    } else if(col.id === 'nombre'){
      th.style.width = '30%';
    } else if(col.id === 'prop'){
      th.style.width = '30%';
    } else if(col.id === 'dir'){
      th.style.width = '40%';
    }
    const wrap=document.createElement('div');
    wrap.className='th-wrap';
    wrap.style.cssText='display:flex;flex-direction:column;gap:4px;';
    if(col.id!=='acciones'){
      const topRow=document.createElement('div');
      topRow.style.cssText='display:flex;align-items:center;gap:3px;min-width:0;';
      const lbl=document.createElement('div');
      lbl.className='th-label'+(TSORT.col===col.id?' sorted':'');
      lbl.dataset.col=col.id;
      lbl.style.cssText='display:flex;align-items:center;gap:4px;cursor:pointer;flex:1;min-width:0;overflow:hidden;';
      const labelText=document.createElement('span');
      labelText.className='th-label-text';
      labelText.textContent=col.label;
      labelText.style.cssText='overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
      const sortSvg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      sortSvg.setAttribute('class','th-sort-ico');
      sortSvg.setAttribute('viewBox','0 0 24 24');
      sortSvg.setAttribute('fill','none');
      sortSvg.setAttribute('stroke','currentColor');
      sortSvg.setAttribute('stroke-width','2');
      sortSvg.innerHTML=TSORT.col===col.id&&TSORT.dir===1?'<polyline points="6,15 12,9 18,15"/>':TSORT.col===col.id?'<polyline points="6,9 12,15 18,9"/>':'<polyline points="6,9 12,4 18,9"/><polyline points="6,15 12,20 18,15"/>';
      lbl.appendChild(labelText); lbl.appendChild(sortSvg);
      lbl.addEventListener('click',()=>sortBy(col.id));
      const menuBtn=document.createElement('button');
      menuBtn.className='th-menu-btn';
      menuBtn.textContent='⋯';
      menuBtn.addEventListener('click',e=>{e.stopPropagation();openColCtxMenu(menuBtn,col);});
      topRow.appendChild(lbl); topRow.appendChild(menuBtn);
      wrap.appendChild(topRow);
    }else{
      const lbl=document.createElement('div');lbl.className='th-label';lbl.textContent='';wrap.appendChild(lbl);
    }
    th.appendChild(wrap); tr.appendChild(th);
  });
  theadEl.innerHTML=''; theadEl.appendChild(tr);
  requestAnimationFrame(()=>recalcPinnedLeft());
}

function renderTbody(){
  const q=(document.getElementById('search-t')?.value||'').toLowerCase().trim();
  const visCols=COLS.filter(c=>c.visible);
  let lista=TIENDAS.filter(t=>{
    if(TIENDAS_FILTRO_TIPO!=='TODAS'&&t.tipo!==TIENDAS_FILTRO_TIPO)return false;
    if(q){
      const matchName=t.nombre.toLowerCase().includes(q);
      const matchProp=(t.prop||'').toLowerCase().includes(q);
      const matchDir=(t.dir||'').toLowerCase().includes(q);
      const matchResp=(t.resp||'').toLowerCase().includes(q);
      if(!matchName&&!matchProp&&!matchDir&&!matchResp)return false;
    }
    return true;
  });
  if(TSORT.col){
    lista=[...lista].sort((a,b)=>{
      const av=getTiendaEstadoVal(a,TSORT.col),bv=getTiendaEstadoVal(b,TSORT.col);
      if(typeof av==='number')return(av-bv)*TSORT.dir;
      return String(av).localeCompare(String(bv))*TSORT.dir;
    });
  }
  const ce=document.getElementById('tiendas-count');
  if(ce)ce.textContent=`// ${lista.length} de ${TIENDAS.length} tiendas`;
  const tbody=document.getElementById('tiendas-tbody');
  if(!tbody)return;
  tbody.innerHTML=lista.map(t=>{
    const el=getEstCon(t.locFin, 'loc'),es=getEstCon(t.subFin, 'sub'),ec=getEstCon(t.cauFin, 'cau'),ef=getEstCon(t.fraFin, 'fra'),eg=getEstGen(t);
    function pinnedTd(content,colId){
      const col=COLS.find(c=>c.id===colId);
      if(!col)return`<td>${content}</td>`;
      if(col.sticky)return`<td class="sticky-col">${content}</td>`;
      if(col.pinned)return`<td class="sticky-col col-pinned">${content}</td>`;
      return`<td>${content}</td>`;
    }
    const cm={
      nombre:pinnedTd(`<span style="cursor:pointer;color:var(--acc);font-weight:600;" onclick="verLegajo('${t.id}')">${t.nombre}</span>${t.irreg?`<br><span style="font-family:var(--fm);font-size:9px;color:var(--warn)">⚠ ${t.irreg.slice(0,26)}…</span>`:''}`, 'nombre'),
      prop:`<td style="font-size:12px;color:var(--t2)">${t.prop||'—'}</td>`,
      dir:`<td style="font-size:12px;color:var(--t2);max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${t.dir||''}">${t.dir||'—'}</td>`,
      tipo:`<td><span style="font-family:var(--fm);font-size:10px;color:var(--t3)">${t.tipo}</span></td>`,
      resp:`<td style="font-size:12px;color:var(--t2)">${t.resp||'—'}</td>`,
      ajuste:`<td style="font-family:var(--fm);font-size:11px;color:var(--t2)">${t.ajuste}</td>`,
      indice:`<td style="font-family:var(--fm);font-size:11px;color:var(--t3)">${t.indice}</td>`,
      ini:`<td style="font-family:var(--fm);font-size:11px">${fdm(t.ini)}</td>`,
      locFin:`<td><span class="badge ${el.c}">${el.l}</span><br><span style="font-family:var(--fm);font-size:9px;color:var(--t3)">${fd(t.locFin)}</span></td>`,
      subFin:`<td><span class="badge ${es.c}">${es.l}</span><br><span style="font-family:var(--fm);font-size:9px;color:var(--t3)">${fd(t.subFin)}</span></td>`,
      cauFin:`<td><span class="badge ${ec.c}">${ec.l}</span><br><span style="font-family:var(--fm);font-size:9px;color:var(--t3)">${fd(t.cauFin)}</span></td>`,
      fraFin:`<td><span class="badge ${ef.c}">${ef.l}</span><br><span style="font-family:var(--fm);font-size:9px;color:var(--t3)">${fd(t.fraFin)}</span></td>`,
      monto:`<td style="font-family:var(--fm);font-size:11.5px">${fm(t.monto)}</td>`,
      estado:`<td><span class="badge ${eg.c}">${eg.l}</span></td>`,
      acciones:`<td><div style="display:flex;gap:4px;"><button class="btn ba bxs" onclick="verLegajo('${t.id}')">Legajo</button><button class="btn bg2 bxs" onclick="editTienda('${t.id}')">✏</button><button class="btn bd bxs" onclick="delTienda('${t.id}')">🗑</button></div></td>`,
    };
    visCols.filter(c=>c.custom).forEach(col=>{
      const val=(t.customData&&t.customData[col.id])||'';
      if(col.tipo==='select'&&col.opts&&col.opts.length){
        cm[col.id]=`<td><select class="th-filter" style="min-width:90px;" onchange="saveCustomCell('${t.id}','${col.id}',this.value)">
          <option value="">—</option>${col.opts.map(o=>`<option value="${o}"${val===o?' selected':''}>${o}</option>`).join('')}
        </select></td>`;
      }else{
        cm[col.id]=pinnedTd(`<input type="${col.tipo||'text'}" value="${val.replace(/"/g,'&quot;')}" placeholder="—"
          style="background:transparent;border:none;border-bottom:1px solid var(--bdr);color:var(--t1);font-family:var(--fb);font-size:12px;outline:none;width:100%;min-width:80px;padding:2px 4px;"
          onfocus="this.style.borderBottomColor='var(--acc)'" onblur="this.style.borderBottomColor='var(--bdr)';saveCustomCell('${t.id}','${col.id}',this.value)"
          onkeydown="if(event.key==='Enter')this.blur()"
        />`,col.id);
      }
    });
    return`<tr>${visCols.map(c=>cm[c.id]||'<td>—</td>').join('')}</tr>`;
  }).join('')||`<tr><td colspan="${visCols.length}" class="empty">Sin resultados.</td></tr>`;
  requestAnimationFrame(()=>recalcPinnedLeft());
}

function renderTiendas(){ renderThead(); renderTbody(); }

// ══ GRÁFICO DE EVOLUCIÓN DEL CANON ══
function getPromedioInflacionReciente(tipo, hastaMesStr) {
  if (!IPC_DATA || !IPC_DATA.length) return 3.0;
  const datosFiltrados = IPC_DATA
    .filter(d => d.mes <= hastaMesStr)
    .sort((a, b) => b.mes.localeCompare(a.mes));
  
  if (tipo === 'ICL') {
    const conIcl = datosFiltrados.filter(d => d.icl !== undefined && d.icl !== null);
    if (conIcl.length < 2) return 5.0;
    const tasas = [];
    const maxMeses = Math.min(4, conIcl.length);
    for (let i = 0; i < maxMeses - 1; i++) {
      const valActual = conIcl[i].icl;
      const valAnterior = conIcl[i+1].icl;
      if (valAnterior > 0) tasas.push((valActual / valAnterior) - 1);
    }
    if (!tasas.length) return 5.0;
    return (tasas.reduce((sum, val) => sum + val, 0) / tasas.length) * 100;
  } else {
    const campo = tipo === 'IPC Cuyo' ? 'cuy' : 'nac';
    const conIpc = datosFiltrados.filter(d => d[campo] !== undefined && d[campo] !== null && !isNaN(d[campo]));
    if (!conIpc.length) return 3.0;
    const ultimos = conIpc.slice(0, 3);
    return ultimos.reduce((acc, d) => acc + d[campo], 0) / ultimos.length;
  }
}

function getEvolucionCanon(t) {
  const m = { Mensual: 1, Trimestral: 3, Cuatrimestral: 4, Semestral: 6, Anual: 12 }[t.ajuste] || 6;
  const iniDate = pd(t.ini);
  if (!iniDate) return [];
  
  const hoy = new Date();
  const hoyMesStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  
  let finDate = t.locFin ? pd(t.locFin) : null;
  if (!finDate) {
    finDate = new Date(hoy);
    finDate.setMonth(finDate.getMonth() + 12);
  }
  
  const hitos = [];
  let currentHitoDate = new Date(iniDate);
  let periodos = 0;
  
  const promedioMensual = getPromedioInflacionReciente(t.indice, hoyMesStr);
  const factorAjusteProyectado = Math.pow(1 + promedioMensual / 100, m);
  let ultimoMontoCalculado = t.monto;
  
  while (currentHitoDate <= finDate) {
    const hitoMesStr = `${currentHitoDate.getFullYear()}-${String(currentHitoDate.getMonth() + 1).padStart(2, '0')}`;
    const esProyectado = hitoMesStr > hoyMesStr;
    
    let monto = t.monto;
    let factor = 1;
    let detalle = '';
    
    if (!esProyectado) {
      const calc = getMontoActual(t, hitoMesStr + '-01', true);
      monto = calc.montoActual;
      factor = calc.factor;
      detalle = calc.detalle;
      ultimoMontoCalculado = monto;
    } else {
      if (t.indice === 'Fijo') {
        factor = Math.pow(1 + (t.pctFijo || 0) / 100, periodos);
        monto = t.monto * factor;
        detalle = `+${t.pctFijo}% fijo por período (Proyectado)`;
      } else if (t.indice === 'Manual' || t.indice === 'CCT 130/75') {
        monto = ultimoMontoCalculado;
        factor = 1;
        detalle = t.indice === 'Manual' ? 'Manual (Proyectado plano)' : 'CCT (Proyectado plano)';
      } else {
        monto = ultimoMontoCalculado * factorAjusteProyectado;
        factor = monto / t.monto;
        detalle = `${t.indice} estimado (+${promedioMensual.toFixed(1)}% mensual promedio)`;
        ultimoMontoCalculado = monto;
      }
    }
    
    hitos.push({
      fecha: new Date(currentHitoDate),
      fechaStr: hitoMesStr,
      monto: monto,
      factor: factor,
      detalle: detalle,
      esProyectado: esProyectado
    });
    
    currentHitoDate.setMonth(currentHitoDate.getMonth() + m);
    periodos++;
  }
  return hitos;
}

function renderSvgEvolucion(hitos) {
  if (!hitos || hitos.length === 0) return `<div style="text-align:center;padding:50px 0;font-family:var(--fm);font-size:11px;color:var(--t3)">SIN HITOS DE AJUSTE DISPONIBLES</div>`;
  
  const width = 1000;
  const height = 280;
  const paddingLeft = 85;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 40;
  
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  
  const montos = hitos.map(h => h.monto);
  const maxMonto = Math.max(...montos) * 1.15;
  const minMonto = Math.min(...montos) * 0.85;
  const rangeY = maxMonto - minMonto || 1;
  
  const minTime = hitos[0].fecha.getTime();
  const maxTime = hitos[hitos.length - 1].fecha.getTime();
  const rangeX = maxTime - minTime || 1;
  
  function getX(fecha) {
    return paddingLeft + ((fecha.getTime() - minTime) / rangeX) * chartWidth;
  }
  
  function getY(monto) {
    return paddingTop + chartHeight - ((monto - minMonto) / rangeY) * chartHeight;
  }
  
  let pathReal = '';
  let pathProy = '';
  
  for (let i = 0; i < hitos.length; i++) {
    const h = hitos[i];
    const x = getX(h.fecha);
    const y = getY(h.monto);
    
    if (i === 0) {
      if (h.esProyectado) {
        pathProy = `M ${x} ${y}`;
      } else {
        pathReal = `M ${x} ${y}`;
      }
    } else {
      const prevH = hitos[i - 1];
      const prevX = getX(prevH.fecha);
      const prevY = getY(prevH.monto);
      
      if (h.esProyectado) {
        if (!pathProy) pathProy = `M ${prevX} ${prevY}`;
        pathProy += ` L ${x} ${prevY} L ${x} ${y}`;
      } else {
        pathReal += ` L ${x} ${prevY} L ${x} ${y}`;
      }
    }
  }
  
  let yTicks = '';
  for (let i = 0; i <= 4; i++) {
    const val = minMonto + (rangeY / 4) * i;
    const y = getY(val);
    yTicks += `
      <line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" stroke="var(--bdr)" stroke-width="1" stroke-dasharray="4,4" />
      <text x="${paddingLeft - 12}" y="${y + 4}" fill="var(--t3)" font-size="10" font-family="var(--fm)" text-anchor="end">$${Math.round(val).toLocaleString('es-AR')}</text>
    `;
  }
  
  let xTicks = '';
  const stepX = hitos.length > 8 ? 2 : 1;
  for (let i = 0; i < hitos.length; i += stepX) {
    const h = hitos[i];
    const x = getX(h.fecha);
    xTicks += `
      <line x1="${x}" y1="${paddingTop}" x2="${x}" y2="${height - paddingBottom}" stroke="var(--bdr)" stroke-width="1" stroke-dasharray="4,4" />
      <text x="${x}" y="${height - paddingBottom + 18}" fill="var(--t3)" font-size="10" font-family="var(--fm)" text-anchor="middle">${h.fecha.toLocaleDateString('es-AR', {month:'short', year:'2-digit'})}</text>
    `;
  }
  
  let dots = '';
  hitos.forEach(h => {
    const x = getX(h.fecha);
    const y = getY(h.monto);
    const color = h.esProyectado ? 'rgba(16, 185, 129, 0.4)' : 'var(--acc)';
    const strokeColor = h.esProyectado ? 'rgba(16, 185, 129, 0.8)' : '#ffffff';
    
    const tooltipData = JSON.stringify({
      mes: h.fecha.toLocaleDateString('es-AR', {month:'long', year:'numeric'}),
      monto: fm(h.monto),
      factor: h.factor.toFixed(4),
      detalle: h.detalle,
      tipo: h.esProyectado ? 'Proyectado' : 'Confirmado'
    }).replace(/"/g, '&quot;');
    
    dots += `<circle cx="${x}" cy="${y}" r="5" fill="${color}" stroke="${strokeColor}" stroke-width="1.5" class="chart-dot" data-info="${tooltipData}" />`;
  });
  
  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" class="chart-svg" xmlns="http://www.w3.org/2000/svg">
      ${yTicks}
      ${xTicks}
      ${pathReal ? `<path d="${pathReal}" fill="none" stroke="var(--acc)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />` : ''}
      ${pathProy ? `<path d="${pathProy}" fill="none" stroke="var(--acc)" stroke-dasharray="5,5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.7" />` : ''}
      ${dots}
    </svg>
  `;
}

function initGraficoInteractivo() {
  const container = document.querySelector('.chart-container');
  if (!container) return;
  
  const tooltip = container.querySelector('.chart-tooltip');
  if (!tooltip) return;
  
  const dots = container.querySelectorAll('.chart-dot');
  dots.forEach(dot => {
    dot.addEventListener('mouseenter', () => {
      const dataStr = dot.getAttribute('data-info');
      if (!dataStr) return;
      
      const data = JSON.parse(dataStr.replace(/&quot;/g, '"'));
      tooltip.innerHTML = `
        <div class="ct-type">// AJUSTE ${data.tipo.toUpperCase()}</div>
        <div class="ct-mes">${data.mes}</div>
        <div class="ct-monto">${data.monto}</div>
        <div class="ct-factor">Coef: ${data.factor}</div>
        <div class="ct-det">${data.detalle}</div>
      `;
      
      const containerRect = container.getBoundingClientRect();
      const dotRect = dot.getBoundingClientRect();
      
      const x = dotRect.left - containerRect.left + dotRect.width / 2;
      const y = dotRect.top - containerRect.top - 8;
      
      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
      tooltip.style.opacity = '1';
      tooltip.style.transform = 'translate(-50%, -100%) scale(1)';
      dot.setAttribute('r', '7.5');
    });
    
    dot.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
      tooltip.style.transform = 'translate(-50%, -100%) scale(0.95)';
      dot.setAttribute('r', '5');
    });
  });
}

// ══ LEGAJO ══
function verLegajo(id){
  const pageId = getCurrentPageId();
  if (pageId !== 'legajo') {
    window.location.href = 'legajo.html?id=' + id;
    return;
  }
  const t=TIENDAS.find(x=>x.id===id);if(!t)return;
  EID = id;
  const breadcrumb = document.getElementById('leg-breadcrumb-name');
  if(breadcrumb) breadcrumb.textContent=t.nombre;
  const detalleAct=getMontoActual(t, null, true);
  const montoAct=detalleAct.montoActual;
  const pa=getProxAjuste(t);
  const eg=getEstGen(t);

  function bloqueContrato(titulo,ini,fin,color){
    const d=dh(fin);const m=mesesRestantes(fin);
    const pct=fin?(d!==null?Math.max(0,Math.min(100,100-(d/365)*100)):100):0;
    const pc=pct>85?'d':pct>60?'w':'';
    const est=getEstCon(fin, titulo.slice(2,5).toLowerCase());
    return`<div class="contrato-block">
      <div class="cb-header"><span class="cb-titulo">${titulo}</span><span class="badge ${est.c}">${est.l}</span></div>
      <div class="cb-body">
        <div class="cb-row"><span class="cb-label">Inicio</span><span class="cb-value">${fdm(ini)}</span></div>
        <div class="cb-row"><span class="cb-label">Vencimiento</span><span class="cb-value">${fdm(fin)}</span></div>
        ${fin?`<div class="progbar"><div class="progfill ${pc}" style="width:${pct}%"></div></div>
        <div class="cb-meses" style="color:${d===null?'var(--t3)':d<0?'var(--danger)':d<=30?'var(--danger)':d<=90?'var(--warn)':'var(--ok)'}">${m!==null?Math.abs(m):'-'}</div>
        <div class="cb-meses-lbl">${m===null?'sin datos':d<0?'meses vencido':'meses restantes'}</div>`
        :`<div style="text-align:center;padding:12px 0;font-family:var(--fm);font-size:10px;color:var(--t4)">SIN DATOS</div>`}
      </div>
    </div>`;
  }

  const yearActual=new Date().getFullYear();
  function pagoMiniCell(mi){
    const p=getPago(t.id,yearActual,mi);
    return`<div class="pcell ${pagoClass(p.estado)}" onclick="clickPago('${t.id}','${yearActual}',${mi},'${t.nombre}')">${pagoLabel(p.estado)}${p.monto?`<br><span style='font-size:9px;font-weight:400;'>${fmPago(p.monto)}</span>`:''}</div>`;
  }

  const fechasFaltantes=[['Locación',t.locFin],['Sublocación',t.subFin],['Caución',t.cauFin],['Franquicia',t.fraFin]].filter(([,f])=>!f).map(([l])=>l);
  const html=`
    ${fechasFaltantes.length?`<div style="background:rgba(251,191,36,.07);border:1px solid rgba(251,191,36,.3);border-radius:9px;padding:11px 15px;margin-bottom:14px;display:flex;align-items:center;gap:10px;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="color:var(--warn);flex-shrink:0;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <div style="font-family:var(--fm);font-size:11px;color:var(--warn);">Fechas de contrato faltantes: <strong>${fechasFaltantes.join(', ')}</strong><span style="color:var(--t3);margin-left:6px;">— Completá los datos para un seguimiento correcto.</span></div>
      <button class="btn bg2 bsm" style="margin-left:auto;flex-shrink:0;" onclick="editTienda('${t.id}')">Completar</button>
    </div>`:''}
    <div class="leg-header">
      <div class="leg-header-top">
        <div><div style="font-family:var(--fm);font-size:9px;color:var(--t3);letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px;">${t.tipo} · ID ${t.id}</div><div class="leg-nombre">${t.nombre}</div><div class="leg-badges"><span class="badge ${eg.c}">${eg.l}</span>${t.irreg?`<span class="badge by">⚠ ${t.irreg.slice(0,40)}</span>`:''}${t.adenda==='si'?`<span class="badge bgr">📎 Adenda: Sí</span>`:''}</div></div>
        <div class="leg-monto-big"><div class="leg-monto-lbl">// MONTO ACTUAL ESTIMADO</div><div class="leg-monto-val">${fm(montoAct)}</div><div class="leg-monto-sub">Monto inicial: ${fm(t.monto)}</div><div class="leg-monto-sub">${t.ajuste} · ${t.indice}</div><div style="font-family:var(--fm);font-size:9.5px;color:var(--t3);margin-top:4px;line-height:1.3;">${detalleAct.detalle} · Coef: ${detalleAct.factor.toFixed(4)}</div>${pa?`<div style="margin-top:6px;font-family:var(--fm);font-size:9px;color:var(--info);">Prox. ajuste: ${fd(pa)}</div>`:''}</div>
      </div>
      <div class="leg-header-bottom">
        <div class="leg-kv"><div class="leg-k">Propietario</div><div class="leg-v">${t.prop||'—'}</div></div>
        <div class="leg-kv"><div class="leg-k">Razón social</div><div class="leg-v">${t.razon||'—'}</div></div>
        <div class="leg-kv"><div class="leg-k">Inicio de contrato</div><div class="leg-v mono">${fdm(t.ini)}</div></div>
        <div class="leg-kv"><div class="leg-k">Día de pago</div><div class="leg-v mono">Día ${t.diapago||'—'}</div></div>
        <div class="leg-kv"><div class="leg-k">Adenda</div><div class="leg-v">${t.adenda==='si'?'Sí':'No'}</div></div>
      </div>
    </div>
    <div class="section-title">Evolución del Canon</div>
    <div class="chart-card">
      <div class="chart-container">
        <div class="chart-tooltip" style="opacity:0; pointer-events:none; position:absolute; z-index:100; transition: opacity .15s, transform .15s;"></div>
        ${renderSvgEvolucion(getEvolucionCanon(t))}
      </div>
    </div>
    <div class="section-title">contratos</div>
    <div class="contratos-grid">${bloqueContrato('📄 Locación',t.locIni,t.locFin,'var(--info)')}${bloqueContrato('📄 Sublocación',t.subIni,t.subFin,'var(--purple)')}${bloqueContrato('🔒 Caución',t.cauIni,t.cauFin,'var(--warn)')}${bloqueContrato('🏢 Franquicia',t.fraIni,t.fraFin,'var(--ok)')}</div>
    <div class="section-title">ajuste económico</div>
    <div class="leg-ajuste-box"><div class="laj-item"><div class="laj-lbl">Tipo de ajuste</div><div class="laj-val" style="font-size:16px">${t.ajuste}</div></div><div class="laj-item"><div class="laj-lbl">Índice</div><div class="laj-val" style="font-size:14px">${t.indice}</div></div><div class="laj-item"><div class="laj-lbl">Depósito / Caución</div><div class="laj-val" style="font-size:16px">${fm(t.dep)}</div></div></div>
    <div class="section-title">pagos ${yearActual}</div>
    <div class="card" style="overflow:hidden;"><div class="tw"><table class="leg-pagos-table"><thead><tr>${MESES.map((m,i)=>`<th>${m.slice(0,3)}</th>`).join('')}</tr></thead><tbody><tr>${MESES.map((_,i)=>`<td>${pagoMiniCell(i)}</td>`).join('')}</tr></tbody></table></div></div>
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-bottom:16px;">${MESES.map((m,mi)=>{const p=getPago(t.id,yearActual,mi);return p.obs?`<div style="background:var(--s2);border-radius:5px;padding:5px 7px;font-size:10px;color:var(--t2);"><span style="font-family:var(--fm);font-size:9px;color:var(--t3);">${m.slice(0,3)}</span><br>${p.obs}</div>`:'';}).filter(Boolean).join('')}</div>
    ${t.irreg?`<div class="section-title">irregularidades</div><div class="leg-irr"><div class="leg-irr-title">// ALERTA INTERNA</div><div class="leg-irr-text">${t.irreg}</div></div>`:''}
    ${t.obs?`<div class="section-title">observaciones</div><div class="leg-obs"><div class="leg-obs-title">// NOTAS</div><div class="leg-obs-text">${t.obs}</div></div>`:''}
    <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;"><button class="btn ba" onclick="editTienda('${t.id}')">✏ Editar tienda</button><button class="btn bg2" onclick="goPage('pagos',document.querySelectorAll('.nav')[2])">Ver todos los pagos</button><button class="btn bg2" onclick="archivarTienda('${t.id}')" style="color:var(--warn);border-color:rgba(251,191,36,.3);">📦 Archivar</button><button class="btn bd" onclick="delTienda('${t.id}')">🗑 Eliminar</button></div>`;
  const legContent = document.getElementById('legajo-content');
  if(legContent) {
    legContent.innerHTML=html;
    initGraficoInteractivo();
  }
}

// ══ PAGOS ══
function getPago(tid,year,mi){return PAGOS[`${tid}_${year}_${mi}`]||{};}
function setPago(tid,year,mi,data){PAGOS[`${tid}_${year}_${mi}`]=data;save();}
function pagoClass(e){
  if(!e)return'pc-vacio';const u=e.toUpperCase();
  if(u==='PAGADO')return'pc-pagado'; if(u==='PENDIENTE')return'pc-pendiente';
  if(u.includes('CERR'))return'pc-cerro'; if(u.includes('MATI'))return'pc-mati';
  return'pc-arregla';
}
function pagoLabel(e){
  if(!e)return'—';const u=e.toUpperCase();
  if(u==='PAGADO')return'Pagado'; if(u==='PENDIENTE')return'Pendiente';
  if(u.includes('CERR'))return'Cerrado'; if(u.includes('MATI'))return'Mati';
  return e.slice(0,8);
}
function fmPago(n){ return n ? '$\u202F'+n.toLocaleString('es-AR',{minimumFractionDigits:0,maximumFractionDigits:0}) : ''; }

function initYearPills(){
  const years=[2024,2025,2026,2027];
  const el = document.getElementById('year-pill-pagos');
  if(el) el.innerHTML=years.map(y=>`<button class="year-btn${y===YEAR_PAGOS?' active':''}" onclick="setYear(${y})">${y}</button>`).join('');
}
function setYear(y){YEAR_PAGOS=y;initYearPills();renderPagos();}

let PAGOS_SORT={col:'nombre',dir:1};
let PAGOS_FILTRO='';
let PAGOS_FILTRO_TIPO='TODAS';

function setPagoFiltro(f, el){
  PAGOS_FILTRO=f;
  if(el){
    el.parentNode.querySelectorAll('.pf-btn').forEach(b=>b.classList.remove('active'));
    el.classList.add('active');
  }
  renderPagos();
}

function setPagosFiltroTipo(tipo, el){
  PAGOS_FILTRO_TIPO=tipo;
  if(el){
    el.parentNode.querySelectorAll('.btn').forEach(b=>b.classList.remove('active'));
    el.classList.add('active');
  }
  renderPagos();
}

function toggleAcordeon(headEl){
  const itemEl = headEl.closest('.pago-acordeon-item');
  if(!itemEl) return;
  const bodyEl = itemEl.querySelector('.pago-acordeon-body');
  const arrow = headEl.querySelector('.acordeon-arrow');
  if(!bodyEl) return;
  const isOpen = bodyEl.classList.contains('open');
  if(isOpen){
    bodyEl.classList.remove('open');
    if(arrow) arrow.style.transform = 'rotate(0deg)';
  } else {
    bodyEl.classList.add('open');
    if(arrow) arrow.style.transform = 'rotate(180deg)';
  }
}

function renderPagos(){
  const mesActual=new Date().getMonth();
  let totalCobrado=0,totalPendiente=0,sinRegistrar=0,totalTiendas=TIENDAS.length;
  TIENDAS.forEach(t=>{
    const p=getPago(t.id,YEAR_PAGOS,mesActual);
    if(p.estado==='PAGADO'||p.monto>0) totalCobrado+=p.monto||0;
    else if(p.estado==='PENDIENTE') totalPendiente+=t.monto||0;
    else if(!p.estado) sinRegistrar++;
  });
  const resEl=document.getElementById('pagos-resumen');
  if(resEl){
    const mesNom=new Date(YEAR_PAGOS,mesActual,1).toLocaleDateString('es-AR',{month:'long'});
    resEl.innerHTML=`<div style="background:var(--s2);border:1px solid var(--bdr);border-radius:8px;padding:12px 16px;"><div style="font-family:var(--fm);font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:var(--t3);">Cobrado (${mesNom})</div><div style="font-family:var(--fh);font-size:18px;font-weight:800;color:var(--ok);margin-top:3px;">${fm(totalCobrado)}</div></div><div style="background:var(--s2);border:1px solid var(--bdr);border-radius:8px;padding:12px 16px;"><div style="font-family:var(--fm);font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:var(--t3);">Pendiente (${mesNom})</div><div style="font-family:var(--fh);font-size:18px;font-weight:800;color:var(--danger);margin-top:3px;">${fm(totalPendiente)}</div></div><div style="background:var(--s2);border:1px solid var(--bdr);border-radius:8px;padding:12px 16px;"><div style="font-family:var(--fm);font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:var(--t3);">Sin registrar</div><div style="font-family:var(--fh);font-size:18px;font-weight:800;color:var(--warn);margin-top:3px;">${sinRegistrar} tienda${sinRegistrar!==1?'s':''}</div></div><div style="background:var(--s2);border:1px solid var(--bdr);border-radius:8px;padding:12px 16px;"><div style="font-family:var(--fm);font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:var(--t3);">Total tiendas activas</div><div style="font-family:var(--fh);font-size:18px;font-weight:800;color:var(--t1);margin-top:3px;">${totalTiendas}</div></div>`;
  }
  const q=(document.getElementById('search-p')?.value||'').toLowerCase().trim();
  const filteredT=TIENDAS.filter(t=>{
    if(PAGOS_FILTRO_TIPO!=='TODAS'&&t.tipo!==PAGOS_FILTRO_TIPO) return false;
    
    if(PAGOS_FILTRO){
      const p=getPago(t.id,YEAR_PAGOS,mesActual);
      if(PAGOS_FILTRO==='SIN_REGISTRAR'){
        if(p.estado) return false;
      } else {
        if(p.estado!==PAGOS_FILTRO) return false;
      }
    }
    
    if(q){
      const matchName=t.nombre.toLowerCase().includes(q);
      const matchProp=(t.prop||'').toLowerCase().includes(q);
      if(!matchName&&!matchProp) return false;
    }
    return true;
  }).sort((a,b)=>a.nombre.localeCompare(b.nombre,'es'));

  let html='';
  filteredT.forEach(t=>{
    const mesPagoAct=getPago(t.id,YEAR_PAGOS,mesActual);
    
    let monthsHtml='';
    MESES.forEach((m, mi)=>{
      const p=getPago(t.id,YEAR_PAGOS,mi);
      monthsHtml+=`
        <div class="pcell ${pagoClass(p.estado)}" onclick="event.stopPropagation();clickPago('${t.id}','${YEAR_PAGOS}',${mi},'${t.nombre}')" style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:8px 4px; border-radius:6px; cursor:pointer; min-height:50px; text-align:center;">
          <span style="font-family:var(--fm); font-size:9.5px; font-weight:600; text-transform:uppercase; opacity:0.85; margin-bottom:3px;">${m.slice(0,3)}</span>
          <span style="font-size:10px; font-weight:700; line-height:1.2;">${pagoLabel(p.estado)}</span>
          ${p.monto?`<span style="font-family:var(--fm); font-size:9px; font-weight:400; margin-top:2px; opacity:0.9;">${fmPago(p.monto)}</span>`:''}
        </div>
      `;
    });

    html+=`
      <div class="pago-acordeon-item">
        <div class="pago-acordeon-head" onclick="toggleAcordeon(this)">
          <div>
            <div style="font-size:13.5px; font-weight:700; color:var(--acc);">${t.nombre}</div>
            <div style="font-size:11px; color:var(--t2); margin-top:2px;">
              Propietario: <strong style="color:var(--t1);">${t.prop||'—'}</strong> &middot; Tipo: <strong style="color:var(--t1);">${t.tipo}</strong>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <span class="pcell ${pagoClass(mesPagoAct.estado)}" style="font-size:10px; font-weight:700; padding:4px 8px; border-radius:4px; pointer-events:none;">${pagoLabel(mesPagoAct.estado)}</span>
            <svg class="acordeon-arrow" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--t3);">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
        <div class="pago-acordeon-body">
          <div style="display:grid; grid-template-columns:repeat(6,1fr); gap:8px; padding:4px 0;">
            ${monthsHtml}
          </div>
        </div>
      </div>
    `;
  });

  if(html===''){
    html=`<div style="text-align:center; padding:40px; color:var(--t3); font-family:var(--fm); font-size:12px;">No se encontraron tiendas con los filtros seleccionados</div>`;
  }
  document.getElementById('pagos-wrap').innerHTML=html;
}

function exportarPagosCSV(){
  const cols=['Tienda','Propietario','Resp.',...MESES_S.map(m=>m+' Estado'),...MESES_S.map(m=>m+' Monto')];
  const rows=TIENDAS.map(t=>{
    const estados=MESES.map((_,mi)=>getPago(t.id,YEAR_PAGOS,mi).estado||''), montos=MESES.map((_,mi)=>getPago(t.id,YEAR_PAGOS,mi).monto||'');
    return[t.nombre,t.prop||'',t.resp||'',...estados,...montos];
  });
  const csv=[cols,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`pagos_${YEAR_PAGOS}.csv`; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),3000);
}

function clickPago(tid,year,mi,nombre){
  PCTX={tid,year,mi};
  const p=getPago(tid,year,mi), t=TIENDAS.find(x=>x.id===tid);
  document.getElementById('m-pago-title').textContent=`${nombre} — ${MESES[mi]} ${year}`;
  document.getElementById('p-estado').value=p.estado||'';
  document.getElementById('p-monto').value=p.monto||'';
  document.getElementById('p-obs').value=p.obs||'';
  const sugeridoEl=document.getElementById('p-monto-sugerido');
  if(t&&t.monto&&t.ini){
    const montoAct=getMontoActual(t);
    if(montoAct>0&&!p.monto){ sugeridoEl.style.display='block'; sugeridoEl.innerHTML=`↳ Monto estimado según ${t.indice}: <strong>${fm(montoAct)}</strong> — <span style="text-decoration:underline;">usar este monto</span>`; sugeridoEl.dataset.monto=Math.round(montoAct); }
    else sugeridoEl.style.display='none';
  } else sugeridoEl.style.display='none';
  openModal('m-pago');
}

function usarMontoSugerido(){
  const el=document.getElementById('p-monto-sugerido');
  document.getElementById('p-monto').value=el.dataset.monto||'';
  el.style.display='none';
}
function savePago(){
  if(!PCTX)return;
  setPago(PCTX.tid,PCTX.year,PCTX.mi,{estado:document.getElementById('p-estado').value,monto:parseFloat(document.getElementById('p-monto').value)||0,obs:document.getElementById('p-obs').value});
  closeModal('m-pago');renderPagos();
  const lp=document.getElementById('page-legajo');
  if(lp&&lp.classList.contains('active')){const n=document.getElementById('leg-breadcrumb-name').textContent;const t=TIENDAS.find(x=>x.nombre===n);if(t)verLegajo(t.id);}
}

// ══ ALERTAS ══
function renderAlertas(){
  const all=buildAlerts();const el=document.getElementById('alertas-content');
  if(!all.length){el.innerHTML='<div class="empty">// sin alertas activas ✓</div>';return;}
  // Excluimos las alertas de tipo 'i' (ajustes de canon próximos) de esta sección
  const g={vc:all.filter(a=>a.type===''),pv:all.filter(a=>a.type==='w'&&!a.txt.includes('Irregularidad')),irr:all.filter(a=>a.txt.includes('Irregularidad'))};
  let h='';
  function sec(list,color,label,isOpenDefault=false){
    if(!list.length)return'';
    let s='';
    list.forEach(a=>{s+=`<div class="alert ${a.type}"><div class="adot"></div><div class="atxt">${a.txt}<small>${a.sub}</small></div></div>`;});
    return `
      <div class="pago-acordeon-item" style="margin-bottom: 12px; border-left: 3px solid ${color};">
        <div class="pago-acordeon-head" onclick="toggleAcordeon(this)" style="padding: 12px 16px;">
          <div style="font-family:var(--fm);font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:${color};font-weight:700;display:flex;align-items:center;gap:6px;">
            <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${color};"></span>
            ${label} (${list.length})
          </div>
          <svg class="acordeon-arrow" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--t3); transition: transform 0.2s; ${isOpenDefault ? 'transform: rotate(180deg);' : ''}">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
        <div class="pago-acordeon-body ${isOpenDefault ? 'open' : ''}">
          <div style="display:flex; flex-direction:column; gap:6px; padding:4px 0;">
            ${s}
          </div>
        </div>
      </div>
    `;
  }
  h+=sec(g.vc,'var(--danger)','// vencidos',true); h+=sec(g.pv,'var(--warn)','// por vencer',false); h+=sec(g.irr,'var(--warn)','// irregularidades',false);
  el.innerHTML=h;
}

function renderAjustesPendientes(){
  const elWrap = document.getElementById('ajustes-pendientes-wrap');
  const elList = document.getElementById('ajustes-pendientes-list');
  if(!elWrap || !elList) return;

  const ajAlerts = buildAlerts().filter(a => a.type === 'i');
  if(!ajAlerts.length){
    elWrap.style.display = 'none';
    return;
  }

  elWrap.style.display = 'block';
  elList.innerHTML = ajAlerts.map(a => {
    const nombreTienda = a.txt.replace('Ajuste de canon próximo — ', '');
    const t = TIENDAS.find(x => x.nombre === nombreTienda);
    const tid = t ? t.id : '';
    
    return `<div class="alert i" onclick="fillFromTienda('${tid}')" style="cursor: pointer; transition: background 0.2s; margin-bottom: 4px;" onmouseenter="this.style.background='rgba(59,130,246,.08)'" onmouseleave="this.style.background=''">
      <div class="adot"></div>
      <div class="atxt">${a.txt}<small>${a.sub} — <span style="text-decoration: underline; color: var(--info);">Hacé clic para cargar en la calculadora</span></small></div>
    </div>`;
  }).join('');
}

// ══ CALCULADORA ══
function renderCalcTipo(){
  const t=document.getElementById('c-tipo').value;
  document.getElementById('c-icl-fields').style.display=t==='ICL'?'block':'none';
  document.getElementById('c-fijo-fields').style.display=t==='FIJO'?'block':'none';
  document.getElementById('c-cct-fields').style.display=t==='CCT'?'block':'none';
  document.getElementById('c-ipc-note').style.display=(t==='IPC_NAC'||t==='IPC_CUY')?'block':'none';
  calcular();
}

function calcNombreInput(val){
  const elNota = document.getElementById('c-datos-nota');
  if(elNota) elNota.style.display='none';
  calcular();
  const box=document.getElementById('c-suggest');
  if(!val.trim()){box.style.display='none';return;}
  const q=val.toLowerCase();
  const matches=TIENDAS.filter(t=>t.nombre.toLowerCase().includes(q)).slice(0,6);
  if(!matches.length){box.style.display='none';return;}
  box.innerHTML=matches.map(t=>`<div onmousedown="fillFromTienda('${t.id}')" style="padding:8px 12px;cursor:pointer;font-size:12px;color:var(--t1);border-bottom:1px solid var(--bdr);" onmouseenter="this.style.background='var(--s3)'" onmouseleave="this.style.background=''"><span style="font-weight:600;">${t.nombre}</span><span style="font-family:var(--fm);font-size:10px;color:var(--t3);margin-left:8px;">${t.tipo} · ${t.ajuste} · ${t.indice}</span></div>`).join('');
  box.style.display='block';
}

function closeSuggest(){ const box=document.getElementById('c-suggest'); if(box) box.style.display='none'; }

function fillFromTienda(id){
  const t=TIENDAS.find(x=>x.id===id); if(!t)return;
  document.getElementById('c-nombre').value=t.nombre;
  const tipoMap={'IPC Nacional':'IPC_NAC','IPC Cuyo':'IPC_CUY','ICL':'ICL','CCT 130/75':'CCT','Fijo':'FIJO','Manual':'FIJO'}, tipoVal=tipoMap[t.indice]||'IPC_NAC';
  document.getElementById('c-tipo').value=tipoVal;
  const ajMap={'Mensual':'1','Trimestral':'3','Cuatrimestral':'4','Semestral':'6','Anual':'12'}, ajVal=ajMap[t.ajuste]||'6';
  document.getElementById('c-ajuste').value=ajVal;
  document.getElementById('c-monto').value = t.monto || '';
  document.getElementById('c-inicio').value = t.ini || '';
  if(t.iclIni) document.getElementById('c-icl-ini').value = t.iclIni;
  if(t.pctFijo) document.getElementById('c-pct').value = t.pctFijo;
  const cDesfase = document.getElementById('c-desfase');
  if(cDesfase) cDesfase.value = t.desfase !== undefined ? String(t.desfase) : '1';
  
  const faltantes = [];
  if(!t.monto) faltantes.push('Monto inicial'); if(!t.ini) faltantes.push('Fecha de inicio'); if(!t.indice) faltantes.push('Tipo de índice'); if(!t.ajuste) faltantes.push('Frecuencia de ajuste');
  if(t.indice==='ICL'&&!t.iclIni) faltantes.push('ICL Inicial');
  if(t.indice==='Fijo'&&!t.pctFijo) faltantes.push('% Aumento');

  const nota = document.getElementById('c-datos-nota');
  if(faltantes.length){ nota.style.display='flex'; nota.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" style="flex-shrink:0;margin-top:1px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Datos faltantes en el legajo: <strong style="margin-left:3px;">${faltantes.join(', ')}</strong>`; }
  else nota.style.display='none';
  closeSuggest(); renderCalcTipo();
}

function calcular(){
  const tipo=document.getElementById('c-tipo').value, monto=parseFloat(document.getElementById('c-monto').value)||0, inicio=document.getElementById('c-inicio').value, fechaCalcInput=document.getElementById('c-fecha-calculo')?.value||'', am=parseInt(document.getElementById('c-ajuste').value)||4, nombre=document.getElementById('c-nombre').value.trim()||'—', ajSel=document.getElementById('c-ajuste'), ajusteLabel=ajSel.selectedIndex>=0?ajSel.options[ajSel.selectedIndex].text:'—', tipoLabels={'IPC_NAC':'IPC Nacional','IPC_CUY':'IPC Zona Cuyo','ICL':'ICL – Art. 14','FIJO':'Porcentaje fijo','CCT':'C.C.T. 130/75'};
  const desfase=parseInt(document.getElementById('c-desfase')?.value ?? '1');
  const ahora=fechaCalcInput?new Date(fechaCalcInput+'-02T00:00:00'):new Date(), mesNombre=ahora.toLocaleDateString('es-AR',{month:'long'}), mesAnio=mesNombre.charAt(0).toUpperCase()+mesNombre.slice(1)+' / '+ahora.getFullYear();
  document.getElementById('cr-nombre').textContent=nombre.toUpperCase(); document.getElementById('cr-inicio').textContent=inicio?fdm(inicio):'—'; document.getElementById('cr-monto-ini').textContent=monto?fmDec(monto):'—'; document.getElementById('cr-ajuste').textContent=ajusteLabel; document.getElementById('cr-tipo-label').textContent=tipoLabels[tipo]||tipo; document.getElementById('cr-fecha').textContent=mesAnio;
  if(!monto){ document.getElementById('cr-monto-final').textContent='$ —'; document.getElementById('c-prox-fecha').textContent='—'; document.getElementById('c-prox-fecha').style.color='var(--acc)'; document.getElementById('c-prox-det').textContent='ingresá inicio y frecuencia'; return; }
  
  let periodos = 0;
  let targetDate = fechaCalcInput ? new Date(fechaCalcInput+'-02T00:00:00') : new Date();
  if(inicio){ const iniDate=new Date(inicio+'T00:00:00'); const diffMonths=(targetDate.getFullYear()-iniDate.getFullYear())*12+(targetDate.getMonth()-iniDate.getMonth()); periodos=Math.max(0,Math.floor(diffMonths/am)); }
  
  let nuevo=monto, factor=1, det='';
  if(tipo==='ICL'){
    const ii=parseFloat(document.getElementById('c-icl-ini').value)||0;
    let ia=parseFloat(document.getElementById('c-icl-act').value)||0;
    // Si no hay ICL actual manual, intentar buscar en IPC_DATA
    if(!ia && inicio) {
      const iniDate=new Date(inicio+'T00:00:00');
      const fDate = new Date(iniDate); fDate.setMonth(iniDate.getMonth() + periodos * am);
      const iclDate = new Date(fDate);
      iclDate.setMonth(iclDate.getMonth() - desfase);
      const mesTarget = `${iclDate.getFullYear()}-${String(iclDate.getMonth()+1).padStart(2,'0')}`;
      const d = IPC_DATA.find(x=>x.mes===mesTarget) || [...IPC_DATA].reverse().find(x=>x.mes<=mesTarget && x.icl);
      if(d && d.icl) { ia = d.icl; document.getElementById('c-icl-act').value = ia; }
    }
    if(ii&&ia){factor=ia/ii;nuevo=monto*factor;det=`coef ${factor.toFixed(4)} · ICL ${ii}→${ia}`;}
  }
  else if(tipo==='FIJO'){ const p=parseFloat(document.getElementById('c-pct').value)||0; factor=Math.pow(1+p/100,periodos); nuevo=monto*factor; det=`+${p}% fijo (${periodos} per.)`; }
  else if(tipo==='CCT'){ const sueldo=parseFloat(document.getElementById('c-cct-sueldo').value)||0; if(sueldo){nuevo=sueldo;factor=monto?sueldo/monto:1;det=`Sueldo bruto Vendedor A · C.C.T. 130/75`;} }
  else if(inicio){ const ind=tipo==='IPC_CUY'?'IPC Cuyo':'IPC Nacional', iniDate=new Date(inicio+'T00:00:00'), fDate=new Date(iniDate); fDate.setMonth(iniDate.getMonth()+periodos*am); const hastaDate=`${fDate.getFullYear()}-${String(fDate.getMonth()+1).padStart(2,'0')}`; const fRes=calcFactorIPC(inicio,ind,hastaDate,desfase,am); factor=(!fRes || isNaN(fRes)) ? calcFactorIPCEstimado(inicio,ind,hastaDate,desfase,am) : fRes; nuevo=monto*factor; det=`desde ${fd(inicio)} (${periodos} per.)`; }
  
  document.getElementById('cr-monto-final').textContent=fmDec(nuevo);
  if(inicio){ const d=pd(inicio), hoy=new Date(); let prox=new Date(d); while(prox<=hoy)prox.setMonth(prox.getMonth()+am); const dias=Math.round((prox-hoy)/864e5), proxLabel=prox.toLocaleDateString('es-AR',{day:'2-digit',month:'long',year:'numeric'}), col=dias<=30?'var(--danger)':dias<=60?'var(--warn)':'var(--acc)'; document.getElementById('c-prox-fecha').textContent=proxLabel; document.getElementById('c-prox-fecha').style.color=col; document.getElementById('c-prox-det').textContent=dias===0?'¡Hoy!':dias===1?'mañana':`en ${dias} días`; }
  else{ document.getElementById('c-prox-fecha').textContent='—'; document.getElementById('c-prox-fecha').style.color='var(--acc)'; document.getElementById('c-prox-det').textContent='ingresá la fecha de inicio'; }
  if(inicio&&monto){ const d=pd(inicio); let h=''; const hoy=new Date(); for(let i=0;i<=4;i++){ const f=new Date(d); f.setMonth(f.getMonth()+am*i); const past=f<hoy, isNext=!past&&(i===0||new Date(d).setMonth(pd(inicio).getMonth()+am*(i-1))<hoy.getTime()); h+=`<div style="display:flex;gap:8px;margin-bottom:9px;align-items:flex-start;"><div style="width:7px;height:7px;border-radius:50%;margin-top:4px;flex-shrink:0;background:${past?'var(--t4)':isNext?'var(--acc)':'var(--bdr2)'}"></div><div style="font-family:var(--fm);font-size:11px;"><strong style="color:${past?'var(--t3)':isNext?'var(--t1)':'var(--t2)'}">${i===0?'Inicio — '+fm(monto):'Ajuste '+i}</strong><span style="display:block;color:var(--t3);font-size:10px;">${f.toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'numeric'})}${past?' ✓':''}</span></div></div>`; }
  const tl=document.getElementById('c-timeline'); if(tl)tl.innerHTML=h; }
}

function fmDec(n){ return (!n && n!==0) ? '—' : '$'+n.toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2}); }

function generarPDF(){
  const montoIni = parseFloat(document.getElementById('c-monto').value)||0;
  if(!montoIni){ showConfirm('Datos incompletos','Ingresá al menos el monto inicial para generar el PDF.',()=>{},true); return; }
  const win = window.open('', '_blank');
  if(!win){ showConfirm('Popup bloqueado','Por favor permití las ventanas emergentes para poder generar el PDF.',()=>{},true); return; }
  const nombre=(document.getElementById('c-nombre').value.trim()||'TIENDA').toUpperCase(), prox=document.getElementById('c-prox-fecha').textContent||'—', proxDet=document.getElementById('c-prox-det').textContent||'', inicio=document.getElementById('cr-inicio').textContent||'—', montoIniTxt=document.getElementById('cr-monto-ini').textContent||'—', ajuste=document.getElementById('cr-ajuste').textContent||'—', tipo=document.getElementById('cr-tipo-label').textContent||'—', fecha=document.getElementById('cr-fecha').textContent||'—', montoPagar=document.getElementById('cr-monto-final').textContent||'$ —', ahora=new Date().toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'});
  win.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><title>Resumen — ${nombre}</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Arial,Helvetica,sans-serif;background:#fff;padding:40px;color:#1a1a1a;}.tabla{width:100%;border-collapse:collapse;border:1px solid #c8c8c8;border-radius:6px;overflow:hidden;}.thead-main td{background:#1a1a1a;color:#fff;padding:13px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;}.thead-main td.val{font-size:16px;font-weight:800;letter-spacing:.04em;text-align:center;}.thead-sub td{background:#efefef;color:#555;font-size:10px;font-weight:700;padding:7px 16px;border-bottom:1px solid #d4d4d4;text-align:center;}.fila td{padding:10px 16px;font-size:12.5px;border-bottom:1px solid #e8e8e8;}.fila td:first-child{color:#555;background:#fff;border-right:1px solid #e8e8e8;width:38%;}.fila td:last-child{color:#1a1a1a;background:#fafafa;text-align:center;font-weight:500;}.fila.alt td:first-child{background:#f5f5f5;}.fila.alt td:last-child{background:#f0f0f0;}.highlight td{background:#2d2d2d;color:#fff;padding:11px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid rgba(255,255,255,.08);}.highlight td:last-child{font-size:14px;font-weight:700;text-align:center;color:#e8e8e8;}.monto td{background:#1a1a1a;color:#fff;padding:14px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;}.monto td:last-child{font-size:22px;font-weight:800;color:#10b981;text-align:center;}.divider{height:6px;background:#e8e8e8;border-top:1px solid #d4d4d4;border-bottom:1px solid #d4d4d4;}.footer{margin-top:20px;display:flex;justify-content:space-between;align-items:flex-end;}.prox{border:1px solid #d4d4d4;border-radius:6px;padding:12px 16px;background:#fafafa;}.prox .lbl{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#888;margin-bottom:4px;}.prox .val{font-size:15px;font-weight:700;color:#1a1a1a;}.prox .det{font-size:10px;color:#888;margin-top:2px;}.meta{font-size:10px;color:#aaa;text-align:right;line-height:1.6;}@media print{body{padding:20px;}@page{margin:1cm;size:A4;}}</style></head><body><table class="tabla"><tr class="thead-main"><td>TIENDA</td><td class="val">${nombre}</td></tr><tr class="thead-sub"><td>Dato</td><td>Valor</td></tr><tr class="fila"><td>Inicio de Contrato</td><td>${inicio}</td></tr><tr class="fila alt"><td>Monto Inicial</td><td>${montoIniTxt}</td></tr><tr class="fila"><td>Tipo de Ajuste</td><td>${ajuste}</td></tr><tr class="fila alt"><td>Tipo de Índice</td><td>${tipo}</td></tr><tr><td colspan="2" class="divider"></td></tr><tr class="highlight"><td>MES A CALCULAR</td><td>${fecha}</td></tr><tr class="monto"><td>MONTO A PAGAR</td><td>${montoPagar}</td></tr></table><div class="footer"><div class="prox"><div class="lbl">Próxima actualización</div><div class="val">${prox}</div><div class="det">${proxDet}</div></div><div class="meta">Generado el ${ahora}<br>Gestor de Alquileres</div></div><script>window.onload=()=>{window.print();}<\/script></body></html>`);
  win.document.close();
}

// ══ IPC ══
function parseMesLabel(s){ const meses={ene:'01',feb:'02',mar:'03',abr:'04',may:'05',jun:'06',jul:'07',ago:'08',sep:'09',oct:'10',nov:'11',dic:'12'}; const m=s.trim().toLowerCase().match(/^([a-z]{3})-(\d{4})$/); if(m&&meses[m[1]]) return`${m[2]}-${meses[m[1]]}`; return null; }
function mesToLabel(yyyymm){ const meses=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']; const[y,m]=yyyymm.split('-'); return`${meses[parseInt(m)-1]}-${y}`; }

function renderIPC(){
  const s=[...IPC_DATA].sort((a,b)=>b.mes.localeCompare(a.mes));
  document.getElementById('ipc-tbody').innerHTML=s.map(d=>`<tr><td style="font-family:var(--fm);font-size:12px;">${mesToLabel(d.mes)}</td><td style="font-family:var(--fm);color:var(--ok)">${d.nac}%</td><td style="font-family:var(--fm);color:var(--info)">${d.cuy}%</td><td style="font-family:var(--fm);color:var(--t2)">${d.icl||'—'}</td><td><button class="btn bd bsm" onclick="delIPC('${d.mes}')">Eliminar</button></td></tr>`).join('')||`<tr><td colspan="5" class="empty">Sin datos IPC / ICL</td></tr>`;
  renderIpcLastUpdate();
}

function renderIpcLastUpdate(){
  const el=document.getElementById('ipc-last-update'); if(!el) return;
  if(!IPC_DATA.length){el.textContent='// sin datos cargados';return;}
  const ultimo=[...IPC_DATA].sort((a,b)=>b.mes.localeCompare(a.mes))[0], hoy=new Date().toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'});
  el.innerHTML=`// último registro: <strong style="color:var(--t1);">${mesToLabel(ultimo.mes)}</strong> <span style="color:var(--t4);">· actualizado ${hoy}</span>`;
}

function saveIPC(){
  const mes=document.getElementById('ipc-mes').value,nac=parseFloat(document.getElementById('ipc-nac').value);
  if(!mes||(isNaN(nac) && !document.getElementById('ipc-icl').value)){showConfirm('Campo obligatorio','Mes y al menos un índice son obligatorios.',()=>{},true);return;}
  IPC_DATA=IPC_DATA.filter(d=>d.mes!==mes); IPC_DATA.push({mes,nac:nac||0,cuy:parseFloat(document.getElementById('ipc-cuy').value)||nac||0, icl:parseFloat(document.getElementById('ipc-icl').value)||0}); IPC_DATA.sort((a,b)=>a.mes.localeCompare(b.mes));
  save();closeModal('m-ipc');renderIPC();
}
function delIPC(mes){showConfirm('¿Eliminar este dato IPC?','Esta acción no se puede deshacer.',()=>{IPC_DATA=IPC_DATA.filter(d=>d.mes!==mes);save();renderIPC();});}

function exportarIPC(){
  if(!IPC_DATA.length){showConfirm('Sin datos','No hay datos IPC para exportar.',()=>{},true);return;}
  const rows=[['Mes','IPC Nacional','IPC Zona Cuyo','ICL BCRA'],...[...IPC_DATA].sort((a,b)=>a.mes.localeCompare(b.mes)).map(d=>[mesToLabel(d.mes), d.nac, d.cuy, d.icl||''])];
  const csv=rows.map(r=>r.join(',')).join('\n'), blob=new Blob([csv],{type:'text/csv;charset=utf-8'}), a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='ipc_data.csv'; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),3000);
}

function importarIPC(input){
  const file=input.files[0]; if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const lines=e.target.result.trim().split('\n').map(l=>l.trim()).filter(Boolean); if(!lines.length) throw new Error('Archivo vacío');
      const header=lines[0].toLowerCase().split(',').map(h=>h.trim().replace(/"/g,'')), iMes=header.findIndex(h=>h.includes('mes')), iNac=header.findIndex(h=>h.includes('nac')||h.includes('nacional')), iCuy=header.findIndex(h=>h.includes('cuy')||h.includes('cuyo')), iIcl=header.findIndex(h=>h.includes('icl'));
      if(iMes===-1||(iNac===-1 && iIcl===-1)) throw new Error('No se encontraron las columnas requeridas (Mes e IPC Nacional/ICL).');
      const nuevos=[], errores=[];
      lines.slice(1).forEach((line,i)=>{
        const cols=line.split(',').map(c=>c.trim().replace(/"/g,'')), mesRaw=cols[iMes]||'';
        let mes=null; if(/^\d{4}-\d{2}$/.test(mesRaw)) mes=mesRaw; else mes=parseMesLabel(mesRaw);
        if(!mes){errores.push(`Fila ${i+2}: mes inválido "${mesRaw}"`);return;}
        const nac=iNac>=0?parseFloat(cols[iNac]):0;
        const icl=iIcl>=0?parseFloat(cols[iIcl]):0;
        if(isNaN(nac) && isNaN(icl)){errores.push(`Fila ${i+2}: Índices inválidos`);return;}
        const cuy=iCuy>=0?parseFloat(cols[iCuy])||nac:nac; nuevos.push({mes,nac:nac||0,cuy:cuy||0,icl:icl||0});
      });
      if(!nuevos.length) throw new Error('No se encontraron filas válidas.\n'+errores.slice(0,3).join('\n'));
      showConfirm('¿Importar datos IPC?', `Se importarán ${nuevos.length} registros.${errores.length?` (${errores.length} filas con error ignoradas)`:''} Los datos del mismo mes serán reemplazados.`, ()=>{ nuevos.forEach(d=>{IPC_DATA=IPC_DATA.filter(x=>x.mes!==d.mes);IPC_DATA.push(d);}); IPC_DATA.sort((a,b)=>a.mes.localeCompare(b.mes)); save(); renderIPC(); });
    }catch(err){ showConfirm('Error al importar',err.message,()=>{},true); }finally{ input.value=''; }
  }; reader.readAsText(file);
}

// ══ CSV IMPORT / EXPORT ══
const CSV_COLS=[{key:'nombre',label:'nombre',required:true},{key:'tipo',label:'tipo'},{key:'prop',label:'propietario'},{key:'razon',label:'razon_social'},{key:'dir',label:'direccion'},{key:'resp',label:'responsable'},{key:'cont',label:'contacto'},{key:'locIni',label:'loc_inicio'},{key:'locFin',label:'loc_fin'},{key:'subIni',label:'sub_inicio'},{key:'subFin',label:'sub_fin'},{key:'cauIni',label:'cau_inicio'},{key:'cauFin',label:'cau_fin'},{key:'fraIni',label:'fra_inicio'},{key:'fraFin',label:'fra_fin'},{key:'ini',label:'ini_contrato'},{key:'monto',label:'monto'},{key:'ajuste',label:'ajuste'},{key:'indice',label:'indice'},{key:'dep',label:'deposito'},{key:'diapago',label:'dia_pago'},{key:'irreg',label:'irregularidades'},{key:'obs',label:'observaciones'}];
let _csvParsed=[];

function descargarCSVEjemplo(){
  const header=CSV_COLS.map(c=>c.label).join(','), ej=['Dean Funes,FRANQUICIA,Nestor Lujan,Sergio Dume,Av. San Martin 450,Martin Serrano,261-555-1234,2021-02-01,2027-11-01,2025-06-01,2027-11-01,,,,,2024-06-01,225000,Semestral,IPC Nacional,450000,10,FACTURA PENDIENTE,Realizar factura a Sergio Dume','Bowen,SUCURSAL,,,Ruta 40 km 5,Mati,,,2024-06-01,2026-06-01,,,,,,2024-06-01,280000,Trimestral,IPC Nacional,0,5,,','Callao,FRANQUICIA,,,,,,,,,,,,,,,0,Semestral,Manual,0,10,ARREGLA CON EL DUEÑO,'], blob=new Blob([header+'\n'+ej.join('\n')],{type:'text/csv;charset=utf-8;'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='tiendas_ejemplo.csv'; a.click(); URL.revokeObjectURL(a.href);
}

function resetImport(){ _csvParsed=[]; document.getElementById('imp-step1').style.display='block'; document.getElementById('imp-step2').style.display='none'; document.getElementById('imp-btn-confirm').style.display='none'; document.getElementById('imp-error').style.display='none'; document.getElementById('imp-file-input').value=''; document.getElementById('imp-dropzone').style.borderColor='var(--bdr2)'; document.getElementById('imp-dropzone').style.background='var(--s2)'; }

function handleCSVFile(file){
  if(!file)return; if(!file.name.endsWith('.csv')&&file.type!=='text/csv'){ showImpError('El archivo debe ser .csv');return; }
  const reader=new FileReader(); reader.onload=e=>parseCSV(e.target.result); reader.readAsText(file,'UTF-8');
}

function parseCSV(text){
  const lines=text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n').filter(l=>l.trim()); if(lines.length<2){showImpError('El archivo está vacío o solo tiene encabezado.');return;}
  const rawHeader=csvSplitLine(lines[0]).map(h=>h.trim().toLowerCase()), labelMap={}; CSV_COLS.forEach(c=>labelMap[c.label.toLowerCase()]=c.key);
  const missingReq=CSV_COLS.filter(c=>c.required&&!rawHeader.includes(c.label.toLowerCase())); if(missingReq.length){ showImpError(`Faltan columnas obligatorias: ${missingReq.map(c=>c.label).join(', ')}`);return; }
  const rows=[], errRows=[];
  for(let i=1;i<lines.length;i++){
    const vals=csvSplitLine(lines[i]); if(vals.every(v=>!v.trim()))continue;
    const obj={id:'t'+Date.now()+Math.random().toString(36).slice(2,6)};
    obj.tipo='FRANQUICIA';obj.prop='';obj.razon='';obj.dir='';obj.resp='';obj.cont='';obj.locIni='';obj.locFin='';obj.subIni='';obj.subFin='';obj.cauIni='';obj.cauFin='';obj.fraIni='';obj.fraFin='';obj.ini='';obj.monto=0;obj.ajuste='Semestral';obj.indice='IPC Nacional';obj.dep=0;obj.diapago=10;obj.irreg='';obj.obs='';
    rawHeader.forEach((h,idx)=>{ const key=labelMap[h]; if(!key)return; let val=(vals[idx]||'').trim(); if(key==='monto'||key==='dep')val=parseFloat(val)||0; else if(key==='diapago')val=parseInt(val)||10; else if(key==='tipo'){val=val.toUpperCase();if(val!=='SUCURSAL')val='FRANQUICIA';} obj[key]=val; });
    if(!obj.nombre){errRows.push(i+1);continue;} rows.push(obj);
  }
  if(!rows.length){showImpError('No se encontraron filas válidas. Verificá que la columna "nombre" no esté vacía.');return;}
  _csvParsed=rows; document.getElementById('imp-error').style.display='none'; document.getElementById('imp-step1').style.display='none'; document.getElementById('imp-step2').style.display='block'; document.getElementById('imp-btn-confirm').style.display='inline-flex';
  const sumEl=document.getElementById('imp-summary'); sumEl.innerHTML=`<div style="background:rgba(46,204,138,.1);border:1px solid rgba(46,204,138,.2);border-radius:7px;padding:8px 14px;font-family:var(--fm);font-size:11px;color:var(--ok);"><strong style="font-size:18px;display:block;">${rows.length}</strong>tiendas a importar</div>${errRows.length?`<div style="background:rgba(245,166,35,.1);border:1px solid rgba(245,166,35,.2);border-radius:7px;padding:8px 14px;font-family:var(--fm);font-size:11px;color:var(--warn);"><strong style="font-size:18px;display:block;">${errRows.length}</strong>filas ignoradas (sin nombre)</div>`:''}<div style="background:var(--s3);border:1px solid var(--bdr);border-radius:7px;padding:8px 14px;font-family:var(--fm);font-size:11px;color:var(--t3);"><strong style="font-size:18px;display:block;color:var(--t2)">${rawHeader.length}</strong>columnas detectadas</div>`;
  const previewKeys=CSV_COLS.filter(c=>rawHeader.includes(c.label.toLowerCase())).slice(0,8), thead=document.getElementById('imp-preview-thead'), tbody=document.getElementById('imp-preview-tbody');
  thead.innerHTML=`<tr>${previewKeys.map(c=>`<th style="font-family:var(--fm);font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:var(--t3);padding:7px 10px;background:var(--s2);border-bottom:1px solid var(--bdr);white-space:nowrap;">${c.label}</th>`).join('')}</tr>`;
  tbody.innerHTML=rows.slice(0,5).map(r=>`<tr>${previewKeys.map(c=>`<td style="padding:6px 10px;font-size:11.5px;border-bottom:1px solid rgba(42,47,61,.4);white-space:nowrap;max-width:160px;overflow:hidden;text-overflow:ellipsis;">${r[c.key]||'—'}</td>`).join('')}</tr>`).join('');
}

function csvSplitLine(line){ const result=[];let cur='';let inQ=false; for(let i=0;i<line.length;i++){ const ch=line[i]; if(ch==='"'){inQ=!inQ;} else if(ch===','&&!inQ){result.push(cur);cur='';} else cur+=ch; } result.push(cur); return result; }
function showImpError(msg){ const el=document.getElementById('imp-error'); el.textContent='⚠ '+msg; el.style.display='block'; }
function confirmarImport(){ if(!_csvParsed.length)return; const mode=document.querySelector('input[name="imp-mode"]:checked').value; if(mode==='replace'){ showConfirm('¿Reemplazar todas las tiendas?', `Esta acción eliminará las ${TIENDAS.length} tiendas actuales y las reemplazará con las ${_csvParsed.length} del CSV. Los registros de pagos existentes se conservan.`, ()=>{ TIENDAS=_csvParsed; save();closeModal('m-import');resetImport();renderAll();renderTiendas(); }); }else{ const nombresExist=new Set(TIENDAS.map(t=>t.nombre.toLowerCase())), nuevas=_csvParsed.filter(t=>!nombresExist.has(t.nombre.toLowerCase())), dupes=_csvParsed.length-nuevas.length; TIENDAS=[...TIENDAS,...nuevas]; save();closeModal('m-import');resetImport();renderAll();renderTiendas(); if(dupes>0) showConfirm(`Importación completada`, `Se agregaron ${nuevas.length} tienda${nuevas.length!==1?'s':''}.${dupes>0?` Se omitieron ${dupes} por nombre duplicado.`:''}`, ()=>{},true); } }

// ── Modal de confirmación genérico ──
function showConfirm(title,msg,onOk,infoOnly=false){
  let overlay=document.getElementById('m-confirm');
  if(!overlay){ overlay=document.createElement('div'); overlay.id='m-confirm';overlay.className='moverlay'; overlay.innerHTML=`<div class="mdialog" style="max-width:420px;"><div class="mhead"><div class="mtitle" id="mc-title"></div><button class="mclose" onclick="document.getElementById('m-confirm').classList.remove('open')">×</button></div><div class="mbody"><p id="mc-msg" style="font-size:13px;color:var(--t2);line-height:1.6;"></p></div><div class="mfoot"><button id="mc-cancel" class="btn bg2" onclick="document.getElementById('m-confirm').classList.remove('open')">Cancelar</button><button id="mc-ok" class="btn ba">Confirmar</button></div></div>`; document.body.appendChild(overlay); overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.classList.remove('open');}); }
  document.getElementById('mc-title').textContent=title; document.getElementById('mc-msg').textContent=msg; const cancelBtn=document.getElementById('mc-cancel'), okBtn=document.getElementById('mc-ok'); if(infoOnly){cancelBtn.style.display='none';okBtn.textContent='Entendido';} else{cancelBtn.style.display='';okBtn.textContent='Confirmar';} okBtn.onclick=()=>{overlay.classList.remove('open');onOk();}; overlay.classList.add('open');
}

// ══ CRUD TIENDAS ══
function openModal(id){document.getElementById(id).classList.add('open');}
function closeModal(id){document.getElementById(id).classList.remove('open');EID=null;PCTX=null;}
document.querySelectorAll('.moverlay').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open');}));

let _iniManual = false; 

function swTab(el,id){ const b=el.closest('.mbody'); ['mt-gen','mt-con','mt-eco','mt-obs'].forEach(x=>{const e=document.getElementById(x);if(e)e.style.display='none';}); document.getElementById(id).style.display='block'; b.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));el.classList.add('active'); if(id==='mt-eco') syncIniFromLocacion(); }
function syncIniFromLocacion(){ if(_iniManual) return; const locIni=document.getElementById('t-loc-ini').value, tIni=document.getElementById('t-ini'), badge=document.getElementById('t-ini-sync-badge'), hint=document.getElementById('t-ini-hint'); if(locIni){ tIni.value=locIni; tIni.style.borderColor='rgba(16,185,129,.4)'; badge.style.display='inline'; hint.style.display='none'; } else { tIni.style.borderColor=''; badge.style.display='none'; hint.style.display='block'; } }
function markIniManual(){ _iniManual=true; const badge=document.getElementById('t-ini-sync-badge'), hint=document.getElementById('t-ini-hint'); if(badge) badge.style.display='none'; if(hint) hint.style.display='none'; document.getElementById('t-ini').style.borderColor=''; }
function desyncIni(){ _iniManual=true; const badge=document.getElementById('t-ini-sync-badge'); if(badge) badge.style.display='none'; document.getElementById('t-ini').style.borderColor=''; document.getElementById('t-ini').focus(); }
function clearTForm(){ _iniManual=false; ['t-nombre','t-num','t-depar','t-cuit','t-m2','t-prop','t-usuario','t-razon','t-dir','t-tel','t-cont','t-loc-ini','t-loc-fin','t-sub-ini','t-sub-fin','t-cau-ini','t-cau-fin','t-fra-ini','t-fra-fin','t-ini','t-monto','t-dep','t-diapago','t-irreg','t-obs','t-icl-ini','t-pct-fijo'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';}); document.getElementById('t-tipo').value='FRANQUICIA'; document.getElementById('t-adenda').value='no'; document.getElementById('t-ajuste').value='Semestral'; document.getElementById('t-indice').value='IPC Nacional'; const desfaseEl = document.getElementById('t-desfase'); if(desfaseEl) desfaseEl.value = '1'; toggleIndiceFields('IPC Nacional'); document.getElementById('m-t-title').textContent='Nueva Tienda'; document.getElementById('mt-gen').style.display='block'; ['mt-con','mt-eco','mt-obs'].forEach(id=>{const e=document.getElementById(id);if(id==='mt-eco') syncIniFromLocacion(); }); document.querySelectorAll('#m-tienda .tab').forEach((t,i)=>t.classList.toggle('active',i===0)); }

function saveTienda(){
  const nombre=document.getElementById('t-nombre').value.trim(); if(!nombre){showConfirm('Campo obligatorio','El nombre de la tienda es obligatorio.',()=>{},true);return;}
  const t={ id:EID||'t'+Date.now(),nombre,
    num:document.getElementById('t-num').value,
    depar:document.getElementById('t-depar').value,
    cuit:document.getElementById('t-cuit').value,
    m2:document.getElementById('t-m2').value,
    tipo:document.getElementById('t-tipo').value, prop:document.getElementById('t-prop').value, usuario:document.getElementById('t-usuario').value, razon:document.getElementById('t-razon').value, dir:document.getElementById('t-dir').value,resp:"", 
    tel:document.getElementById('t-tel').value,
    cont:document.getElementById('t-cont').value, locIni:document.getElementById('t-loc-ini').value,locFin:document.getElementById('t-loc-fin').value, subIni:document.getElementById('t-sub-ini').value,subFin:document.getElementById('t-sub-fin').value, cauIni:document.getElementById('t-cau-ini').value,cauFin:document.getElementById('t-cau-fin').value, fraIni:document.getElementById('t-fra-ini').value,fraFin:document.getElementById('t-fra-fin').value, ini:document.getElementById('t-ini').value, monto:parseFloat(document.getElementById('t-monto').value)||0, ajuste:document.getElementById('t-ajuste').value, indice:document.getElementById('t-indice').value, 
    iclIni:parseFloat(document.getElementById('t-icl-ini').value)||0,
    pctFijo:parseFloat(document.getElementById('t-pct-fijo').value)||0,
    desfase:parseInt(document.getElementById('t-desfase')?.value)||1,
    dep:parseFloat(document.getElementById('t-dep').value)||0, diapago:parseInt(document.getElementById('t-diapago').value)||10, irreg:document.getElementById('t-irreg').value, obs:document.getElementById('t-obs').value, adenda:document.getElementById('t-adenda').value };
  if(EID)TIENDAS=TIENDAS.map(x=>x.id===EID?t:x);else TIENDAS.push(t);
  
  // Sincronización global de contactos
  if(t.prop) syncMasterContact(t.prop, t.tel, t.cont, t.cuit);

  save();closeModal('m-tienda');renderAll();renderTiendas();EID=null;
}
function editTienda(id){
  const t=TIENDAS.find(x=>x.id===id);if(!t)return;EID=id;clearTForm(); document.getElementById('m-t-title').textContent='Editar: '+t.nombre;
  setTimeout(()=>{ 
    document.getElementById('t-nombre').value=t.nombre||'';
    document.getElementById('t-num').value=t.num||'';
    document.getElementById('t-depar').value=t.depar||'';
    document.getElementById('t-cuit').value=t.cuit||'';
    document.getElementById('t-m2').value=t.m2||'';
    document.getElementById('t-tipo').value=t.tipo||'FRANQUICIA'; 
    document.getElementById('t-prop').value=t.prop||'';
    document.getElementById('t-usuario').value=t.usuario||'';
    document.getElementById('t-razon').value=t.razon||''; 
    document.getElementById('t-dir').value=t.dir||'';
    document.getElementById('t-tel').value=t.tel||''; 
    document.getElementById('t-cont').value=t.cont||''; 
    document.getElementById('t-loc-ini').value=t.locIni||'';
    document.getElementById('t-loc-fin').value=t.locFin||''; 
    document.getElementById('t-sub-ini').value=t.subIni||'';
    document.getElementById('t-sub-fin').value=t.subFin||''; 
    document.getElementById('t-cau-ini').value=t.cauIni||'';
    document.getElementById('t-cau-fin').value=t.cauFin||''; 
    document.getElementById('t-fra-ini').value=t.fraIni||'';
    document.getElementById('t-fra-fin').value=t.fraFin||''; 
    document.getElementById('t-ini').value=t.ini||'';
    document.getElementById('t-monto').value=t.monto||0; 
    document.getElementById('t-ajuste').value=t.ajuste||'Semestral';
    document.getElementById('t-indice').value=t.indice||'IPC Nacional'; 
    document.getElementById('t-icl-ini').value=t.iclIni||'';
    document.getElementById('t-pct-fijo').value=t.pctFijo||'';
    if(document.getElementById('t-desfase')) document.getElementById('t-desfase').value = t.desfase !== undefined ? String(t.desfase) : '1';
    toggleIndiceFields(t.indice||'IPC Nacional');
    document.getElementById('t-dep').value=t.dep||0;
    document.getElementById('t-diapago').value=t.diapago||10; 
    document.getElementById('t-irreg').value=t.irreg||'';
    document.getElementById('t-obs').value=t.obs||''; 
    document.getElementById('t-adenda').value=t.adenda||'no'; 
    _iniManual = true; 
    const badge=document.getElementById('t-ini-sync-badge'), hint=document.getElementById('t-ini-hint'); 
    if(badge) badge.style.display='none'; 
    if(hint) hint.style.display='none'; 
  },30); openModal('m-tienda');
}
function delTienda(id){ const t=TIENDAS.find(x=>x.id===id);if(!t)return; showConfirm(`¿Eliminar "${t.nombre}"?`,'Se eliminarán todos sus datos. Esta acción no se puede deshacer.',()=>{ TIENDAS=TIENDAS.filter(t=>t.id!==id); Object.keys(PAGOS).filter(k=>k.startsWith(id+'_')).forEach(k=>delete PAGOS[k]); save();renderAll();renderTiendas(); if(document.getElementById('page-legajo').classList.contains('active'))goPage('tiendas',document.querySelectorAll('.nav')[1]); }); }

// ══ ARCHIVADOS ══
function archivarTienda(id){ const t = TIENDAS.find(x=>x.id===id); if(!t) return; showConfirm(`¿Archivar "${t.nombre}"?`, 'La tienda pasará a Archivados y no aparecerá en las listas activas. Podés desarchivarlo cuando quieras.', ()=>{ ARCHIVADOS.push({...t, archivedAt: new Date().toISOString().slice(0,10)}); TIENDAS = TIENDAS.filter(x=>x.id!==id); save(); renderAll(); renderTiendas(); goPage('tiendas', document.querySelectorAll('.nav')[1]); }); }
function desarchivarTienda(id){ const t = ARCHIVADOS.find(x=>x.id===id); if(!t) return; showConfirm(`¿Desarchivar "${t.nombre}"?`, 'La tienda volverá a la lista activa.', ()=>{ const {archivedAt,...tienda} = t; TIENDAS.push(tienda); ARCHIVADOS = ARCHIVADOS.filter(x=>x.id!==id); save(); renderAll(); renderTiendas(); renderArchivados(); }); }
function renderArchivados(){ const tbody = document.getElementById('archivados-tbody'); if(!tbody) return; if(!ARCHIVADOS.length){ tbody.innerHTML='<tr><td colspan="5" class="empty">// sin tiendas archivadas</td></tr>'; return; } tbody.innerHTML = [...ARCHIVADOS].reverse().map(t=>`<tr><td style="font-size:12px;font-weight:600;color:var(--t1);padding:10px 16px;">${t.nombre}</td><td style="font-family:var(--fm);font-size:10px;color:var(--t3);padding:10px 16px;">${t.tipo||'—'}</td><td style="font-size:12px;color:var(--t2);padding:10px 16px;">${t.prop||'—'}</td><td style="font-family:var(--fm);font-size:11px;color:var(--t3);padding:10px 16px;">${t.archivedAt||'—'}</td><td style="padding:10px 16px;text-align:right;"><button class="btn bg2 bsm" onclick="desarchivarTienda('${t.id}')">Desarchivar</button></td></tr>`).join(''); }

function toggleServerMenu(e){ e.stopPropagation(); const m = document.getElementById('server-menu'), open = m.style.display === 'block'; m.style.display = open ? 'none' : 'block'; if(!open) setTimeout(()=>document.addEventListener('click', closeServerMenu, {once:true}), 10); }
function closeServerMenu(){ document.getElementById('server-menu').style.display='none'; }
function exportarDatos(){ closeServerMenu(); const blob = new Blob([JSON.stringify({TIENDAS,PAGOS,IPC_DATA,USERS,ARCHIVADOS},null,2)],{type:'application/json'}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `backup_gestor_${new Date().toISOString().slice(0,10)}.json`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),3000); }
function importarDatos(){ closeServerMenu(); const inp = document.createElement('input'); inp.type='file'; inp.accept='.json'; inp.onchange = e => { const f = e.target.files[0]; if(!f) return; const r = new FileReader(); r.onload = ev => { try { const d = JSON.parse(ev.target.result); if(!d.TIENDAS) throw new Error('Formato inválido'); showConfirm('¿Importar backup?',`Se cargarán ${d.TIENDAS.length} tiendas. Los datos actuales serán reemplazados.`, ()=>{ TIENDAS=d.TIENDAS||[]; PAGOS=d.PAGOS||{}; IPC_DATA=d.IPC_DATA||[]; ARCHIVADOS=d.ARCHIVADOS||[]; save(); renderAll(); renderTiendas(); }); } catch(err){ showConfirm('Error','El archivo no es un backup válido.',()=>{},true); } }; r.readAsText(f); }; inp.click(); }

function pedirPassYVaciar(){
  closeServerMenu(); if(!isAdmin()){ showConfirm('Sin permisos','Solo el administrador puede vaciar la base de datos.',()=>{},true); return; }
  const overlay = document.createElement('div'); overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:600;display:flex;align-items:center;justify-content:center;'; overlay.innerHTML=`<div style="background:var(--s1);border:1px solid var(--bdr);border-radius:14px;padding:28px;max-width:340px;width:90%;box-shadow:var(--shadow);"><div style="font-family:var(--fh);font-size:16px;font-weight:700;color:var(--t1);margin-bottom:6px;">Vaciar base de datos</div><div style="font-size:12.5px;color:var(--t2);margin-bottom:20px;">Esta acción borrará <strong style="color:var(--danger)">todos los datos</strong> permanentemente. Ingresá tu contraseña para continuar.</div><label style="font-family:var(--fm);font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--t3);display:block;margin-bottom:6px;">Contraseña</label><input id="_vdb_pass" type="password" placeholder="••••••••" style="width:100%;background:var(--bg);border:1px solid var(--bdr2);border-radius:7px;padding:9px 12px;color:var(--t1);font-size:13px;outline:none;margin-bottom:6px;" onkeydown="if(event.key==='Enter')document.getElementById('_vdb_ok').click()"/><div id="_vdb_err" style="font-family:var(--fm);font-size:10.5px;color:var(--danger);min-height:16px;margin-bottom:14px;"></div><div style="display:flex;gap:8px;"><button id="_vdb_cancel" style="flex:1;padding:9px;background:none;border:1px solid var(--bdr2);border-radius:7px;color:var(--t2);font-size:12px;cursor:pointer;">Cancelar</button><button id="_vdb_ok" style="flex:1;padding:9px;background:var(--danger);border:none;border-radius:7px;color:var(--bg);font-size:12px;font-weight:700;cursor:pointer;">Vaciar todo</button></div></div>`; document.body.appendChild(overlay); const inp = overlay.querySelector('#_vdb_pass'), err = overlay.querySelector('#_vdb_err'); setTimeout(()=>inp.focus(), 50); overlay.querySelector('#_vdb_cancel').onclick = ()=>overlay.remove(); overlay.querySelector('#_vdb_ok').onclick = async ()=>{
    const pass = inp.value;
    if (!pass) { err.textContent = 'Ingresa la contraseña'; return; }
    
    if(USERS['admin'] && pass === USERS['admin'].pass){
      overlay.remove(); TIENDAS=[]; PAGOS={}; IPC_DATA=[]; save(); renderAll(); renderTiendas(); serverSetStatus('ok','Base vaciada ✓');
    } else {
      err.textContent='Contraseña incorrecta';
      inp.value=''; inp.focus(); inp.style.borderColor='var(--danger)';
      setTimeout(()=>{ inp.style.borderColor=''; err.textContent=''; },2000);
    }
  };
}

let POSPUESTOS = [];

function renderTriage(force = false) {
  const wrap = document.getElementById('triage-wrap');
  const list = document.getElementById('triage-list');
  if (!wrap || !list) return;
  
  // Si no se fuerza y el panel está cerrado, no hacer nada
  if (!force && wrap.style.display !== 'block') return;
  
  wrap.style.display = 'block';
  list.innerHTML = '';

  let pendientes = [];
  const hoy = new Date();

  TIENDAS.forEach(t => {
    if (POSPUESTOS.includes(t.id)) return;

    // 1. Criterio: Campos vacíos
    let camposVacios = [];
    if (!t.num) camposVacios.push('Número');
    if (!t.cuit) camposVacios.push('CUIT');
    if (!t.m2) camposVacios.push('Superficie (m²)');
    if (!t.tel) camposVacios.push('Teléfono');
    if (!t.dir) camposVacios.push('Dirección');

    if (camposVacios.length > 0) {
      pendientes.push({
        id: t.id,
        nombre: t.nombre,
        prioridad: 1,
        detalle: `Faltan datos: ${camposVacios.join(', ')}`,
        raw: t
      });
    }

    // 2. Criterio: Vencimientos
    if (t.locFin) {
      const v = new Date(t.locFin);
      const diff = (v - hoy) / (1000 * 60 * 60 * 24);
      if (diff < 30) {
        pendientes.push({
          id: t.id,
          nombre: t.nombre,
          prioridad: 2,
          detalle: diff < 0 ? `VENCIDO hace ${Math.abs(Math.floor(diff))} días` : `Vence en ${Math.floor(diff)} días`,
          raw: t,
          days: diff
        });
      }
    }
  });

  // Ordenar: prioridad 1 primero, luego por días de vencimiento
  pendientes.sort((a, b) => {
    if (a.prioridad !== b.prioridad) return a.prioridad - b.prioridad;
    if (a.prioridad === 2) return a.days - b.days;
    return 0;
  });

  const top4 = pendientes.slice(0, 4);

  if (top4.length === 0) {
    list.innerHTML = '<div style="padding:30px;text-align:center;color:var(--t3);font-family:var(--fm);font-size:12px;">No hay pendientes críticos en este momento.</div>';
    return;
  }

  top4.forEach(p => {
    const div = document.createElement('div');
    div.style.cssText = 'display:grid;grid-template-columns:140px 1fr 120px;align-items:center;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.05);gap:15px;';
    div.innerHTML = `
      <div style="font-weight:700;font-size:13px;color:var(--t1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.nombre}</div>
      <div style="font-family:var(--fm);font-size:11px;color:var(--t3);line-height:1.4;">${p.detalle}</div>
      <div style="display:flex;flex-direction:column;gap:4px;">
        <button class="btn ba bxs" onclick="editTienda('${p.id}')">ACTUALIZAR</button>
        <button class="btn bg2 bxs" onclick="posponerPendiente('${p.id}')">POSPONER</button>
      </div>
    `;
    list.appendChild(div);
  });
}

function posponerPendiente(id) {
  POSPUESTOS.push(id);
  renderTriage();
  showConfirm('Pospuesto', 'Se ha pospuesto esta alerta temporalmente.', ()=>{}, true);
}
// ══════════════════════════════════════════════
// CONTACTOS MAESTROS
// ══════════════════════════════════════════════
let EIDC = null;

function renderContactos() {
  const tbody = document.getElementById('contactos-tbody');
  if(!tbody) return;
  const s = [...CONTACTOS].sort((a,b) => a.nombre.localeCompare(b.nombre));
  tbody.innerHTML = s.map(c => `
    <tr>
      <td style="padding:10px 16px;font-weight:600;color:var(--t1);">${c.nombre}</td>
      <td style="padding:10px 16px;color:var(--t2);">${c.tel || '—'}</td>
      <td style="padding:10px 16px;color:var(--t2);">${c.email || '—'}</td>
      <td style="padding:10px 16px;color:var(--t2);">${c.cuit || '—'}</td>
      <td style="padding:10px 16px;white-space:nowrap;">
        <div style="display:flex;gap:6px;justify-content:flex-end;flex-wrap:nowrap;">
          <button class="btn bg2 bsm" onclick="editContacto('${c.id}')">Editar</button>
          <button class="btn bd bsm" onclick="delContacto('${c.id}')">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="5" class="empty">Sin contactos registrados</td></tr>';
}

function openModalContacto() {
  EIDC = null;
  document.getElementById('m-contacto-title').textContent = 'Nuevo contacto';
  ['co-nombre','co-tel','co-email','co-cuit'].forEach(id => document.getElementById(id).value = '');
  openModal('m-contacto');
}

function saveContacto() {
  const nombre = document.getElementById('co-nombre').value.trim();
  if(!nombre) { showConfirm('Campo obligatorio','El nombre es obligatorio.',()=>{},true); return; }
  const tel = document.getElementById('co-tel').value.trim();
  const email = document.getElementById('co-email').value.trim();
  const cuit = document.getElementById('co-cuit').value.trim();

  // Si editamos, actualizamos; si no, buscamos por nombre o creamos
  let c = EIDC ? CONTACTOS.find(x => x.id === EIDC) : CONTACTOS.find(x => x.nombre.toLowerCase() === nombre.toLowerCase());
  
  if(!c) {
    c = { id: 'c' + Date.now(), nombre, tel, email, cuit };
    CONTACTOS.push(c);
  } else {
    c.nombre = nombre;
    if(tel) c.tel = tel;
    if(email) c.email = email;
    if(cuit) c.cuit = cuit;
  }

  // Propagar a todas las tiendas
  propagateContactInfo(c);

  save();
  closeModal('m-contacto');
  renderContactos();
  renderTiendas(); // Refrescar por si cambiaron datos
  renderTriage(); // Refrescar alertas
}

function editContacto(id) {
  const c = CONTACTOS.find(x => x.id === id);
  if(!c) return;
  EIDC = id;
  document.getElementById('m-contacto-title').textContent = 'Editar contacto';
  document.getElementById('co-nombre').value = c.nombre;
  document.getElementById('co-tel').value = c.tel || '';
  document.getElementById('co-email').value = c.email || '';
  document.getElementById('co-cuit').value = c.cuit || '';
  openModal('m-contacto');
}

function delContacto(id) {
  showConfirm('¿Eliminar contacto?', 'Esto no afectará los datos actuales de las tiendas, pero se perderá la referencia maestra.', () => {
    CONTACTOS = CONTACTOS.filter(x => x.id !== id);
    save();
    renderContactos();
  });
}

function syncMasterContact(nombre, tel, email, cuit) {
  if(!nombre) return;
  let c = CONTACTOS.find(x => x.nombre.toLowerCase() === nombre.trim().toLowerCase());
  if(!c) {
    c = { id: 'c' + Date.now(), nombre: nombre.trim(), tel, email, cuit };
    CONTACTOS.push(c);
  } else {
    // Solo actualizamos si el dato de la tienda NO está vacío (para no borrar el maestro con info vacía)
    if(tel) c.tel = tel;
    if(email) c.email = email;
    if(cuit) c.cuit = cuit;
  }
  propagateContactInfo(c);
}

function propagateContactInfo(c) {
  let changed = false;
  TIENDAS.forEach(t => {
    if(t.prop === c.nombre || t.resp === c.nombre) {
      if(c.tel && t.tel !== c.tel) { t.tel = c.tel; changed = true; }
      if(c.email && t.cont !== c.email) { t.cont = c.email; changed = true; }
      if(c.cuit && t.cuit !== c.cuit) { t.cuit = c.cuit; changed = true; }
    }
  });
  if(changed) save();
}
// ══════════════════════════════════════════════
// REPORTES
// ══════════════════════════════════════════════
const REP_COLS_DEF = [
  {id:'nombre',label:'Tienda',checked:true},
  {id:'estado',label:'Estado',checked:true},
  {id:'num',label:'N°',checked:true},
  {id:'tipo',label:'Tipo',checked:true},
  {id:'resp',label:'Responsable',checked:true},
  {id:'tel',label:'Teléfono',checked:false},
  {id:'obs',label:'Observaciones',checked:false},
  {id:'monto',label:'Monto Base',checked:false},
  {id:'montoActual',label:'Monto Actual',checked:true},
  {id:'indice',label:'Índice',checked:true},
  {id:'ajuste',label:'Ajuste',checked:false},
  {id:'ini',label:'Inicio Contrato',checked:false},
  {id:'locFin',label:'Vencimiento',checked:true},
  {id:'locIni',label:'Ini. Locación',checked:false},
  {id:'locFinEsp',label:'Venc. Locación',checked:false},
  {id:'subIni',label:'Ini. Sublocación',checked:false},
  {id:'subFin',label:'Venc. Sublocación',checked:false},
  {id:'cauIni',label:'Ini. Caución',checked:false},
  {id:'cauFin',label:'Venc. Caución',checked:false},
  {id:'fraIni',label:'Ini. Franquicia',checked:false},
  {id:'fraFin',label:'Venc. Franquicia',checked:false},
  {id:'adenda',label:'Adenda',checked:false},
  {id:'depar',label:'Ubicación',checked:false}
];
let _repCols = [...REP_COLS_DEF];

function getRepColLabel(col, fContrato) {
  if(col.id === 'ini') {
    if(fContrato === 'LOCACION') return 'Inicio Locación';
    if(fContrato === 'SUBLOCACION') return 'Inicio Sublocación';
    if(fContrato === 'CAUCION') return 'Inicio Caución';
    if(fContrato === 'FRANQUICIA') return 'Inicio Franquicia';
    return 'Inicio Contrato';
  }
  if(col.id === 'locFin') {
    if(fContrato === 'LOCACION') return 'Venc. Locación';
    if(fContrato === 'SUBLOCACION') return 'Venc. Sublocación';
    if(fContrato === 'CAUCION') return 'Venc. Caución';
    if(fContrato === 'FRANQUICIA') return 'Venc. Franquicia';
    return 'Vencimiento';
  }
  return col.label;
}

function getStoreContractStatus(t, fContrato) {
  if (fContrato === 'LOCACION') {
    const d = t.locFin;
    const est = getEstCon(d, 'loc');
    return {
      est: est,
      days: dh(d),
      isVencido: Boolean(d && dh(d) < 0),
      isPorVencer: Boolean(d && dh(d) >= 0 && dh(d) <= 60),
      isVigente: Boolean(d && dh(d) > 60),
      isFaltante: !d
    };
  }
  if (fContrato === 'SUBLOCACION') {
    const d = t.subFin;
    const est = getEstCon(d, 'sub');
    return {
      est: est,
      days: dh(d),
      isVencido: Boolean(d && dh(d) < 0),
      isPorVencer: Boolean(d && dh(d) >= 0 && dh(d) <= 60),
      isVigente: Boolean(d && dh(d) > 60),
      isFaltante: !d
    };
  }
  if (fContrato === 'CAUCION') {
    const d = t.cauFin;
    const est = getEstCon(d, 'cau');
    return {
      est: est,
      days: dh(d),
      isVencido: Boolean(d && dh(d) < 0),
      isPorVencer: Boolean(d && dh(d) >= 0 && dh(d) <= 60),
      isVigente: Boolean(d && dh(d) > 60),
      isFaltante: !d
    };
  }
  if (fContrato === 'FRANQUICIA') {
    const d = t.fraFin;
    const est = getEstCon(d, 'fra');
    return {
      est: est,
      days: dh(d),
      isVencido: Boolean(d && dh(d) < 0),
      isPorVencer: Boolean(d && dh(d) >= 0 && dh(d) <= 60),
      isVigente: Boolean(d && dh(d) > 60),
      isFaltante: !d
    };
  }

  // ALL contratos
  const contracts = [
    { type: 'Locación', val: t.locFin, id: 'loc' },
    { type: 'Sublocación', val: t.subFin, id: 'sub' },
    { type: 'Caución', val: t.cauFin, id: 'cau' },
    { type: 'Franquicia', val: t.fraFin, id: 'fra' }
  ];
  const withDates = contracts.filter(c => c.val);
  const isVencido = withDates.some(c => dh(c.val) < 0);
  const isPorVencer = !isVencido && withDates.some(c => dh(c.val) >= 0 && dh(c.val) <= 60);
  const isFaltante = withDates.length === 0;
  const isVigente = withDates.length > 0 && !isVencido && !isPorVencer;

  let minDays = null;
  withDates.forEach(c => {
    const d = dh(c.val);
    if (minDays === null || d < minDays) minDays = d;
  });

  let est;
  if (isVencido) {
    const vencidosList = withDates.filter(c => dh(c.val) < 0).map(c => c.type);
    est = { l: `VENCIDO (${vencidosList.join(', ')})`, c: 'br' };
  } else if (isPorVencer) {
    const pvList = withDates.filter(c => dh(c.val) >= 0 && dh(c.val) <= 60).map(c => `${c.type} ${dh(c.val)}d`);
    est = { l: `POR VENCER (${pvList.join(', ')})`, c: 'by' };
  } else if (isFaltante) {
    est = { l: 'Sin fechas', c: 'bgr' };
  } else {
    est = { l: 'TODO EN ORDEN', c: 'bg' };
  }

  return {
    est,
    days: minDays,
    isVencido,
    isPorVencer,
    isVigente,
    isFaltante
  };
}

function getRepCellValue(t, colId, fContrato, raw = false) {
  if(colId === 'estado') {
    const st = getStoreContractStatus(t, fContrato);
    if(raw) return st.est.l;
    return `<span class="badge ${st.est.c}">${st.est.l}</span>`;
  }
  if(colId === 'montoActual') {
    const m = getMontoActual(t);
    return raw ? m : fmDec(m);
  }
  if(colId === 'monto') {
    return raw ? (t.monto || 0) : fmDec(t.monto);
  }
  if(colId === 'adenda') {
    const isAdenda = (t.adenda === 'si' || t.adenda === 'Sí' || t.adenda === true);
    return isAdenda ? 'Sí' : 'No';
  }
  if(colId === 'locFinEsp') {
    const val = t.locFin;
    if(raw) return val || '';
    if(!val) return '—';
    const d = dh(val);
    const colorStyle = (d !== null && d < 0) ? 'color:var(--danger);font-weight:600;' : ((d !== null && d <= 60) ? 'color:var(--warn);font-weight:600;' : '');
    return colorStyle ? `<span style="${colorStyle}">${fd(val)}</span>` : fd(val);
  }
  if(colId === 'ini') {
    let val = t.ini || t.locIni;
    if(fContrato === 'LOCACION') val = t.locIni || t.ini;
    else if(fContrato === 'SUBLOCACION') val = t.subIni;
    else if(fContrato === 'CAUCION') val = t.cauIni;
    else if(fContrato === 'FRANQUICIA') val = t.fraIni;
    return raw ? (val || '') : fd(val);
  }
  if(colId === 'locFin') {
    let val = t.locFin;
    if(fContrato === 'SUBLOCACION') val = t.subFin;
    else if(fContrato === 'CAUCION') val = t.cauFin;
    else if(fContrato === 'FRANQUICIA') val = t.fraFin;
    else if(fContrato === 'ALL') {
      if(!val) val = t.subFin || t.fraFin || t.cauFin || '';
    }
    if(raw) return val || '';
    if(!val) return '—';
    const d = dh(val);
    const colorStyle = (d !== null && d < 0) ? 'color:var(--danger);font-weight:600;' : ((d !== null && d <= 60) ? 'color:var(--warn);font-weight:600;' : '');
    return colorStyle ? `<span style="${colorStyle}">${fd(val)}</span>` : fd(val);
  }
  if(['locIni', 'subIni', 'subFin', 'cauIni', 'cauFin', 'fraIni', 'fraFin'].includes(colId)) {
    const val = t[colId];
    if(raw) return val || '';
    if(!val) return '—';
    if(colId.endsWith('Fin')) {
      const d = dh(val);
      const colorStyle = (d !== null && d < 0) ? 'color:var(--danger);font-weight:600;' : ((d !== null && d <= 60) ? 'color:var(--warn);font-weight:600;' : '');
      return colorStyle ? `<span style="${colorStyle}">${fd(val)}</span>` : fd(val);
    }
    return fd(val);
  }
  const val = t[colId] || '';
  return raw ? val : (val || '—');
}

function renderReportes() {
  const colWrap = document.getElementById('rep-cols');
  if(!colWrap) return;
  
  const fContrato = document.getElementById('rf-contrato') ? document.getElementById('rf-contrato').value : 'ALL';

  if(colWrap.innerHTML === '') {
    colWrap.innerHTML = _repCols.map(c => `
      <label style="display:flex;align-items:center;gap:10px;cursor:pointer;color:var(--t2);font-size:12px;">
        <input type="checkbox" ${c.checked?'checked':''} onchange="toggleRepCol('${c.id}', this.checked)" style="accent-color:var(--acc);">
        ${getRepColLabel(c, fContrato)}
      </label>
    `).join('');
  }

  const fTipo = document.getElementById('rf-tipo') ? document.getElementById('rf-tipo').value : 'ALL';
  const fIndice = document.getElementById('rf-indice') ? document.getElementById('rf-indice').value : 'ALL';
  const fEstado = document.getElementById('rf-estado') ? document.getElementById('rf-estado').value : 'ALL';
  
  let filtered = TIENDAS.filter(t => {
    if(fTipo !== 'ALL' && t.tipo !== fTipo) return false;
    if(fIndice !== 'ALL' && t.indice !== fIndice) return false;
    if(fContrato === 'LOCACION' && !t.locIni && !t.locFin && !t.ini) return false;
    if(fContrato === 'SUBLOCACION' && !t.subIni && !t.subFin) return false;
    if(fContrato === 'CAUCION' && !t.cauIni && !t.cauFin) return false;
    if(fContrato === 'FRANQUICIA' && !t.fraIni && !t.fraFin) return false;

    const st = getStoreContractStatus(t, fContrato);
    if(fEstado === 'VENCIDOS' && !st.isVencido) return false;
    if(fEstado === 'POR_VENCER' && !st.isPorVencer) return false;
    if(fEstado === 'VIGENTES' && !st.isVigente) return false;
    if(fEstado === 'FALTANTES' && !st.isFaltante) return false;

    return true;
  });

  // Ordenamiento inteligente: si es vencidos o por vencer, ordenar por urgencia
  if(fEstado === 'VENCIDOS' || fEstado === 'POR_VENCER') {
    filtered.sort((a, b) => {
      const stA = getStoreContractStatus(a, fContrato);
      const stB = getStoreContractStatus(b, fContrato);
      const dA = stA.days !== null ? stA.days : 99999;
      const dB = stB.days !== null ? stB.days : 99999;
      return dA - dB;
    });
  } else {
    filtered.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  document.getElementById('rep-count').textContent = `${filtered.length} tiendas filtradas`;

  const activeCols = _repCols.filter(c => c.checked);
  const thead = document.getElementById('rep-thead');
  const tbody = document.getElementById('rep-tbody');

  thead.innerHTML = `<tr>${activeCols.map(c => `<th style="text-align:left;padding:10px 16px;font-family:var(--fm);font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:var(--t3);background:var(--s2);border-bottom:1px solid var(--bdr);">${getRepColLabel(c, fContrato)}</th>`).join('')}</tr>`;
  
  tbody.innerHTML = filtered.map(t => {
    return `<tr>${activeCols.map(c => {
      const val = getRepCellValue(t, c.id, fContrato, false);
      return `<td style="padding:10px 16px;font-size:12px;border-bottom:1px solid var(--bdr);">${val}</td>`;
    }).join('')}</tr>`;
  }).join('') || '<tr><td colspan="100%" class="empty">No hay datos con estos filtros</td></tr>';
}

function toggleRepCol(id, val) {
  const col = _repCols.find(c => c.id === id);
  if(col) col.checked = val;
  renderReportes();
}

function exportReport(format) {
  const activeCols = _repCols.filter(c => c.checked);
  const fTipo = document.getElementById('rf-tipo') ? document.getElementById('rf-tipo').value : 'ALL';
  const fIndice = document.getElementById('rf-indice') ? document.getElementById('rf-indice').value : 'ALL';
  const fContrato = document.getElementById('rf-contrato') ? document.getElementById('rf-contrato').value : 'ALL';
  const fEstado = document.getElementById('rf-estado') ? document.getElementById('rf-estado').value : 'ALL';

  let filtered = TIENDAS.filter(t => {
    if(fTipo !== 'ALL' && t.tipo !== fTipo) return false;
    if(fIndice !== 'ALL' && t.indice !== fIndice) return false;
    if(fContrato === 'LOCACION' && !t.locIni && !t.locFin && !t.ini) return false;
    if(fContrato === 'SUBLOCACION' && !t.subIni && !t.subFin) return false;
    if(fContrato === 'CAUCION' && !t.cauIni && !t.cauFin) return false;
    if(fContrato === 'FRANQUICIA' && !t.fraIni && !t.fraFin) return false;

    const st = getStoreContractStatus(t, fContrato);
    if(fEstado === 'VENCIDOS' && !st.isVencido) return false;
    if(fEstado === 'POR_VENCER' && !st.isPorVencer) return false;
    if(fEstado === 'VIGENTES' && !st.isVigente) return false;
    if(fEstado === 'FALTANTES' && !st.isFaltante) return false;

    return true;
  });

  if(fEstado === 'VENCIDOS' || fEstado === 'POR_VENCER') {
    filtered.sort((a, b) => {
      const stA = getStoreContractStatus(a, fContrato);
      const stB = getStoreContractStatus(b, fContrato);
      const dA = stA.days !== null ? stA.days : 99999;
      const dB = stB.days !== null ? stB.days : 99999;
      return dA - dB;
    });
  } else {
    filtered.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  if(format === 'pdf') {
    window.print();
    return;
  }

  let content = '';
  const fileName = `Reporte_Tiendas_${new Date().toISOString().slice(0,10)}`;

  if(format === 'excel') {
    // Generar CSV
    const header = activeCols.map(c => `"${getRepColLabel(c, fContrato).replace(/"/g, '""')}"`).join(',');
    const rows = filtered.map(t => {
      return activeCols.map(c => {
        let val = getRepCellValue(t, c.id, fContrato, true);
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',');
    }).join('\n');
    content = '\uFEFF' + header + '\n' + rows;
    downloadBlob(content, fileName + '.csv', 'text/csv;charset=utf-8');
  } 
  else if(format === 'word') {
    const header = activeCols.map(c => `<th>${getRepColLabel(c, fContrato)}</th>`).join('');
    const rows = filtered.map(t => {
      return `<tr>${activeCols.map(c => {
        let val = getRepCellValue(t, c.id, fContrato, false);
        return `<td>${val}</td>`;
      }).join('')}</tr>`;
    }).join('');
    
    content = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Reporte</title><style>table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:8px;text-align:left;font-family:sans-serif;font-size:12px;}</style></head>
      <body><h2>Reporte de Tiendas</h2><table><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table></body></html>`;
    downloadBlob(content, fileName + '.doc', 'application/msword');
  }
  else if(format === 'whatsapp') {
    let text = `*REPORTE DE TIENDAS*\n_${new Date().toLocaleDateString('es-AR')}_\n\n`;
    
    filtered.forEach(t => {
      text += `• *${t.nombre}*\n`;
      activeCols.forEach(c => {
        if(c.id === 'nombre') return;
        let val = getRepCellValue(t, c.id, fContrato, true);
        text += `  └ ${getRepColLabel(c, fContrato)}: ${val}\n`;
      });
      text += `\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      showConfirm('¡Copiado!', 'El reporte se copió al portapapeles en formato WhatsApp.', () => {}, true);
    });
  }
}

function applyReportPreset(type) {
  const presets = {
    'loc': { cols: ['nombre', 'estado', 'ini', 'locFin', 'obs'], filter: 'ALL', contrato: 'LOCACION', estado: 'ALL' },
    'sub': { cols: ['nombre', 'estado', 'ini', 'locFin', 'obs'], filter: 'ALL', contrato: 'SUBLOCACION', estado: 'ALL' },
    'cau': { cols: ['nombre', 'estado', 'ini', 'locFin', 'obs'], filter: 'ALL', contrato: 'CAUCION', estado: 'ALL' },
    'fra': { cols: ['nombre', 'estado', 'ini', 'locFin', 'obs'], filter: 'ALL', contrato: 'FRANQUICIA', estado: 'ALL' },
    'ven': { cols: ['nombre', 'estado', 'ini', 'locFin', 'locFinEsp', 'subFin', 'cauFin', 'fraFin', 'obs'], filter: 'ALL', contrato: 'ALL', estado: 'ALL' },
    'eco': { cols: ['nombre', 'num', 'monto', 'montoActual', 'indice', 'ajuste'], filter: 'ALL', contrato: 'ALL', estado: 'ALL' },
    'tel': { cols: ['nombre', 'tipo', 'resp', 'tel', 'obs'], filter: 'FRANQUICIA', contrato: 'ALL', estado: 'ALL' },
    'all': { cols: _repCols.map(c => c.id), filter: 'ALL', contrato: 'ALL', estado: 'ALL' }
  };

  const p = presets[type];
  if(!p) return;

  // Actualizar columnas
  _repCols.forEach(c => {
    c.checked = p.cols.includes(c.id);
  });

  // Actualizar filtros
  const fTipo = document.getElementById('rf-tipo');
  if(fTipo) fTipo.value = p.filter;

  const fContrato = document.getElementById('rf-contrato');
  if(fContrato) fContrato.value = p.contrato || 'ALL';

  const fEstado = document.getElementById('rf-estado');
  if(fEstado) fEstado.value = p.estado || 'ALL';

  // Limpiar HTML de columnas para que se regenere con los nuevos checks
  document.getElementById('rep-cols').innerHTML = '';
  
  renderReportes();
}

function downloadBlob(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
