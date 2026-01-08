/* =====================================================
   GLOBAL DATA & STATE
===================================================== */

let DATA = null;

const state = {
  lang: "UZ",          // EN | UZ | RU
  currency: "USD",     // USD | UZS | RUB
  billionaire: null,

  balanceUSD: 0,
  spentUSD: 0,

  cart: {},            // { itemId: qty }
  pending: {}          // { itemId: qty }
};

/* =====================================================
   INIT
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  fetch("data.json")
    .then(r => r.json())
    .then(json => {
      DATA = json;
      initUI();
    });
});

/* =====================================================
   UI INIT
===================================================== */

function initUI() {
  initSelectors();
  initBillionaires();
  renderTitle();
  renderBalance();
  renderItems();
  renderCart();
}

/* =====================================================
   SELECTORS (LANG & CURRENCY)
===================================================== */

function initSelectors() {
  const langSel = document.getElementById("langSelect");
  const curSel  = document.getElementById("currencySelect");

  if (langSel) {
    langSel.value = state.lang;
    langSel.onchange = e => {
      state.lang = e.target.value;
      renderTitle();
    };
  }

  if (curSel) {
    curSel.value = state.currency;
    curSel.onchange = e => {
      state.currency = e.target.value;
      renderBalance();
      renderItems();
    };
  }
}

/* =====================================================
   TITLES (MULTI-LANG)
===================================================== */

function renderTitle() {
  if (!DATA) return;

  const titleMap = {
    EN: "Billionaire Project",
    UZ: "Milliarderlar loyihasi",
    RU: "Проект миллиардеров"
  };

  document.title = titleMap[state.lang];

  const h1 = document.getElementById("pageTitle");
  if (h1) h1.innerText = titleMap[state.lang];
}

/* =====================================================
   BILLIONAIRE SELECT
===================================================== */

function initBillionaires() {
  document.querySelectorAll(".select").forEach(card => {
    card.onclick = () => {
      const id = card.dataset.person;
      const person = DATA.billionaires.find(b => b.id === id);

      state.billionaire = person;
      state.balanceUSD  = person.money;
      state.spentUSD    = 0;
      state.cart        = {};
      state.pending     = {};

      renderBalance();
      renderItems();
      renderCart();
    };
  });
}

/* =====================================================
   BALANCE
===================================================== */

function renderBalance() {
  const nameEl = document.getElementById("name");
  const balEl  = document.getElementById("balance");

  if (!state.billionaire) {
    if (nameEl) nameEl.innerText = "—";
    if (balEl)  balEl.innerText  = "$0";
    return;
  }

  nameEl.innerText = state.billionaire.name;
  balEl.innerText  = formatMoney(state.balanceUSD);
}

/* =====================================================
   STORE ITEMS
===================================================== */

function renderItems() {
  const box = document.getElementById("actions");
  if (!box || !DATA) return;

  box.innerHTML = "";

  DATA.items.forEach(item => {
    if (!state.pending[item.id]) state.pending[item.id] = 1;

    const div = document.createElement("div");
    div.className = "store-item";

    div.innerHTML = `
      <h4>${item.title}</h4>
      <div class="price">${formatMoney(item.price)}</div>

      <div class="qty">
        <button onclick="changeQty('${item.id}', -1)">-</button>
        <span id="qty_${item.id}">${state.pending[item.id]}</span>
        <button onclick="changeQty('${item.id}', 1)">+</button>
      </div>

      <button class="buy" onclick="buyItem('${item.id}')">
        🟢 Xarid qilish
      </button>
    `;

    box.appendChild(div);
  });
}

/* =====================================================
   QUANTITY CONTROL
===================================================== */

function changeQty(id, delta) {
  state.pending[id] = Math.max(1, state.pending[id] + delta);
  const el = document.getElementById("qty_" + id);
  if (el) el.innerText = state.pending[id];
}

/* =====================================================
   BUY ITEM
===================================================== */

function buyItem(id) {
  if (!state.billionaire) return;

  const item = DATA.items.find(i => i.id === id);
  const qty  = state.pending[id];
  const cost = item.price * qty;

  if (state.balanceUSD < cost) {
    alert("Not enough money 😄");
    return;
  }

  state.balanceUSD -= cost;
  state.spentUSD   += cost;
  state.cart[id]   = (state.cart[id] || 0) + qty;
  state.pending[id] = 1;

  renderBalance();
  renderItems();
  renderCart();

  startPrankFlow();
}

/* =====================================================
   CART
===================================================== */

function renderCart() {
  const box = document.getElementById("cart");
  const totalEl = document.getElementById("cartTotal");

  if (!box) return;

  box.innerHTML = "";

  Object.keys(state.cart).forEach(id => {
    const item = DATA.items.find(i => i.id === id);
    box.innerHTML += `<div>${item.title} × ${state.cart[id]}</div>`;
  });

  if (totalEl) {
    totalEl.innerText = formatMoney(state.spentUSD);
  }
}

/* =====================================================
   MONEY FORMAT (DISPLAY ONLY)
===================================================== */

function formatMoney(usd) {
  if (!DATA) return "$0";

  const rates = DATA.rates;
  const rate  = rates[state.currency] || 1;
  const val   = usd * rate;

  return new Intl.NumberFormat().format(val) + " " + state.currency;
}

/* =====================================================
   PRANK FLOW (ERROR 8007)
===================================================== */

const overlay        = document.getElementById("simOverlay");
const stepProcessing = document.getElementById("stepProcessing");
const stepError      = document.getElementById("stepError");
const stepPrank      = document.getElementById("stepPrank");
const backBtn        = document.getElementById("backBtn");

function startPrankFlow() {
  if (!overlay) return;

  overlay.classList.remove("hidden");
  showStep(stepProcessing);

  setTimeout(() => showStep(stepError), 1500);
  setTimeout(() => showStep(stepPrank), 3500);
}

if (backBtn) {
  backBtn.onclick = () => {
    overlay.classList.add("hidden");
    showStep(stepProcessing);
  };
}

function showStep(step) {
  [stepProcessing, stepError, stepPrank].forEach(s => {
    if (s) s.classList.add("hidden");
  });
  if (step) step.classList.remove("hidden");
}
