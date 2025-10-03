// --- Elements
const expressionEl = document.getElementById('expression');
const resultEl = document.getElementById('result');
const keys = document.querySelectorAll('.keys .btn');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistory');
const toggleThemeBtn = document.getElementById('toggleTheme');

let expr = '';           // current expression string
let lastResult = null;   // last computed number
let history = [];        // keep last 10 entries

// --- Utilities: sanitize input before evaluation
function sanitize(input) {
  // allow only digits, operators, parentheses, dot, percent and spaces
  const allowed = /^[0-9+\-*/().% ]*$/;
  if (!allowed.test(input)) return null;
  return input.replace(/×/g,'*').replace(/÷/g,'/');
}

// --- Evaluate safely
function safeEval(input) {
  const s = sanitize(input);
  if (s === null) throw new Error('Invalid characters');
  // convert percent: "50%" -> "(50/100)"
  const replaced = s.replace(/(\d+(\.\d+)?)%/g, '($1/100)');
  // prevent code injection by only constructing Function with sanitized
  // final expression must match allowed characters as well
  if (!/^[0-9+\-*/().\s]*$/.test(replaced)) throw new Error('Unsafe expression');
  // eslint-disable-next-line no-new-func
  return Function('"use strict";return (' + replaced + ')')();
}

// --- UI update
function render() {
  expressionEl.textContent = expr || '0';
  resultEl.textContent = lastResult === null ? '0' : String(lastResult);
}

// --- History management
function pushHistory(entry) {
  history.unshift(entry);
  if (history.length > 10) history.pop();
  renderHistory();
}
function renderHistory() {
  historyList.innerHTML = '';
  history.forEach((h, i) => {
    const li = document.createElement('li');
    li.className = 'history-item';
    li.innerHTML = `<span>${h.expr}</span><strong>${h.result}</strong>`;
    li.addEventListener('click', () => {
      // clicking a history item loads it back
      expr = h.expr;
      lastResult = h.result;
      render();
    });
    historyList.appendChild(li);
  });
}

// --- Key handling (buttons)
keys.forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    const val = btn.dataset.value || btn.textContent;

    if (action === 'clear') {
      expr = '';
      lastResult = null;
      render();
      return;
    }
    if (action === 'back') {
      expr = expr.slice(0, -1);
      render();
      return;
    }
    if (action === 'percent') {
      // append % to last number
      expr += '%';
      render();
      return;
    }
    if (action === 'equals') {
      try {
        const res = safeEval(expr || '0');
        lastResult = Number.isFinite(res) ? Number(res.toFixed(12)) : res;
        pushHistory({expr: expr || '0', result: lastResult});
        expr = String(lastResult);
        render();
      } catch (err) {
        lastResult = 'Error';
        render();
        setTimeout(()=>{ lastResult = null; render(); }, 1200);
      }
      return;
    }
    // parentheses button has action "("
    if (action === '(') {
      expr += '(';
      render();
      return;
    }
    // normal numbers / operators
    // normalize × ÷ (in case)
    const normalized = val.replace('×','*').replace('÷','/');
    expr += normalized;
    render();
  });
});

// --- Keyboard input
window.addEventListener('keydown', (e) => {
  const key = e.key;
  // digits
  if (/^[0-9]$/.test(key)) { expr += key; render(); return; }
  if (key === '.') { expr += '.'; render(); return; }
  if (key === '+') { expr += '+'; render(); return; }
  if (key === '-') { expr += '-'; render(); return; }
  if (key === '*') { expr += '*'; render(); return; }
  if (key === '/') { expr += '/'; render(); return; }
  if (key === '%') { expr += '%'; render(); return; }
  if (key === '(') { expr += '('; render(); return; }
  if (key === ')') { expr += ')'; render(); return; }

  if (key === 'Backspace') { expr = expr.slice(0,-1); render(); return; }
  if (key === 'Escape') { expr = ''; lastResult = null; render(); return; }
  if (key === 'Enter' || key === '=') {
    try {
      const res = safeEval(expr || '0');
      lastResult = Number.isFinite(res) ? Number(res.toFixed(12)) : res;
      pushHistory({expr: expr || '0', result: lastResult});
      expr = String(lastResult);
      render();
    } catch (err) {
      lastResult = 'Error';
      render();
      setTimeout(()=>{ lastResult = null; render(); }, 1200);
    }
    return;
  }
});

// --- Clear history
clearHistoryBtn.addEventListener('click', () => {
  history = [];
  renderHistory();
});

// --- Theme toggle (Night / Day)
toggleThemeBtn.addEventListener('click', () => {
  document.body.classList.toggle('light-theme');
  toggleThemeBtn.textContent = document.body.classList.contains('light-theme') ? '☀️' : '🌙';
});


// --- init
render();
renderHistory();
