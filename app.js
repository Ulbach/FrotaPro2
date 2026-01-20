
<script>
// ======================= CONFIG API =======================
const API_URL = 'https://script.google.com/macros/s/AKfycbwE8F061OhUN5lTom2nZ0W_Vm5LX2wAWhPE4rtd6umbaxcIdmjaAzEtlf-wOHVpgDl-4g/exec';

// ======================= HTTP HELPERS ======================
async function apiGet(route, params = {}) {
  const usp = new URLSearchParams({ route, t: Date.now(), ...params });
  const url = `${API_URL}?${usp.toString()}`;
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`GET ${res.status}: ${txt || url}`);
  }
  return res.json();
}

async function apiPost(route, data = {}, params = {}) {
  const usp = new URLSearchParams({ route, t: Date.now(), ...params });
  const url = `${API_URL}?${usp.toString()}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // evita preflight CORS
    body: JSON.stringify(data || {})
  });
  const txt = await res.text().catch(() => '');
  let json = {};
  try { json = JSON.parse(txt); } catch (e) {}
  if (!res.ok || json?.ok === false) {
    throw new Error(`POST ${res.status}: ${json?.error || txt || url}`);
  }
  return json;
}

// ======================= UI UTILS =========================
function fmt(v) { return (v ?? '').toString().trim(); }

function setMsg(el, text = '', ok = true) {
  el.textContent = text;
  el.className = ok ? 'msg ok' : 'msg err';
}

// Preenche <select> com lista de valores
function fillSelect(selectEl, list = [], placeholder = 'Selecione...') {
  selectEl.innerHTML = '';
  const opt0 = document.createElement('option');
  opt0.value = ''; opt0.textContent = placeholder;
  selectEl.appendChild(opt0);
  list.forEach((v) => {
    const o = document.createElement('option');
    o.value = v; o.textContent = v;
    selectEl.appendChild(o);
  });
}
</script>
``
