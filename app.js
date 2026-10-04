let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
function saveToStorage() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}
let totalBalance = 0;
let totalIncome = 0;
let totalExpenses = 0;

const descElement = document.getElementById('desc');
const amountElement = document.getElementById('amount');
const typeElement = document.getElementById('type');
const categoryElement = document.getElementById('category');
const saveButtonElement = document.getElementById('save-btn');
const addTransactionElement = document.getElementById('add-transaction-btn');

function addToTransactions(date) {
  transactions.unshift({
    description: descElement.value,
    amount: Number(amountElement.value),
    type: typeElement.value,
    category: categoryElement.value,
    date: date
  });
  saveToStorage();
}
function calculateTotalIncome() {
  totalIncome = 0;
  transactions.forEach((transaction) => {
   if (transaction.type === 'income') {
    totalIncome += transaction.amount;
   }
  });
}
function calculateTotalExpenses() {
  totalExpenses = 0;
  transactions.forEach(transaction => {
    if (transaction.type === 'expense') {
      totalExpenses += transaction.amount;
    }
  });
}
function calculateTotalBalance() {
  totalBalance = totalIncome - totalExpenses;
}

function renderPage() {
  calculateTotalIncome();
  calculateTotalExpenses();
  calculateTotalBalance();
  let expenseTrackerHTML = `
    <header class="total-balance-div">
      <p class="total-balance-view">Total Balance <button class="hide"><img></button></p>
      <h1 class="total-balance">$${totalBalance}</h1>
    </header>
    <div class="income-and-expenses">
      <section class="total-income-div">
        <p><img href="">Income</p>
        <h2 class="total-income">$${totalIncome}</h2>
        <p>This month</p>
      </section>
      <section class="total-expenses-div">
        <p><img>Expenses</p>
        <h2 class="total-expenses">$${totalExpenses}</h2>
        <p>This month</p>
      </section>
    </div>
    <div class="expense-chart">
      <section class="expense-chart-heading">
        <h5>
          Expenses by Category
        </h5>
        <h6>
          See all
        </h6>
      </section>

    </div>
    <div class="recent-transactions">
      <section class="recent-transactions-heading">
        <h5>Recent Transactions</h5>
        <h6>See all</h6>
      </section>
      <section>
        ${
          transactions.length === 0? `<p>No transaction added</p>`
          : renderTransactionList()
        }
      </section>
    </div>    
  `;

  document.querySelector('.expense-tracker-dashboard').innerHTML = expenseTrackerHTML;
}

function renderTransactionList() {
 let transactionHTML = ''; 
 transactions.forEach(transaction => {
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
  })

  transactionHTML += `
      <img>
      <section>
          <span>${transaction.description}</span>
        <p>
          <span>${transaction.category} &#183;</span>
          <span>${
            formattedDate === today? `Today &#183; ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}`
            : formattedDate === yesterday? `Yesterday &#183; ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}`
            : `${formattedDate} &#183;  ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}`  
          }</span>
        </p>
      </section>
      <section>$${transaction.amount}</section>
  `;
 });
 return transactionHTML;
}

saveButtonElement.addEventListener('click', () => {
  if (!descElement.value || !amountElement.value || !typeElement.value || !categoryElement.value) {
    return;
  } else {
  const date = new Date();
  addToTransactions(date);
  calculateTotalIncome();
  calculateTotalExpenses();
  calculateTotalBalance();
  descElement.value = '';
  amountElement.value = '';
  typeElement.value = '';
  categoryElement.value = '';
  renderPage();
  }
});

renderPage();