/* ============================================================
   CAUDAL — App controller
   ============================================================ */

/* guard */
if (!Store.currentUser()) location.replace('index.html');

/* ---------- icons ---------- */
const I = {
  dash:'M3 13h8V3H3zM13 21h8V11h-8zM13 3v6h8V3zM3 21h8v-6H3z',
  tx:'M7 7h10v10M7 17L17 7',
  invoice:'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M9 13h6M9 17h4',
  clients:'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8M23 21v-2a4 4 0 00-3-3.9',
  reports:'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
  settings:'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
  plus:'M12 5v14M5 12h14', search:'M21 21l-4.3-4.3M11 19a8 8 0 100-16 8 8 0 000 16z',
  edit:'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4z',
  trash:'M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2',
  download:'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
  logout:'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  arrowUp:'M12 19V5M5 12l7-7 7 7', arrowDown:'M12 5v14M5 12l7 7 7-7',
  menu:'M3 12h18M3 6h18M3 18h18', x:'M18 6L6 18M6 6l12 12',
  wallet:'M21 12V7H5a2 2 0 010-4h14v4M3 5v14a2 2 0 002 2h16v-5M18 12a2 2 0 000 4h4v-4z',
  tax:'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
};
const ic = (name, size=20) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${I[name]}"/></svg>`;

/* ---------- theme ---------- */
function applyTheme(t){ document.documentElement.setAttribute('data-theme', t); localStorage.setItem('caudal:theme', t); }
applyTheme(Store.data().settings.theme || localStorage.getItem('caudal:theme') || 'dark');

/* ---------- date / metric helpers ---------- */
const monthKey = (iso) => iso.slice(0,7);
const lastMonths = (n) => { const arr=[]; const d=new Date(); d.setDate(1);
  for(let i=n-1;i>=0;i--){ const m=new Date(d.getFullYear(), d.getMonth()-i, 1); arr.push({key:m.toISOString().slice(0,7), label:Fmt.monthLabel(m)});} return arr; };

function metrics(){
  const d = Store.data(), cur = d.settings.currency, iva = d.settings.ivaRate;
  const txs = d.transactions;
  const sum = (f) => txs.filter(f).reduce((s,t)=>s+t.amount,0);
  const income = sum(t=>t.type==='income'), expense = sum(t=>t.type==='expense');
  const balance = income - expense;
  const months = lastMonths(6);
  const thisKey = months[months.length-1].key;
  const mIncome = sum(t=>t.type==='income' && monthKey(t.date)===thisKey);
  const mExpense = sum(t=>t.type==='expense' && monthKey(t.date)===thisKey);
  const prevKey = months[months.length-2]?.key;
  const pIncome = sum(t=>t.type==='income' && monthKey(t.date)===prevKey);
  const pExpense = sum(t=>t.type==='expense' && monthKey(t.date)===prevKey);
  // series
  const seriesIn = months.map(m=>sum(t=>t.type==='income' && monthKey(t.date)===m.key));
  const seriesEx = months.map(m=>sum(t=>t.type==='expense' && monthKey(t.date)===m.key));
  // iva this month: cobrado (ingresos) - crédito (gastos con iva)
  const ivaCobrado = txs.filter(t=>t.type==='income' && monthKey(t.date)===thisKey).reduce((s,t)=>s+(t.ivaAmount||0),0);
  const ivaCredito = txs.filter(t=>t.type==='expense' && monthKey(t.date)===thisKey).reduce((s,t)=>s+(t.ivaAmount||0),0);
  const ivaOwed = Math.max(0, ivaCobrado - ivaCredito);
  // expense by category
  const catMap = {};
  txs.filter(t=>t.type==='expense').forEach(t=>{ catMap[t.category]=(catMap[t.category]||0)+t.amount; });
  const cats = Object.entries(catMap).map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value);
  // projection: avg net last 3 months
  const nets = months.slice(-3).map((m,i)=> seriesIn[months.length-3+i]-seriesEx[months.length-3+i]);
  const avgNet = nets.reduce((a,b)=>a+b,0)/(nets.length||1);
  const pct = (cur,prev)=> prev? ((cur-prev)/prev*100) : (cur?100:0);
  return { cur, iva, income, expense, balance, mIncome, mExpense, mNet:mIncome-mExpense,
    months, seriesIn, seriesEx, ivaOwed, ivaCobrado, ivaCredito, cats, avgNet,
    dIncome: pct(mIncome,pIncome), dExpense: pct(mExpense,pExpense),
    txCount: txs.length };
}

const CATS = {
  income: ['Ventas','Servicios','Catering','Pedidos corporativos','Suscripciones','Intereses','Otros ingresos'],
  expense:['Inventario','Salarios','Alquiler','Servicios públicos','Marketing','Equipo','Transporte','Impuestos','Comisiones','Otros gastos']
};

/* ============================================================
   ROUTER
   ============================================================ */
const routes = {
  dashboard:  { title:'Resumen', sub:'Tu negocio de un vistazo', render: viewDashboard },
  movimientos:{ title:'Movimientos', sub:'Ingresos y gastos', render: viewTransactions },
  facturas:   { title:'Facturas', sub:'Cobros a clientes', render: viewInvoices },
  clientes:   { title:'Clientes', sub:'Tu cartera', render: viewClients },
  reportes:   { title:'Reportes', sub:'Estados e impuestos', render: viewReports },
  ajustes:    { title:'Ajustes', sub:'Configuración y datos', render: viewSettings },
};
function route(){
  const key = (location.hash.slice(1) || 'dashboard');
  const r = routes[key] || routes.dashboard;
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active', n.dataset.route===key));
  document.getElementById('pageTitle').textContent = r.title;
  document.getElementById('pageSub').textContent = r.sub;
  const c = document.getElementById('content'); c.innerHTML=''; c.className='content view';
  r.render(c);
  closeSidebar();
}
window.addEventListener('hashchange', route);

/* ============================================================
   VIEWS
   ============================================================ */
function viewDashboard(c){
  const m = metrics(); const P = Charts.palette();
  if(m.txCount===0){ c.appendChild(emptyState('Aún no hay datos','Empieza registrando tu primer ingreso o gasto para ver tu negocio cobrar vida.','Registrar movimiento', ()=>openTxModal())); return; }

  const kpis = [
    {lbl:'Balance total', val:Fmt.money(m.balance,m.cur), ico:'wallet', color:'var(--accent)', spark:m.months.map((_,i)=>m.seriesIn.slice(0,i+1).reduce((a,b)=>a+b,0)-m.seriesEx.slice(0,i+1).reduce((a,b)=>a+b,0)), delta:null},
    {lbl:'Ingresos del mes', val:Fmt.money(m.mIncome,m.cur), ico:'arrowUp', color:P[0], spark:m.seriesIn, delta:m.dIncome},
    {lbl:'Gastos del mes', val:Fmt.money(m.mExpense,m.cur), ico:'arrowDown', color:P[1], spark:m.seriesEx, delta:m.dExpense, invert:true},
    {lbl:'IVA por pagar', val:Fmt.money(m.ivaOwed,m.cur), ico:'tax', color:'var(--warn)', spark:m.months.map(()=>m.ivaOwed), delta:null},
  ];
  const grid = el('div','kpi-grid stagger');
  kpis.forEach((k,idx)=>{
    const card = el('div','kpi');
    let deltaHtml='';
    if(k.delta!==null && isFinite(k.delta)){
      const good = k.invert ? k.delta<=0 : k.delta>=0;
      deltaHtml = `<span class="delta ${good?'text-pos':'text-neg'}">${ic(k.delta>=0?'arrowUp':'arrowDown',13)} ${Math.abs(k.delta).toFixed(1)}% vs mes anterior</span>`;
    } else deltaHtml = `<span class="delta text-faint">acumulado</span>`;
    card.innerHTML = `<div class="top"><span class="lbl">${k.lbl}</span><span class="ico" style="color:${k.color}">${ic(k.ico,18)}</span></div>
      <div class="val">${k.val}</div>${deltaHtml}<canvas id="sk${idx}"></canvas>`;
    grid.appendChild(card);
  });
  c.appendChild(grid);

  // charts row
  const row = el('div','dash-grid');
  const flowPanel = el('div','panel');
  flowPanel.innerHTML = `<div class="panel-head"><h3>Flujo de caja</h3>
    <div class="seg"><button class="active" data-ch="area">Líneas</button><button data-ch="bars">Barras</button></div></div>
    <canvas id="flowChart" height="260"></canvas>
    <div class="legend"><span class="lg"><i style="background:${P[0]}"></i>Ingresos</span><span class="lg"><i style="background:${P[1]}"></i>Gastos</span></div>`;
  row.appendChild(flowPanel);

  const catPanel = el('div','panel');
  const catColors = m.cats.slice(0,6).map((_,i)=>P[i%P.length]);
  catPanel.innerHTML = `<div class="panel-head"><h3>Gastos por categoría</h3></div>
    <canvas id="catChart" height="200"></canvas>
    <div class="cat-list">${m.cats.slice(0,6).map((ct,i)=>`<div class="cat-row"><i style="background:${catColors[i]}"></i><span class="nm">${ct.label}</span><span class="amt">${Fmt.money(ct.value,m.cur)}</span></div>`).join('') || '<p class="text-faint" style="font-size:13px">Sin gastos registrados</p>'}</div>`;
  row.appendChild(catPanel);
  c.appendChild(row);

  // projection + recent
  const row2 = el('div','dash-grid');
  const proj = el('div','panel');
  const projMonths = lastMonths(3).concat(); // future labels
  const futureLabels = [1,2,3].map(i=>{ const d=new Date(); d.setMonth(d.getMonth()+i); return Fmt.monthLabel(d); });
  let runBal = m.balance;
  const projData = futureLabels.map(()=> (runBal += m.avgNet));
  proj.innerHTML = `<div class="panel-head"><h3>Proyección de caja · 3 meses</h3><span class="pill ${m.avgNet>=0?'pill-pos':'pill-neg'}">${m.avgNet>=0?'Tendencia positiva':'Tendencia negativa'}</span></div>
    <p class="text-dim" style="font-size:13.5px;margin-bottom:14px">Según tu flujo neto promedio de ${Fmt.money(m.avgNet,m.cur)} al mes, tu balance proyectado sería:</p>
    <canvas id="projChart" height="180"></canvas>`;
  row2.appendChild(proj);

  const recent = el('div','panel');
  const rtx = Store.data().transactions.slice(0,6);
  recent.innerHTML = `<div class="panel-head"><h3>Movimientos recientes</h3><a href="#movimientos" class="btn btn-subtle btn-sm">Ver todos</a></div>
    <div>${rtx.map(t=>`<div class="flex items-center justify-between" style="padding:10px 0;border-bottom:1px solid var(--border)">
      <div class="flex items-center gap-3"><span class="ico" style="width:32px;height:32px;border-radius:9px;display:grid;place-items:center;background:${t.type==='income'?'var(--accent-soft)':'color-mix(in srgb,var(--neg) 12%,transparent)'};color:${t.type==='income'?'var(--accent)':'var(--neg)'}">${ic(t.type==='income'?'arrowUp':'arrowDown',15)}</span>
      <div><div class="t-main" style="font-size:13.5px">${t.description}</div><div class="t-sub">${t.category} · ${Fmt.relative(t.date)}</div></div></div>
      <span class="${t.type==='income'?'amt-pos':'amt-neg'}">${t.type==='income'?'+':'−'}${Fmt.money(t.amount,m.cur)}</span></div>`).join('')}</div>`;
  row2.appendChild(recent);
  c.appendChild(row2);

  // draw
  requestAnimationFrame(()=>{
    kpis.forEach((k,i)=> Charts.spark(document.getElementById('sk'+i), k.spark.length>1?k.spark:[0,k.spark[0]||0], k.color.startsWith('var')?getCss(k.color):k.color));
    drawFlow('area');
    Charts.donut(document.getElementById('catChart'), m.cats.slice(0,6).map((ct,i)=>({label:ct.label,value:ct.value,color:catColors[i]})), {currency:m.cur, centerLabel:'Gastos'});
    Charts.area(document.getElementById('projChart'), futureLabels, [{name:'Balance proy.',color:getCss('--c3'),data:projData.map(v=>Math.max(0,v))}], {currency:m.cur});
  });
  flowPanel.querySelectorAll('.seg button').forEach(b=> b.onclick=()=>{ flowPanel.querySelectorAll('.seg button').forEach(x=>x.classList.remove('active')); b.classList.add('active'); drawFlow(b.dataset.ch); });
  function drawFlow(type){
    const fn = type==='bars'?Charts.bars:Charts.area;
    fn(document.getElementById('flowChart'), m.months.map(x=>x.label),
      [{name:'Ingresos',color:P[0],data:m.seriesIn},{name:'Gastos',color:P[1],data:m.seriesEx}], {currency:m.cur});
  }
  window._redraw = ()=>route();
}

function viewTransactions(c){
  const d = Store.data(), m = metrics();
  const bar = el('div','toolbar');
  bar.innerHTML = `<div class="search">${ic('search',18)}<input class="input" id="txSearch" placeholder="Buscar movimiento o categoría…"></div>
    <select class="select" id="txFilter" style="width:auto"><option value="all">Todos</option><option value="income">Ingresos</option><option value="expense">Gastos</option></select>
    <button class="btn btn-primary" onclick="openTxModal()">${ic('plus',17)} Nuevo movimiento</button>`;
  c.appendChild(bar);

  const wrap = el('div','table-wrap'); wrap.id='txTable'; c.appendChild(wrap);
  function render(){
    const q = (document.getElementById('txSearch').value||'').toLowerCase();
    const f = document.getElementById('txFilter').value;
    let rows = d.transactions.filter(t=> (f==='all'||t.type===f) &&
      (t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)));
    if(!rows.length){ wrap.innerHTML=''; wrap.appendChild(emptyState('Sin movimientos','No hay movimientos que coincidan. Registra uno nuevo para empezar.','Nuevo movimiento',()=>openTxModal())); return; }
    wrap.innerHTML = `<table><thead><tr><th>Descripción</th><th>Categoría</th><th>Fecha</th><th>IVA</th><th style="text-align:right">Monto</th><th></th></tr></thead><tbody>
      ${rows.map(t=>{const cl=d.clients.find(x=>x.id===t.clientId);return `<tr>
        <td><div class="t-main">${t.description}</div>${cl?`<div class="t-sub">${cl.name}</div>`:''}</td>
        <td><span class="pill pill-dim">${t.category}</span></td>
        <td class="text-dim">${Fmt.date(t.date)}</td>
        <td class="mono text-dim" style="font-size:13px">${t.ivaAmount?Fmt.money(t.ivaAmount,m.cur):'—'}</td>
        <td style="text-align:right" class="${t.type==='income'?'amt-pos':'amt-neg'} mono">${t.type==='income'?'+':'−'}${Fmt.money(t.amount,m.cur)}</td>
        <td><div class="row-actions"><button onclick="openTxModal('${t.id}')">${ic('edit',16)}</button><button class="del" onclick="delTx('${t.id}')">${ic('trash',16)}</button></div></td>
      </tr>`;}).join('')}</tbody></table>`;
  }
  render();
  document.getElementById('txSearch').oninput = render;
  document.getElementById('txFilter').onchange = render;
  window._txRender = render;
}

function viewClients(c){
  const d = Store.data(), m = metrics();
  const bar = el('div','toolbar');
  bar.innerHTML = `<div class="search">${ic('search',18)}<input class="input" id="clSearch" placeholder="Buscar cliente…"></div>
    <button class="btn btn-primary" onclick="openClientModal()">${ic('plus',17)} Nuevo cliente</button>`;
  c.appendChild(bar);
  const grid = el('div','client-grid stagger'); grid.id='clGrid'; c.appendChild(grid);
  function spent(id){ return d.transactions.filter(t=>t.type==='income'&&t.clientId===id).reduce((s,t)=>s+t.amount,0)
    + d.invoices.filter(iv=>iv.clientId===id&&iv.status==='paid').reduce((s,iv)=>s+iv.total,0); }
  function render(){
    const q=(document.getElementById('clSearch').value||'').toLowerCase();
    const list = d.clients.filter(cl=> cl.name.toLowerCase().includes(q)||(cl.company||'').toLowerCase().includes(q));
    if(!list.length){ grid.innerHTML=''; grid.appendChild(emptyState('Sin clientes','Agrega tus clientes para llevar el registro de cuánto te compra cada uno.','Nuevo cliente',()=>openClientModal())); return; }
    const P=Charts.palette();
    grid.innerHTML = list.map((cl,i)=>`<div class="client-card">
      <div class="corner"><button class="icon-btn" style="width:30px;height:30px" onclick="openClientModal('${cl.id}')">${ic('edit',15)}</button><button class="icon-btn" style="width:30px;height:30px" onclick="delClient('${cl.id}')">${ic('trash',15)}</button></div>
      <div class="av" style="background:linear-gradient(135deg,${P[i%P.length]},${P[(i+2)%P.length]})">${initials(cl.name)}</div>
      <h4>${cl.name}</h4><div class="co">${cl.company||cl.email||'—'}</div>
      <div class="stat"><span class="text-dim" style="font-size:12.5px">Total facturado</span><b>${Fmt.money(spent(cl.id),m.cur)}</b></div>
    </div>`).join('');
  }
  render();
  document.getElementById('clSearch').oninput = render;
  window._clRender = render;
}

function viewInvoices(c){
  const d = Store.data(), m = metrics();
  // refresh overdue
  const todayStr = new Date().toISOString().slice(0,10);
  d.invoices.forEach(iv=>{ if(iv.status==='pending' && iv.dueDate < todayStr) iv.status='overdue'; });
  Store.save(d);

  const totalPend = d.invoices.filter(i=>i.status!=='paid').reduce((s,i)=>s+i.total,0);
  const totalPaid = d.invoices.filter(i=>i.status==='paid').reduce((s,i)=>s+i.total,0);
  const summary = el('div','kpi-grid'); summary.style.gridTemplateColumns='repeat(3,1fr)';
  summary.innerHTML = `
    <div class="kpi"><div class="top"><span class="lbl">Por cobrar</span><span class="ico" style="color:var(--warn)">${ic('invoice',18)}</span></div><div class="val">${Fmt.money(totalPend,m.cur)}</div><span class="delta text-faint">${d.invoices.filter(i=>i.status!=='paid').length} facturas pendientes</span></div>
    <div class="kpi"><div class="top"><span class="lbl">Cobrado</span><span class="ico" style="color:var(--accent)">${ic('tax',18)}</span></div><div class="val">${Fmt.money(totalPaid,m.cur)}</div><span class="delta text-faint">${d.invoices.filter(i=>i.status==='paid').length} facturas pagadas</span></div>
    <div class="kpi"><div class="top"><span class="lbl">Total emitido</span><span class="ico">${ic('reports',18)}</span></div><div class="val">${Fmt.money(totalPend+totalPaid,m.cur)}</div><span class="delta text-faint">${d.invoices.length} en total</span></div>`;
  c.appendChild(summary);

  const bar = el('div','toolbar'); bar.style.marginTop='22px';
  bar.innerHTML = `<div class="search">${ic('search',18)}<input class="input" id="ivSearch" placeholder="Buscar factura o cliente…"></div>
    <button class="btn btn-primary" onclick="openInvoiceModal()">${ic('plus',17)} Nueva factura</button>`;
  c.appendChild(bar);
  const wrap = el('div','table-wrap'); wrap.id='ivTable'; c.appendChild(wrap);
  const stName = {paid:'Pagada',pending:'Pendiente',overdue:'Vencida'};
  function render(){
    const q=(document.getElementById('ivSearch').value||'').toLowerCase();
    const rows = d.invoices.filter(iv=>{const cl=d.clients.find(x=>x.id===iv.clientId);return ('factura '+iv.number).includes(q)||iv.number.includes(q)||(cl&&cl.name.toLowerCase().includes(q));});
    if(!rows.length){ wrap.innerHTML=''; wrap.appendChild(emptyState('Sin facturas','Crea tu primera factura para empezar a cobrar a tus clientes de forma profesional.','Nueva factura',()=>openInvoiceModal())); return; }
    wrap.innerHTML = `<table><thead><tr><th>Factura</th><th>Cliente</th><th>Emitida</th><th>Vence</th><th>Estado</th><th style="text-align:right">Total</th><th></th></tr></thead><tbody>
      ${rows.map(iv=>{const cl=d.clients.find(x=>x.id===iv.clientId);return `<tr>
        <td class="mono t-main">#${iv.number}</td>
        <td>${cl?cl.name:'—'}</td>
        <td class="text-dim">${Fmt.date(iv.date)}</td>
        <td class="text-dim">${Fmt.date(iv.dueDate)}</td>
        <td><span class="pill st-${iv.status}">${stName[iv.status]}</span></td>
        <td style="text-align:right" class="mono t-main">${Fmt.money(iv.total,m.cur)}</td>
        <td><div class="row-actions">
          ${iv.status!=='paid'?`<button onclick="markPaid('${iv.id}')" title="Marcar pagada">${ic('tax',16)}</button>`:''}
          <button onclick="printInvoice('${iv.id}')" title="Imprimir">${ic('download',16)}</button>
          <button onclick="openInvoiceModal('${iv.id}')">${ic('edit',16)}</button>
          <button class="del" onclick="delInvoice('${iv.id}')">${ic('trash',16)}</button></div></td>
      </tr>`;}).join('')}</tbody></table>`;
  }
  render();
  document.getElementById('ivSearch').oninput = render;
  window._ivRender = render;
}

function viewReports(c){
  const d = Store.data(), m = metrics(); const P=Charts.palette();
  const incomeByCat={}, expByCat={};
  d.transactions.forEach(t=>{ const map=t.type==='income'?incomeByCat:expByCat; map[t.category]=(map[t.category]||0)+t.amount; });

  const grid = el('div','report-grid stagger');
  // P&L
  const pnl = el('div','panel');
  pnl.innerHTML = `<div class="panel-head"><h3>Estado de resultados</h3><span class="pill pill-dim">Histórico</span></div>
    <div class="pnl-row"><span class="lbl">Ingresos totales</span><b class="text-pos">${Fmt.money(m.income,m.cur)}</b></div>
    ${Object.entries(incomeByCat).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="pnl-row"><span class="lbl" style="padding-left:14px;font-size:13px">${k}</span><span class="mono text-dim">${Fmt.money(v,m.cur)}</span></div>`).join('')}
    <div class="pnl-row"><span class="lbl">Gastos totales</span><b class="text-neg">−${Fmt.money(m.expense,m.cur)}</b></div>
    ${Object.entries(expByCat).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="pnl-row"><span class="lbl" style="padding-left:14px;font-size:13px">${k}</span><span class="mono text-dim">−${Fmt.money(v,m.cur)}</span></div>`).join('')}
    <div class="pnl-row total"><span>Utilidad neta</span><span class="${m.balance>=0?'text-pos':'text-neg'}">${Fmt.money(m.balance,m.cur)}</span></div>`;
  grid.appendChild(pnl);

  // IVA report
  const ivaP = el('div','panel');
  const ivaInTotal = d.transactions.filter(t=>t.type==='income').reduce((s,t)=>s+(t.ivaAmount||0),0);
  const ivaExTotal = d.transactions.filter(t=>t.type==='expense').reduce((s,t)=>s+(t.ivaAmount||0),0);
  ivaP.innerHTML = `<div class="panel-head"><h3>Reporte de IVA (${m.iva}%)</h3><span class="pill pill-warn">Hacienda</span></div>
    <p class="text-dim" style="font-size:13.5px;margin-bottom:16px">Resumen del impuesto sobre el valor agregado para tu declaración.</p>
    <div class="pnl-row"><span class="lbl">IVA cobrado (débito fiscal)</span><b class="mono">${Fmt.money(ivaInTotal,m.cur)}</b></div>
    <div class="pnl-row"><span class="lbl">IVA pagado (crédito fiscal)</span><b class="mono">${Fmt.money(ivaExTotal,m.cur)}</b></div>
    <div class="pnl-row total"><span>IVA a liquidar</span><span class="${ivaInTotal-ivaExTotal>=0?'text-neg':'text-pos'}">${Fmt.money(Math.max(0,ivaInTotal-ivaExTotal),m.cur)}</span></div>
    <p class="text-faint" style="font-size:12px;margin-top:14px">Cálculo referencial. No sustituye asesoría contable profesional.</p>`;
  grid.appendChild(ivaP);
  c.appendChild(grid);

  // monthly comparison chart
  const chartP = el('div','panel'); chartP.style.marginTop='16px';
  chartP.innerHTML = `<div class="panel-head"><h3>Ingresos vs gastos · últimos 6 meses</h3>
    <button class="btn btn-ghost btn-sm" onclick="exportCSV()">${ic('download',15)} Exportar CSV</button></div>
    <canvas id="repBars" height="280"></canvas>
    <div class="legend"><span class="lg"><i style="background:${P[0]}"></i>Ingresos</span><span class="lg"><i style="background:${P[1]}"></i>Gastos</span></div>`;
  c.appendChild(chartP);
  requestAnimationFrame(()=> Charts.bars(document.getElementById('repBars'), m.months.map(x=>x.label),
    [{name:'Ingresos',color:P[0],data:m.seriesIn},{name:'Gastos',color:P[1],data:m.seriesEx}], {currency:m.cur}));
}

function viewSettings(c){
  const d = Store.data(), s = d.settings, u = Store.currentUser();
  const wrap = el('div','stagger'); wrap.style.display='grid'; wrap.style.gap='16px'; wrap.style.maxWidth='720px';

  // profile / business
  const biz = el('div','panel settings-section');
  biz.innerHTML = `<div class="panel-head"><h3>Negocio</h3></div>
    <div class="field"><label>Nombre del negocio</label><input class="input" id="setBiz" value="${attr(s.businessName)}"></div>
    <div class="field-row"><div class="field"><label>Cédula jurídica</label><input class="input" id="setCedula" value="${attr(s.cedula)}" placeholder="3-101-000000"></div>
    <div class="field"><label>Teléfono</label><input class="input" id="setPhone" value="${attr(s.phone)}" placeholder="2222-2222"></div></div>
    <div class="field"><label>Dirección</label><input class="input" id="setAddr" value="${attr(s.address)}" placeholder="Provincia, cantón, distrito"></div>
    <button class="btn btn-primary" onclick="saveBiz()">Guardar cambios</button>`;
  wrap.appendChild(biz);

  // preferences
  const pref = el('div','panel settings-section');
  pref.innerHTML = `<div class="panel-head"><h3>Preferencias</h3></div>
    <div class="field"><label>Tema</label><div class="seg-pills" id="themePills">
      <div class="seg-pill ${s.theme==='dark'?'active':''}" data-t="dark">🌙 Oscuro</div>
      <div class="seg-pill ${s.theme==='light'?'active':''}" data-t="light">☀️ Claro</div></div></div>
    <div class="field"><label>Moneda</label><div class="seg-pills" id="curPills">
      <div class="seg-pill ${s.currency==='CRC'?'active':''}" data-c="CRC">₡ Colón (CRC)</div>
      <div class="seg-pill ${s.currency==='USD'?'active':''}" data-c="USD">$ Dólar (USD)</div></div></div>
    <div class="field"><label>Tasa de IVA (%)</label><input class="input" id="setIva" type="number" value="${s.ivaRate}" style="max-width:140px"></div>
    <button class="btn btn-primary" onclick="savePrefs()">Guardar preferencias</button>`;
  wrap.appendChild(pref);

  // data management
  const data = el('div','panel settings-section');
  data.innerHTML = `<div class="panel-head"><h3>Tus datos</h3></div>
    <p class="text-dim" style="font-size:13.5px;margin-bottom:16px">Todo se guarda en tu navegador. Exporta una copia de seguridad o impórtala en otro dispositivo.</p>
    <div class="flex gap-3" style="flex-wrap:wrap">
      <button class="btn btn-ghost" onclick="exportJSON()">${ic('download',16)} Exportar respaldo (JSON)</button>
      <button class="btn btn-ghost" onclick="exportCSV()">${ic('download',16)} Exportar movimientos (CSV)</button>
      <label class="btn btn-ghost" style="cursor:pointer">${ic('plus',16)} Importar respaldo<input type="file" accept=".json" style="display:none" onchange="importJSON(event)"></label>
    </div>`;
  wrap.appendChild(data);

  // account
  const acc = el('div','panel settings-section');
  acc.innerHTML = `<div class="panel-head"><h3>Cuenta</h3></div>
    <div class="user-chip" style="padding:0;margin-bottom:16px;pointer-events:none"><div class="avatar">${initials(u.name)}</div><div class="meta"><b>${u.name}</b><span>${u.email}</span></div></div>
    <button class="btn btn-ghost" onclick="doLogout()">${ic('logout',16)} Cerrar sesión</button>`;
  wrap.appendChild(acc);

  // danger
  const danger = el('div','panel settings-section danger-zone');
  danger.innerHTML = `<div class="panel-head"><h3 style="color:var(--neg)">Zona de riesgo</h3></div>
    <p class="text-dim" style="font-size:13.5px;margin-bottom:14px">Borra todos los movimientos, facturas y clientes de este negocio. No se puede deshacer.</p>
    <button class="btn btn-danger" onclick="confirmReset()">${ic('trash',16)} Borrar todos los datos</button>`;
  wrap.appendChild(danger);

  c.appendChild(wrap);

  document.getElementById('themePills').querySelectorAll('.seg-pill').forEach(p=>p.onclick=()=>{ applyTheme(p.dataset.t); Store.setSettings({theme:p.dataset.t}); route(); toast('Tema actualizado'); });
  document.getElementById('curPills').querySelectorAll('.seg-pill').forEach(p=>p.onclick=()=>{ Store.setSettings({currency:p.dataset.c}); route(); toast('Moneda actualizada'); });
}

/* ============================================================
   MODALS
   ============================================================ */
function modal(html, wide){
  const bd = el('div','modal-backdrop'); bd.id='__modal';
  bd.innerHTML = `<div class="modal ${wide?'modal-wide':''}">${html}</div>`;
  bd.onclick = e=>{ if(e.target===bd) bd.remove(); };
  document.body.appendChild(bd); return bd;
}
const closeModal = ()=> document.getElementById('__modal')?.remove();

function openTxModal(id){
  const d=Store.data(), s=d.settings;
  const t = id? d.transactions.find(x=>x.id===id) : null;
  const type = t?t.type:'income';
  modal(`<h3>${t?'Editar':'Nuevo'} movimiento</h3><p class="sub">Registra un ingreso o gasto de tu negocio.</p>
    <div class="seg-pills" style="margin-bottom:18px" id="txType">
      <div class="seg-pill ${type==='income'?'active':''}" data-v="income" style="flex:1;text-align:center">↑ Ingreso</div>
      <div class="seg-pill ${type==='expense'?'active':''}" data-v="expense" style="flex:1;text-align:center">↓ Gasto</div></div>
    <div class="field"><label>Descripción</label><input class="input" id="txDesc" value="${t?attr(t.description):''}" placeholder="Ej. Venta del día"></div>
    <div class="field-row">
      <div class="field"><label>Monto (${s.currency})</label><input class="input mono" id="txAmt" type="number" value="${t?t.amount:''}" placeholder="0"></div>
      <div class="field"><label>Fecha</label><input class="input" id="txDate" type="date" value="${t?t.date:new Date().toISOString().slice(0,10)}"></div>
    </div>
    <div class="field"><label>Categoría</label><select class="select" id="txCat"></select></div>
    <label class="flex items-center gap-2" style="font-size:14px;cursor:pointer;user-select:none"><input type="checkbox" id="txIva" ${t? (t.hasIVA?'checked':''):'checked'} style="width:18px;height:18px;accent-color:var(--accent)"> El monto incluye IVA (${s.ivaRate}%)</label>
    <div class="modal-foot"><button class="btn btn-ghost" onclick="closeModal()">Cancelar</button><button class="btn btn-primary" onclick="saveTx(${t?`'${id}'`:'null'})">${t?'Guardar':'Agregar'}</button></div>`);
  const fillCats = (tp)=>{ const sel=document.getElementById('txCat'); sel.innerHTML=CATS[tp].map(ct=>`<option ${t&&t.category===ct?'selected':''}>${ct}</option>`).join(''); };
  fillCats(type);
  document.getElementById('txType').querySelectorAll('.seg-pill').forEach(p=>p.onclick=()=>{
    document.getElementById('txType').querySelectorAll('.seg-pill').forEach(x=>x.classList.remove('active')); p.classList.add('active'); fillCats(p.dataset.v); });
}
function saveTx(id){
  const type = document.querySelector('#txType .active').dataset.v;
  const desc = document.getElementById('txDesc').value.trim();
  const amt = parseFloat(document.getElementById('txAmt').value);
  const date = document.getElementById('txDate').value;
  const cat = document.getElementById('txCat').value;
  const hasIVA = document.getElementById('txIva').checked;
  if(!desc || !amt || amt<=0 || !date){ toast('Completa descripción, monto y fecha','error'); return; }
  const rate = Store.data().settings.ivaRate/100;
  const ivaAmount = hasIVA ? Math.round(amt - amt/(1+rate)) : 0;
  const payload = { type, description:desc, amount:Math.round(amt), date, category:cat, hasIVA, ivaAmount, clientId: id?Store.data().transactions.find(t=>t.id===id)?.clientId:null };
  if(id) Store.updateTx(id,payload); else Store.addTx(payload);
  closeModal(); toast(id?'Movimiento actualizado':'Movimiento agregado'); refreshNav(); route();
}
function delTx(id){ confirmModal('¿Eliminar este movimiento?','Esta acción no se puede deshacer.',()=>{ Store.deleteTx(id); toast('Movimiento eliminado'); refreshNav(); route(); }); }

function openClientModal(id){
  const d=Store.data(); const cl = id? d.clients.find(x=>x.id===id):null;
  modal(`<h3>${cl?'Editar':'Nuevo'} cliente</h3><p class="sub">Datos de contacto de tu cliente.</p>
    <div class="field"><label>Nombre</label><input class="input" id="clName" value="${cl?attr(cl.name):''}" placeholder="Nombre del cliente"></div>
    <div class="field"><label>Empresa (opcional)</label><input class="input" id="clCompany" value="${cl?attr(cl.company):''}"></div>
    <div class="field-row"><div class="field"><label>Correo</label><input class="input" id="clEmail" value="${cl?attr(cl.email):''}"></div>
    <div class="field"><label>Teléfono</label><input class="input" id="clPhone" value="${cl?attr(cl.phone):''}"></div></div>
    <div class="modal-foot"><button class="btn btn-ghost" onclick="closeModal()">Cancelar</button><button class="btn btn-primary" onclick="saveClient(${cl?`'${id}'`:'null'})">${cl?'Guardar':'Agregar'}</button></div>`);
}
function saveClient(id){
  const name=document.getElementById('clName').value.trim();
  if(!name){ toast('El nombre es obligatorio','error'); return; }
  const payload={ name, company:document.getElementById('clCompany').value.trim(), email:document.getElementById('clEmail').value.trim(), phone:document.getElementById('clPhone').value.trim() };
  if(id) Store.updateClient(id,payload); else Store.addClient(payload);
  closeModal(); toast(id?'Cliente actualizado':'Cliente agregado'); refreshNav(); route();
}
function delClient(id){ confirmModal('¿Eliminar cliente?','Sus movimientos no se borran.',()=>{ Store.deleteClient(id); toast('Cliente eliminado'); refreshNav(); route(); }); }

let invItems=[];
function openInvoiceModal(id){
  const d=Store.data();
  const iv = id? d.invoices.find(x=>x.id===id):null;
  invItems = iv? JSON.parse(JSON.stringify(iv.items)) : [{desc:'',qty:1,price:0}];
  const nextNum = String(Math.max(0,...d.invoices.map(i=>parseInt(i.number)||0))+1).padStart(4,'0');
  modal(`<h3>${iv?'Editar':'Nueva'} factura</h3><p class="sub">Genera una factura para cobrar a tu cliente.</p>
    <div class="field-row"><div class="field"><label>N° de factura</label><input class="input mono" id="ivNum" value="${iv?iv.number:nextNum}"></div>
    <div class="field"><label>Cliente</label><select class="select" id="ivClient">${d.clients.length?d.clients.map(cl=>`<option value="${cl.id}" ${iv&&iv.clientId===cl.id?'selected':''}>${cl.name}</option>`).join(''):'<option value="">— Sin clientes —</option>'}</select></div></div>
    <div class="field-row"><div class="field"><label>Fecha de emisión</label><input class="input" id="ivDate" type="date" value="${iv?iv.date:new Date().toISOString().slice(0,10)}"></div>
    <div class="field"><label>Vencimiento</label><input class="input" id="ivDue" type="date" value="${iv?iv.dueDate:addDays(15)}"></div></div>
    <label style="font-size:13px;font-weight:600;color:var(--text-dim)">Detalle</label>
    <div class="inv-items" id="ivItems"></div>
    <button class="btn btn-subtle btn-sm" onclick="addInvItem()" style="margin-top:4px">${ic('plus',15)} Agregar línea</button>
    <div class="inv-totals" id="ivTotals"></div>
    <div class="modal-foot"><button class="btn btn-ghost" onclick="closeModal()">Cancelar</button><button class="btn btn-primary" onclick="saveInvoice(${iv?`'${id}'`:'null'})">${iv?'Guardar':'Crear factura'}</button></div>`, true);
  renderInvItems();
}
function renderInvItems(){
  const host=document.getElementById('ivItems');
  host.innerHTML = invItems.map((it,i)=>`<div class="inv-item">
    <input class="input" placeholder="Descripción" value="${attr(it.desc)}" oninput="updInv(${i},'desc',this.value)">
    <input class="input mono" type="number" placeholder="Cant" value="${it.qty}" oninput="updInv(${i},'qty',this.value)">
    <input class="input mono" type="number" placeholder="Precio" value="${it.price}" oninput="updInv(${i},'price',this.value)">
    <button class="rm" onclick="rmInvItem(${i})">${ic('trash',16)}</button></div>`).join('');
  const sub = invItems.reduce((s,it)=>s+(+it.qty||0)*(+it.price||0),0);
  const rate = Store.data().settings.ivaRate/100, cur=Store.data().settings.currency;
  const iva=Math.round(sub*rate);
  document.getElementById('ivTotals').innerHTML = `<div class="r"><span>Subtotal</span><span class="mono">${Fmt.money(sub,cur)}</span></div>
    <div class="r"><span>IVA (${Store.data().settings.ivaRate}%)</span><span class="mono">${Fmt.money(iva,cur)}</span></div>
    <div class="r grand"><span>Total</span><span class="mono">${Fmt.money(sub+iva,cur)}</span></div>`;
}
function updInv(i,k,v){ invItems[i][k]= k==='desc'?v:(parseFloat(v)||0); if(k!=='desc') renderInvItems(); }
function addInvItem(){ invItems.push({desc:'',qty:1,price:0}); renderInvItems(); }
function rmInvItem(i){ invItems.splice(i,1); if(!invItems.length) invItems.push({desc:'',qty:1,price:0}); renderInvItems(); }
function saveInvoice(id){
  const d=Store.data();
  const clientId=document.getElementById('ivClient').value;
  if(!clientId){ toast('Primero agrega un cliente','error'); return; }
  const items = invItems.filter(it=>it.desc && it.qty>0);
  if(!items.length){ toast('Agrega al menos una línea con descripción','error'); return; }
  const subtotal=items.reduce((s,it)=>s+it.qty*it.price,0);
  const rate=d.settings.ivaRate/100, iva=Math.round(subtotal*rate);
  const payload={ number:document.getElementById('ivNum').value, clientId, items,
    date:document.getElementById('ivDate').value, dueDate:document.getElementById('ivDue').value,
    status: id? d.invoices.find(x=>x.id===id).status : 'pending', ivaRate:d.settings.ivaRate, subtotal, iva, total:subtotal+iva };
  if(id) Store.updateInvoice(id,payload); else Store.addInvoice(payload);
  closeModal(); toast(id?'Factura actualizada':'Factura creada'); refreshNav(); route();
}
function markPaid(id){ Store.updateInvoice(id,{status:'paid'}); toast('Factura marcada como pagada'); route(); }
function delInvoice(id){ confirmModal('¿Eliminar factura?','Esta acción no se puede deshacer.',()=>{ Store.deleteInvoice(id); toast('Factura eliminada'); refreshNav(); route(); }); }

function printInvoice(id){
  const d=Store.data(), iv=d.invoices.find(x=>x.id===id), cl=d.clients.find(x=>x.id===iv.clientId), s=d.settings, cur=s.currency;
  const w=window.open('','_blank');
  w.document.write(`<html><head><title>Factura #${iv.number}</title><style>
    *{font-family:-apple-system,Segoe UI,sans-serif;box-sizing:border-box}body{padding:48px;color:#0c1016;max-width:760px;margin:0 auto}
    .h{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px}
    .h h1{font-size:32px;margin:0;letter-spacing:-1px}.muted{color:#666;font-size:13px;line-height:1.6}
    .badge{background:#2DE0A6;color:#03110c;padding:6px 14px;border-radius:8px;font-weight:700;font-size:13px}
    table{width:100%;border-collapse:collapse;margin:30px 0}th{text-align:left;font-size:11px;text-transform:uppercase;color:#999;border-bottom:2px solid #eee;padding:10px}
    td{padding:12px 10px;border-bottom:1px solid #f0f0f0;font-size:14px}.r{text-align:right}
    .totals{margin-left:auto;width:280px}.totals .row{display:flex;justify-content:space-between;padding:7px 0;font-size:14px}
    .totals .grand{font-weight:700;font-size:19px;border-top:2px solid #0c1016;margin-top:6px;padding-top:12px}
    </style></head><body>
    <div class="h"><div><h1>${s.businessName}</h1><div class="muted">${s.cedula?'Céd. '+s.cedula+'<br>':''}${s.phone||''}<br>${s.address||''}</div></div>
    <div style="text-align:right"><div class="badge">FACTURA</div><div class="muted" style="margin-top:10px">N° ${iv.number}<br>Emitida: ${Fmt.date(iv.date)}<br>Vence: ${Fmt.date(iv.dueDate)}</div></div></div>
    <div class="muted"><b style="color:#0c1016;font-size:15px">Facturar a:</b><br>${cl?cl.name:''}<br>${cl&&cl.company?cl.company+'<br>':''}${cl&&cl.email?cl.email:''}</div>
    <table><thead><tr><th>Descripción</th><th class="r">Cant.</th><th class="r">Precio</th><th class="r">Importe</th></tr></thead><tbody>
    ${iv.items.map(it=>`<tr><td>${it.desc}</td><td class="r">${it.qty}</td><td class="r">${Fmt.money(it.price,cur)}</td><td class="r">${Fmt.money(it.qty*it.price,cur)}</td></tr>`).join('')}</tbody></table>
    <div class="totals"><div class="row"><span>Subtotal</span><span>${Fmt.money(iv.subtotal,cur)}</span></div>
    <div class="row"><span>IVA (${iv.ivaRate}%)</span><span>${Fmt.money(iv.iva,cur)}</span></div>
    <div class="row grand"><span>Total</span><span>${Fmt.money(iv.total,cur)}</span></div></div>
    <p class="muted" style="margin-top:48px;text-align:center">Gracias por su preferencia · Generado con Caudal</p>
    <script>window.onload=()=>window.print()<\/script></body></html>`);
  w.document.close();
}

/* ============================================================
   SETTINGS ACTIONS
   ============================================================ */
function saveBiz(){ Store.setSettings({ businessName:val('setBiz'), cedula:val('setCedula'), phone:val('setPhone'), address:val('setAddr') });
  Store.updateUser({ businessName: val('setBiz') }); toast('Negocio actualizado'); refreshNav(); }
function savePrefs(){ const iva=parseFloat(val('setIva')); Store.setSettings({ ivaRate: isNaN(iva)?13:iva }); toast('Preferencias guardadas'); route(); }
function exportJSON(){ download('caudal-respaldo.json', Store.exportJSON(), 'application/json'); toast('Respaldo exportado'); }
function exportCSV(){
  const d=Store.data();
  const rows=[['Fecha','Tipo','Descripción','Categoría','Monto','IVA']].concat(
    d.transactions.map(t=>[t.date, t.type==='income'?'Ingreso':'Gasto', `"${t.description}"`, t.category, t.amount, t.ivaAmount||0]));
  download('caudal-movimientos.csv', rows.map(r=>r.join(',')).join('\n'), 'text/csv'); toast('CSV exportado');
}
function importJSON(e){
  const file=e.target.files[0]; if(!file) return;
  const r=new FileReader(); r.onload=()=>{ try{ Store.importJSON(r.result); toast('Datos importados'); refreshNav(); route(); }catch(err){ toast('Archivo no válido','error'); } }; r.readAsText(file);
}
function confirmReset(){ confirmModal('¿Borrar todos los datos?','Se eliminarán todos los movimientos, facturas y clientes de este negocio. No se puede deshacer.',()=>{ Store.resetData(); toast('Datos borrados'); refreshNav(); location.hash='dashboard'; route(); }, true); }
function doLogout(){ Store.logout(); location.href='index.html'; }

/* ============================================================
   helpers / shell
   ============================================================ */
function el(tag,cls){ const e=document.createElement(tag); if(cls) e.className=cls; return e; }
function getCss(v){ return getComputedStyle(document.documentElement).getPropertyValue(v.replace('var(','').replace(')','')).trim(); }
function initials(n){ return n.split(' ').filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase(); }
function attr(s){ return (s||'').replace(/"/g,'&quot;'); }
function val(id){ return document.getElementById(id).value.trim(); }
function addDays(n){ const d=new Date(); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }
function download(name,content,type){ const b=new Blob([content],{type}); const u=URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download=name; a.click(); URL.revokeObjectURL(u); }
function emptyState(title,desc,btn,fn){ const e=el('div','empty card');
  e.innerHTML=`<div class="ico">${ic('tx',24)}</div><h4>${title}</h4><p>${desc}</p>`;
  const b=el('button','btn btn-primary'); b.innerHTML=`${ic('plus',16)} ${btn}`; b.onclick=fn; e.appendChild(b); return e; }
function confirmModal(title,desc,onYes,danger){
  const bd=modal(`<h3>${title}</h3><p class="sub">${desc}</p><div class="modal-foot"><button class="btn btn-ghost" onclick="closeModal()">Cancelar</button><button class="btn ${danger?'btn-danger':'btn-primary'}" id="__yes">Confirmar</button></div>`);
  bd.querySelector('#__yes').onclick=()=>{ closeModal(); onYes(); };
}
function refreshNav(){
  const d=Store.data();
  setCount('movimientos', d.transactions.length);
  setCount('facturas', d.invoices.filter(i=>i.status!=='paid').length);
  setCount('clientes', d.clients.length);
}
function setCount(route,n){ const item=document.querySelector(`.nav-item[data-route="${route}"] .count`); if(item) item.textContent = n||''; }

/* sidebar mobile */
function toggleSidebar(){ document.querySelector('.sidebar').classList.toggle('open'); document.querySelector('.backdrop-m').classList.toggle('show'); }
function closeSidebar(){ document.querySelector('.sidebar')?.classList.remove('open'); document.querySelector('.backdrop-m')?.classList.remove('show'); }

window.addEventListener('resize', ()=>{ clearTimeout(window._rz); window._rz=setTimeout(()=>{ if(window._redraw)window._redraw(); }, 220); });

/* ============================================================
   BOOT
   ============================================================ */
function boot(){
  const u=Store.currentUser(), d=Store.data();
  // build sidebar
  const nav=[
    ['dashboard','Resumen','dash'],['movimientos','Movimientos','tx'],['facturas','Facturas','invoice'],
    ['clientes','Clientes','clients'],['reportes','Reportes','reports'],['ajustes','Ajustes','settings']
  ];
  document.getElementById('navList').innerHTML = nav.map(([r,label,icon])=>
    `<a href="#${r}" class="nav-item" data-route="${r}">${ic(icon)}<span>${label}</span>${['movimientos','facturas','clientes'].includes(r)?'<span class="count"></span>':''}</a>`).join('');
  document.getElementById('sideBiz').textContent = d.settings.businessName;
  document.getElementById('sideUser').innerHTML = `<div class="avatar">${initials(u.name)}</div><div class="meta"><b>${u.name}</b><span>${u.email}</span></div>`;
  refreshNav();
  route();
}
boot();
