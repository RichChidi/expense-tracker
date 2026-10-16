import {renderChart, renderCategoriesChart} from "./chart.js";

const STORAGE_KEY = 'transactions';
let transactions = normalizeTransactions(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
let totalBalance = 0;
let totalIncome = 0;
let totalExpenses = 0;
let monthlyIncome = 0;
let monthlyExpenses = 0;
let editingTransactionId = null;
let showAllTransactions = false;

const formElement = document.getElementById('add-transaction-form');
const descElement = document.getElementById('desc');
const amountElement = document.getElementById('amount');
const typeElement = document.getElementById('type');
const categoryElement = document.getElementById('category');
const saveButtonElement = document.getElementById('save-btn');
const addTransactionElement = document.getElementById('add-transaction-btn');

function normalizeTransactions(items) {
  return items.map((transaction, index) => ({
    id: transaction.id || `txn-${Date.now()}-${index}`,
    description: String(transaction.description || '').trim(),
    amount: Number(transaction.amount) || 0,
    type: transaction.type || 'expense',
    category: transaction.category || 'Food',
    date: transaction.date || new Date().toISOString()
  }));
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function resetForm() {
  editingTransactionId = null;
  descElement.value = '';
  amountElement.value = '';
  typeElement.value = '';
  categoryElement.value = '';
  categoryElement.hidden = false;
  saveButtonElement.textContent = 'Save';
  formElement.classList.remove('open');
}

function openForm(transaction = null) {
  if (transaction) {
    editingTransactionId = transaction.id;
    descElement.value = transaction.description;
    amountElement.value = transaction.amount;
    typeElement.value = transaction.type;
    if (transaction.type === 'income') {
      categoryElement.value = 'Income';
      categoryElement.hidden = true;
    } else {
      categoryElement.value = transaction.category;
      categoryElement.hidden = false;
    }
    saveButtonElement.textContent = 'Update';
  } else {
    resetForm();
  }

  formElement.classList.add('open');
  descElement.focus();
}

function isValidTransactionPayload(transaction) {
  if (!transaction.description || Number(transaction.amount) <= 0 || !transaction.type) {
    return false;
  }

  if (transaction.type === 'expense' && (!transaction.category || transaction.category === 'Income')) {
    return false;
  }

  return true;
}

function addToTransactions() {
  const newTransaction = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `txn-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    description: descElement.value.trim(),
    amount: Number(amountElement.value),
    type: typeElement.value,
    category: typeElement.value === 'income' ? 'Income' : categoryElement.value,
    date: new Date().toISOString()
  };

  transactions.unshift(newTransaction);
  saveToStorage();
}

function updateTransaction() {
  const transactionIndex = transactions.findIndex((transaction) => transaction.id === editingTransactionId);

  if (transactionIndex === -1) {
    return;
  }

  transactions[transactionIndex] = {
    ...transactions[transactionIndex],
    description: descElement.value.trim(),
    amount: Number(amountElement.value),
    type: typeElement.value,
    category: typeElement.value === 'income' ? 'Income' : categoryElement.value
  };

  saveToStorage();
}

function calculateTotalIncome() {
  totalIncome = 0;
  transactions.forEach((transaction) => {
    if (transaction.type === 'income') {
      totalIncome += Number(transaction.amount) || 0;
    }
  });
}

function calculateTotalExpenses() {
  totalExpenses = 0;
  transactions.forEach((transaction) => {
    if (transaction.type === 'expense') {
      totalExpenses += Number(transaction.amount) || 0;
    }
  });
}

function calculateMonthlyTotals() {
  const now = new Date();
  monthlyIncome = 0;
  monthlyExpenses = 0;

  transactions.forEach((transaction) => {
    const transactionDate = new Date(transaction.date);
    if (
      transactionDate.getFullYear() !== now.getFullYear() ||
      transactionDate.getMonth() !== now.getMonth()
    ) {
      return;
    }

    if (transaction.type === 'income') {
      monthlyIncome += Number(transaction.amount) || 0;
    } else if (transaction.type === 'expense') {
      monthlyExpenses += Number(transaction.amount) || 0;
    }
  });
}

function calculateTotalBalance() {
  totalBalance = totalIncome - totalExpenses;
}

function renderPage() {
  calculateTotalIncome();
  calculateTotalExpenses();
  calculateMonthlyTotals();
  calculateTotalBalance();

  let expenseTrackerHTML = `
    <header class="total-balance-div">
      <p class="total-balance-view">Total Balance 
      <button id="hide" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye preview-icon"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
      </button>
      </p>
      <h1 class="total-balance js-total-balance">$${totalBalance}</h1>
    </header>
    <div class="income-and-expenses">
      <section class="total-income-div">
        <p>Income</p>
        <h2 class="total-income">$${monthlyIncome}</h2>
        <p>This month</p>
      </section>
      <section class="total-expenses-div">
        <p>Expenses</p>
        <h2 class="total-expenses">$${monthlyExpenses}</h2>
        <p>This month</p>
      </section>
    </div>
    <div class="expense-chart-div">
      <section class="expense-chart-heading">
        <h5>Filter and View Chart</h5>
        <h6>
          <select class="chart-filter">
            <option value="expenses-by-category">Expenses by category</option>
            <option value="income-vs-expenses">Income vs Expenses</option>
          </select>
        </h6>
      </section>
      <section class="chart-container">
        <canvas id="my-chart"></canvas>
      </section>
    </div>
    <div class="recent-transactions">
      <section class="recent-transactions-heading">
        <h5>Recent Transactions</h5>
        ${
          transactions.length > 5
            ? `<button class="see-all-transactions" type="button" aria-expanded="${showAllTransactions}">${showAllTransactions ? 'Show recent' : 'See all'}</button>`
            : ''
        }
      </section>
      <section class="recent-transactions-list">
        ${
          transactions.length === 0 ? `<p>No transaction added</p>` : renderTransactionList()
        }
      </section>
    </div>
  `;

  document.querySelector('.expense-tracker-dashboard').innerHTML = expenseTrackerHTML;

  const filterEl = document.querySelector('.chart-filter');
  if (filterEl) {
    if (filterEl.value === 'income-vs-expenses') {
      renderChart(transactions);
    } else if (filterEl.value === 'expenses-by-category') {
      renderCategoriesChart(transactions);
    }

    filterEl.addEventListener('change', () => {
      if (filterEl.value === 'income-vs-expenses') {
        renderChart(transactions);
      } else if (filterEl.value === 'expenses-by-category') {
        renderCategoriesChart(transactions);
      }
    });
  }

  bindTransactionActions();
  bindTransactionListToggle();
  bindBalanceToggle();
}

function renderTransactionList() {
  let transactionHTML = '';
  const visibleTransactions = showAllTransactions ? transactions : transactions.slice(0, 5);

  visibleTransactions.forEach((transaction) => {
    const date = new Date(transaction.date);
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const today = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const yesterdayObj = new Date();
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterday = yesterdayObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    transactionHTML += `
      <div class="recent-transaction" data-id="${transaction.id}">
        <span class="transaction-icon" style="background: ${getCategoryColor(transaction.category)}; color: white;">
          ${
            transaction.category === 'Food' ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-salad preview-icon"><path d="M7 21h10"/><path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z"/><path d="M11.38 12a2.4 2.4 0 0 1-.4-4.77 2.4 2.4 0 0 1 3.2-2.77 2.4 2.4 0 0 1 3.47-.63 2.4 2.4 0 0 1 3.37 3.37 2.4 2.4 0 0 1-1.1 3.7 2.51 2.51 0 0 1 .03 1.1"/><path d="m13 12 4-4"/><path d="M10.9 7.25A3.99 3.99 0 0 0 4 10c0 .73.2 1.41.54 2"/></svg>`
            : transaction.category === 'Transport' ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-car-front preview-icon"><path d="m21 8-2 2-1.5-3.7A2 2 0 0 0 15.646 5H8.4a2 2 0 0 0-1.903 1.257L5 10 3 8"/><path d="M7 14h.01"/><path d="M17 14h.01"/><rect width="18" height="8" x="3" y="10" rx="2"/><path d="M5 18v2"/><path d="M19 18v2"/></svg>`
            : transaction.category === 'Shopping' ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shopping-cart-plus preview-icon"><path d="M16 5h6"/><path d="M19 2v6"/><path d="m2.05 2.05 1.099-.028a1 1 0 011.008.815l2.69 14.347A1 1 0 007.83 18H18"/><path d="M4.564 5H12"/><path d="M6.25 14h12.712a2 2 0 001.991-1.57l.172-1.041"/><circle cx="18" cy="20" r="2"/><circle cx="8" cy="20" r="2"/></svg>`
            : transaction.category === 'Bills' ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-receipt-text preview-icon"><path d="M13 16H8"/><path d="M14 8H8"/><path d="M16 12H8"/><path d="M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z"/></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-credit-card preview-icon"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/><path d="M6 14h2"/></svg>`
          }
        </span>
        <section class="transaction-desc-div">
          <span class="transaction-desc">${transaction.description}</span>
          <p>
            <span class="transaction-category">${transaction.category} &#183;</span>
            <span>${
              formattedDate === today ? `Today &#183; ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : formattedDate === yesterday ? `Yesterday &#183; ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : `${formattedDate} &#183; ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            }</span>
          </p>
        </section>
        <section class="transaction-amount-div js-transaction-amount-div">
          <span class="transaction-amount">$${transaction.amount}</span>
          <span class="more" data-id="${transaction.id}" title="More options">&#8943;</span>
          <span class="edit-delete-div">
            <button class="edit-button" data-id="${transaction.id}" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-pen preview-icon"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>
              Edit
            </button>
            <button class="del-button" data-id="${transaction.id}" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash preview-icon"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              Delete
            </button>
            <button class="cancel-button" data-id="${transaction.id}" type="button" aria-label="Cancel"> 
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x preview-icon"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </span>
        </section>
      </div>
    `;
  });

  return transactionHTML;
}

function bindTransactionListToggle() {
  const toggleButton = document.querySelector('.see-all-transactions');
  if (!toggleButton) {
    return;
  }

  toggleButton.addEventListener('click', () => {
    showAllTransactions = !showAllTransactions;
    renderPage();
  });
}

function getCategoryColor(category) {
  const colors = {
    Food: 'rgb(168, 106, 71)',
    Transport: 'rgb(251, 146, 43)',
    Shopping: 'rgb(132, 88, 232)',
    Bills: 'rgb(71, 85, 105)',
    Income: 'rgb(52, 168, 83)'
  };

  return colors[category] || 'rgb(100, 100, 100)';
}

function bindTransactionActions() {
  document.querySelectorAll('.more').forEach((element) => {
    element.addEventListener('click', () => {
      const targetDiv = element.closest('.js-transaction-amount-div');
      if (!targetDiv) return;

      targetDiv.querySelector('.transaction-amount').style.display = 'none';
      element.style.display = 'none';
      targetDiv.querySelector('.edit-delete-div').style.display = 'flex';
    });
  });

  document.querySelectorAll('.cancel-button').forEach((element) => {
    element.addEventListener('click', () => {
      const targetDiv = element.closest('.js-transaction-amount-div');
      if (!targetDiv) return;

      targetDiv.querySelector('.transaction-amount').style.display = 'inline';
      targetDiv.querySelector('.more').style.display = 'inline';
      targetDiv.querySelector('.edit-delete-div').style.display = 'none';
    });
  });

  document.querySelectorAll('.edit-button').forEach((element) => {
    element.addEventListener('click', () => {
      const transactionId = element.dataset.id;
      const transaction = transactions.find((item) => item.id === transactionId);
      if (transaction) {
        openForm(transaction);
      }
    });
  });

  document.querySelectorAll('.del-button').forEach((element) => {
    element.addEventListener('click', () => {
      const transactionId = element.dataset.id;
      transactions = transactions.filter((transaction) => transaction.id !== transactionId);
      saveToStorage();
      renderPage();
    });
  });
}

function bindBalanceToggle() {
  const balanceView = document.getElementById('hide');
  const balanceEl = document.querySelector('.js-total-balance');

  if (!balanceView || !balanceEl) {
    return;
  }

  let isHidden = false;

  balanceView.addEventListener('click', () => {
    if (isHidden === false) {
      balanceEl.innerHTML = '$*****';
      balanceView.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-off preview-icon"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>`;
      isHidden = true;
      return;
    }

    balanceEl.innerHTML = `$${totalBalance}`;
    balanceView.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye preview-icon"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>`;
    isHidden = false;
  });
}

saveButtonElement.addEventListener('click', () => {
  const payload = {
    description: descElement.value.trim(),
    amount: Number(amountElement.value),
    type: typeElement.value,
    category: typeElement.value === 'income' ? 'Income' : categoryElement.value
  };

  if (!isValidTransactionPayload(payload)) {
    alert('Please fill in all required fields with a valid amount.');
    return;
  }

  if (editingTransactionId) {
    updateTransaction();
  } else {
    addToTransactions();
  }

  resetForm();
  renderPage();
});

addTransactionElement.addEventListener('click', () => {
  openForm();
});

typeElement.addEventListener('change', () => {
  if (typeElement.value === 'income') {
    categoryElement.value = 'Income';
    categoryElement.hidden = true;
  } else {
    categoryElement.hidden = false;
    categoryElement.value = '';
  }
});

renderPage();
