let myChartIntance = null;

export function renderChart(transactions) {
  const ctx = document.getElementById('my-chart');
  if (!ctx) return;
  
  const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const data = {
    labels: ['Income', 'Expenses'],
    datasets: [{
      data: [income, expenses],
      backgroundColor: ['#22c55e', '#ef4444']
    }]
  };

  if(myChartIntance) {
    myChartIntance.destroy();
  }

  myChartIntance = new Chart(ctx, {
    type: 'doughnut',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

export function renderCategoriesChart(transactions) {
  const ctx = document.getElementById('my-chart');
  if (!ctx) return;

  const food = transactions.filter(t => t.category === 'Food').reduce((sum, t) => sum + t.amount, 0);
  const transport = transactions.filter(t => t.category === 'Transport').reduce((sum, t) => sum + t.amount, 0);
  const shopping = transactions.filter(t => t.category === 'Shopping').reduce((sum, t) => sum + t.amount, 0);  
  const bills = transactions.filter(t => t.category === 'Bills').reduce((sum, t) => sum + t.amount, 0);
  const income = transactions.filter(t => t.category === 'Income').reduce((sum, t) => sum + t.amount, 0);  
  
  const data = {
    labels: ['Food', 'Transport', 'Shopping', 'Bills', 'Income'],
    datasets: [{
      data: [food, transport, shopping, bills, income],
      backgroundColor: ['rgb(168, 106, 71)', 'rgb(251, 146, 43)', 'rgb(132, 88, 232)', 'rgb(71, 85, 105)', 'rgb(52, 168, 83)']
    }]
  };
  if (myChartIntance) {
    myChartIntance.destroy();
  }

  myChartIntance = new Chart(ctx, {
    type: 'doughnut',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

};