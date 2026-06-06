/* ============================================================
   CAUDAL — Store (capa de datos + persistencia localStorage)
   ============================================================ */
const Store = (() => {
  const K_USERS   = 'caudal:users';
  const K_SESSION = 'caudal:session';
  const K_DATA    = (uid) => `caudal:data:${uid}`;

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  /* ---------- low level ---------- */
  const read = (k, fallback) => {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  /* ---------- users / auth ---------- */
  const getUsers = () => read(K_USERS, []);
  const saveUsers = (u) => write(K_USERS, u);

  function register({ name, email, password, businessName }) {
    const users = getUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase()))
      throw new Error('Ya existe una cuenta con ese correo.');
    const user = { id: uid(), name, email, password, businessName, createdAt: Date.now() };
    users.push(user); saveUsers(users);
    write(K_DATA(user.id), defaultData(businessName));
    setSession(user.id);
    return user;
  }

  function login({ email, password }) {
    const user = getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.password !== password) throw new Error('Correo o contraseña incorrectos.');
    setSession(user.id);
    return user;
  }

  const setSession = (id) => write(K_SESSION, { id, at: Date.now() });
  const logout = () => localStorage.removeItem(K_SESSION);
  function currentUser() {
    const s = read(K_SESSION, null); if (!s) return null;
    return getUsers().find(u => u.id === s.id) || null;
  }
  function updateUser(patch) {
    const u = currentUser(); if (!u) return;
    Object.assign(u, patch);
    const users = getUsers().map(x => x.id === u.id ? u : x);
    saveUsers(users); return u;
  }

  /* ---------- per-user data ---------- */
  function defaultData(businessName) {
    return {
      transactions: [], invoices: [], clients: [],
      settings: {
        businessName: businessName || 'Mi Negocio',
        currency: 'CRC', ivaRate: 13, theme: 'dark',
        cedula: '', phone: '', address: ''
      }
    };
  }
  function data() {
    const u = currentUser(); if (!u) return defaultData('');
    return read(K_DATA(u.id), defaultData(u.businessName));
  }
  function save(d) { const u = currentUser(); if (u) write(K_DATA(u.id), d); }
  function patch(fn) { const d = data(); fn(d); save(d); return d; }

  /* ---------- transactions ---------- */
  const addTx = (tx) => patch(d => d.transactions.unshift({ id: uid(), ...tx }));
  const updateTx = (id, tx) => patch(d => { const i = d.transactions.findIndex(t => t.id === id); if (i > -1) d.transactions[i] = { ...d.transactions[i], ...tx }; });
  const deleteTx = (id) => patch(d => d.transactions = d.transactions.filter(t => t.id !== id));

  /* ---------- clients ---------- */
  const addClient = (c) => patch(d => d.clients.unshift({ id: uid(), createdAt: Date.now(), ...c }));
  const updateClient = (id, c) => patch(d => { const i = d.clients.findIndex(x => x.id === id); if (i > -1) d.clients[i] = { ...d.clients[i], ...c }; });
  const deleteClient = (id) => patch(d => d.clients = d.clients.filter(x => x.id !== id));

  /* ---------- invoices ---------- */
  const addInvoice = (inv) => patch(d => d.invoices.unshift({ id: uid(), ...inv }));
  const updateInvoice = (id, inv) => patch(d => { const i = d.invoices.findIndex(x => x.id === id); if (i > -1) d.invoices[i] = { ...d.invoices[i], ...inv }; });
  const deleteInvoice = (id) => patch(d => d.invoices = d.invoices.filter(x => x.id !== id));

  /* ---------- settings ---------- */
  const setSettings = (patchObj) => patch(d => Object.assign(d.settings, patchObj));

  /* ---------- import / export / reset ---------- */
  function exportJSON() { return JSON.stringify(data(), null, 2); }
  function importJSON(str) {
    const parsed = JSON.parse(str);
    if (!parsed.transactions || !parsed.settings) throw new Error('Archivo no válido.');
    save(parsed); return parsed;
  }
  function resetData() { const u = currentUser(); if (u) write(K_DATA(u.id), defaultData(u.businessName)); }

  /* ---------- demo seed ---------- */
  function seedDemo() {
    const users = getUsers();
    let demo = users.find(u => u.email === 'demo@caudal.app');
    if (!demo) {
      demo = { id: 'demo-' + uid(), name: 'Valeria Méndez', email: 'demo@caudal.app',
               password: 'demo1234', businessName: 'Café Volcán', createdAt: Date.now() };
      users.push(demo); saveUsers(users);
    }
    write(K_DATA(demo.id), buildDemoData());
    setSession(demo.id);
    return demo;
  }

  function buildDemoData() {
    const clients = [
      { id:'cl1', name:'Hotel Tabacón',        email:'compras@tabacon.cr',   phone:'2479-2000', company:'Tabacón S.A.', createdAt:Date.now() },
      { id:'cl2', name:'Soda La Esquina',      email:'laesquina@gmail.com',  phone:'8821-4490', company:'', createdAt:Date.now() },
      { id:'cl3', name:'Coopealianza R.L.',    email:'eventos@coopealianza.fi.cr', phone:'2785-1000', company:'Coopealianza', createdAt:Date.now() },
      { id:'cl4', name:'Mariana Solís',        email:'mariana.solis@outlook.com', phone:'7012-3388', company:'', createdAt:Date.now() },
    ];
    const cats = {
      income:  ['Ventas mostrador','Catering','Pedidos corporativos','Suscripciones'],
      expense: ['Inventario','Salarios','Alquiler','Servicios públicos','Marketing','Equipo','Impuestos']
    };
    const today = new Date();
    const txs = [];
    // generate 6 months of believable activity
    for (let m = 5; m >= 0; m--) {
      const base = new Date(today.getFullYear(), today.getMonth() - m, 1);
      const dayMax = (m === 0) ? today.getDate() : 28;
      const seasonal = 1 + (5 - m) * 0.06; // slight growth trend
      const incomeOps = 12 + Math.floor(Math.random() * 6);
      for (let i = 0; i < incomeOps; i++) {
        const amt = Math.round((180000 + Math.random() * 520000) * seasonal / 1000) * 1000;
        const day = 1 + Math.floor(Math.random() * dayMax);
        const cat = cats.income[Math.floor(Math.random() * cats.income.length)];
        txs.push({ id: uid(), type:'income', amount: amt, category: cat,
          description: cat, date: iso(base, day), hasIVA: true, ivaAmount: Math.round(amt - amt/1.13),
          clientId: Math.random() > 0.5 ? clients[Math.floor(Math.random()*clients.length)].id : null });
      }
      // fixed monthly expenses
      txs.push(expense('Alquiler del local', 'Alquiler', 650000, base, 1));
      txs.push(expense('Planilla del personal', 'Salarios', 1850000, base, 28));
      txs.push(expense('Electricidad y agua', 'Servicios públicos', 165000 + Math.random()*40000|0, base, 12));
      const buys = 4 + Math.floor(Math.random()*4);
      for (let i=0;i<buys;i++){
        const amt = Math.round((90000 + Math.random()*260000)/1000)*1000;
        txs.push(expense('Compra de insumos', 'Inventario', amt, base, 1+Math.floor(Math.random()*dayMax)));
      }
      if (Math.random()>0.4) txs.push(expense('Campaña en redes', 'Marketing', 75000+Math.random()*80000|0, base, 1+Math.floor(Math.random()*dayMax)));
    }
    function expense(desc, cat, amt, base, day){
      return { id: uid(), type:'expense', amount: Math.round(amt), category: cat,
               description: desc, date: iso(base, day), hasIVA: cat!=='Salarios',
               ivaAmount: cat!=='Salarios' ? Math.round(amt - amt/1.13) : 0, clientId:null };
    }
    function iso(base, day){ const d=new Date(base.getFullYear(), base.getMonth(), day); return d.toISOString().slice(0,10); }
    txs.sort((a,b)=> b.date.localeCompare(a.date));

    const invoices = [
      mkInv('0001','cl1',[['Catering evento corporativo 60 pax',60,8500],['Servicio de meseros',3,25000]], 6, 'paid'),
      mkInv('0002','cl3',[['Coffee break reunión anual',120,4200],['Alquiler de equipo',1,85000]], 3, 'paid'),
      mkInv('0004','cl2',[['Pedido mayorista de repostería',1,340000]], 1, 'pending'),
      mkInv('0005','cl1',[['Catering inauguración',80,9200]], -4, 'overdue'),
      mkInv('0006','cl4',[['Torta personalizada XV años',1,95000]], 10, 'pending'),
    ];
    function mkInv(number, clientId, items, daysFromNow, status){
      const list = items.map(([desc,qty,price])=>({desc,qty,price}));
      const subtotal = list.reduce((s,i)=>s+i.qty*i.price,0);
      const iva = Math.round(subtotal*0.13);
      const issue = new Date(today); issue.setDate(issue.getDate() - (10 - daysFromNow));
      const due = new Date(today); due.setDate(due.getDate() + daysFromNow);
      return { id: uid(), number, clientId, items:list, date: issue.toISOString().slice(0,10),
               dueDate: due.toISOString().slice(0,10), status, ivaRate:13, subtotal, iva, total: subtotal+iva };
    }

    return { transactions: txs, invoices, clients,
      settings: { businessName:'Café Volcán', currency:'CRC', ivaRate:13, theme:'dark',
                  cedula:'3-101-789456', phone:'2479-8800', address:'La Fortuna, San Carlos, Alajuela' } };
  }

  return {
    register, login, logout, currentUser, updateUser, getUsers,
    data, save, patch,
    addTx, updateTx, deleteTx,
    addClient, updateClient, deleteClient,
    addInvoice, updateInvoice, deleteInvoice,
    setSettings, exportJSON, importJSON, resetData, seedDemo, uid
  };
})();

/* ============================================================
   Formato / helpers globales
   ============================================================ */
const Fmt = {
  currencySym: { CRC: '₡', USD: '$' },
  money(n, currency = 'CRC', compact = false) {
    const sym = this.currencySym[currency] || '';
    const neg = n < 0; n = Math.abs(n);
    let str;
    if (compact && n >= 1000000) str = (n/1000000).toFixed(n >= 10000000 ? 0 : 1) + 'M';
    else if (compact && n >= 1000) str = (n/1000).toFixed(0) + 'k';
    else str = n.toLocaleString('es-CR', { maximumFractionDigits: currency === 'USD' ? 2 : 0 });
    return (neg ? '−' : '') + sym + str;
  },
  date(iso) {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' });
  },
  monthLabel(d) { return d.toLocaleDateString('es-CR', { month: 'short' }).replace('.', ''); },
  relative(iso) {
    const days = Math.round((Date.now() - new Date(iso+'T00:00:00')) / 864e5);
    if (days === 0) return 'Hoy'; if (days === 1) return 'Ayer';
    if (days < 0) return `en ${-days} d`; if (days < 30) return `hace ${days} d`;
    return Fmt.date(iso);
  }
};

/* ---------- toast ---------- */
function toast(msg, type = 'success') {
  let host = document.getElementById('toasts');
  if (!host) { host = document.createElement('div'); host.id = 'toasts'; document.body.appendChild(host); }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="dot"></span><span>${msg}</span>`;
  host.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 3200);
}
