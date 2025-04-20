// Get DOM elements
const balanceEl = document.getElementById('balance');
const incomeEl = document.getElementById('income');
const expenseEl = document.getElementById('expense');
const transactionForm = document.getElementById('transactionForm');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const dateInput = document.getElementById('date');
const categoryInput = document.getElementById('category');
const transactionList = document.getElementById('transactionList');
const incomeBtn = document.getElementById('incomeBtn');
const expenseBtn = document.getElementById('expenseBtn');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const categoryModal = document.getElementById('categoryModal');
const categoryForm = document.getElementById('categoryForm');
const newCategoryInput = document.getElementById('newCategory');
const cancelCategoryBtn = document.getElementById('cancelCategory');
const monthSelector = document.getElementById('monthSelector');

// Initialize charts
const lineChart = echarts.init(document.getElementById('lineChart'));
const pieChart = echarts.init(document.getElementById('pieChart'));

// Track current transaction type and selected month
let isIncome = true;
let selectedMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

// Set default date to today
dateInput.valueAsDate = new Date();

// Default categories
const defaultCategories = {
    income: ['Salary', 'Business', 'Investment', 'Freelance', 'Other Income'],
    expense: ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Other Expense']
};

// Get transactions and custom categories from localStorage
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let customCategories = JSON.parse(localStorage.getItem('customCategories')) || {
    income: [],
    expense: []
};

// Initialize the app
function init() {
    transactionList.innerHTML = '';
    transactions.forEach(addTransactionToDOM);
    updateValues();
    updateMonthSelector();
    updateCharts();
}

// Update month selector
function updateMonthSelector() {
    const months = new Set(transactions.map(t => t.date.slice(0, 7)));
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    if (!months.has(currentMonth)) {
        months.add(currentMonth);
    }

    monthSelector.innerHTML = Array.from(months)
        .sort((a, b) => b.localeCompare(a))
        .map(month => {
            const [year, monthNum] = month.split('-');
            const monthName = new Date(year, monthNum - 1).toLocaleString('default', { month: 'long' });
            return `<option value="${month}" ${month === selectedMonth ? 'selected' : ''}>
                ${monthName} ${year}
            </option>`;
        })
        .join('');
}

// Update charts
function updateCharts() {
    const monthlyTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));
    
    updateLineChart(monthlyTransactions);
    updatePieChart(monthlyTransactions);
}

// Update line chart
function updateLineChart(monthlyTransactions) {
    // Get the last day of the selected month
    const lastDay = new Date(selectedMonth + '-01');
    lastDay.setMonth(lastDay.getMonth() + 1);
    lastDay.setDate(0);
    const days = lastDay.getDate();

    // Initialize arrays for each day of the month
    const dailyData = Array(days).fill(null);
    const dailyIncome = Array(days).fill(null);
    const dailyExpense = Array(days).fill(null);

    // Sort transactions by date
    const sortedTransactions = monthlyTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate cumulative totals
    let runningTotal = 0;
    let runningIncome = 0;
    let runningExpense = 0;

    // Find the first day with a transaction
    let firstTransactionDay = days;
    if (sortedTransactions.length > 0) {
        firstTransactionDay = new Date(sortedTransactions[0].date).getDate() - 1;
    }

    // Initialize the starting point for cumulative totals
    for (let i = 0; i < firstTransactionDay; i++) {
        dailyData[i] = 0;
        dailyIncome[i] = 0;
        dailyExpense[i] = 0;
    }

    sortedTransactions.forEach(t => {
        const day = new Date(t.date).getDate() - 1;
        
        // Update running totals
        runningTotal += t.amount;
        if (t.amount > 0) {
            runningIncome += t.amount;
        } else {
            runningExpense += Math.abs(t.amount);
        }

        // Update all days from this transaction onwards
        for (let i = day; i < days; i++) {
            dailyData[i] = runningTotal;
            dailyIncome[i] = runningIncome;
            dailyExpense[i] = runningExpense;
        }
    });

    // Create x-axis labels for each day
    const xAxisData = Array.from({length: days}, (_, i) => {
        const date = new Date(selectedMonth + '-' + (i + 1));
        return date.getDate();
    });

    const option = {
        tooltip: {
            trigger: 'axis',
            formatter: function(params) {
                const day = params[0].axisValue;
                const date = new Date(selectedMonth + '-' + day);
                const formattedDate = date.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short'
                });
                
                let html = `${formattedDate}<br/>`;
                params.forEach(param => {
                    const value = param.value === null ? '₹0.00' : `₹${param.value.toFixed(2)}`;
                    html += `${param.seriesName}: ${value}<br/>`;
                });
                return html;
            }
        },
        legend: {
            data: ['Total Balance', 'Total Income', 'Total Expense'],
            bottom: 0
        },
        xAxis: {
            type: 'category',
            data: xAxisData,
            name: 'Day of Month',
            nameLocation: 'middle',
            nameGap: 35,
            axisLabel: {
                formatter: value => `${value}`,
                interval: 'auto',
                rotate: window.innerWidth < 768 ? 30 : 0
            }
        },
        yAxis: {
            type: 'value',
            name: 'Amount (₹)',
            nameLocation: 'middle',
            nameGap: 50,
            axisLabel: {
                formatter: value => `₹${value}`
            }
        },
        grid: {
            left: '60px',
            right: '30px',
            bottom: '60px',
            top: '40px',
            containLabel: true
        },
        series: [
            {
                name: 'Total Balance',
                type: 'line',
                data: dailyData,
                lineStyle: {
                    color: '#10B981',
                    width: 3
                },
                itemStyle: {
                    color: '#10B981'
                },
                symbol: 'circle',
                symbolSize: 8,
                connectNulls: true,
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        {
                            offset: 0,
                            color: 'rgba(16, 185, 129, 0.2)'
                        },
                        {
                            offset: 1,
                            color: 'rgba(16, 185, 129, 0.0)'
                        }
                    ])
                }
            },
            {
                name: 'Total Income',
                type: 'line',
                data: dailyIncome,
                lineStyle: {
                    color: '#3B82F6',
                    width: 3
                },
                itemStyle: {
                    color: '#3B82F6'
                },
                symbol: 'circle',
                symbolSize: 8,
                connectNulls: true,
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        {
                            offset: 0,
                            color: 'rgba(59, 130, 246, 0.2)'
                        },
                        {
                            offset: 1,
                            color: 'rgba(59, 130, 246, 0.0)'
                        }
                    ])
                }
            },
            {
                name: 'Total Expense',
                type: 'line',
                data: dailyExpense,
                lineStyle: {
                    color: '#EF4444',
                    width: 3
                },
                itemStyle: {
                    color: '#EF4444'
                },
                symbol: 'circle',
                symbolSize: 8,
                connectNulls: true,
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        {
                            offset: 0,
                            color: 'rgba(239, 68, 68, 0.2)'
                        },
                        {
                            offset: 1,
                            color: 'rgba(239, 68, 68, 0.0)'
                        }
                    ])
                }
            }
        ]
    };

    lineChart.setOption(option);
}

// Update pie chart
function updatePieChart(monthlyTransactions) {
    const categoryData = {};
    
    monthlyTransactions.forEach(t => {
        if (!categoryData[t.category]) {
            categoryData[t.category] = 0;
        }
        categoryData[t.category] += Math.abs(t.amount);
    });

    const data = Object.entries(categoryData)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const option = {
        tooltip: {
            trigger: 'item',
            formatter: params => {
                const percent = ((params.value / data.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1);
                return `${params.name}<br/>₹${params.value.toFixed(2)} (${percent}%)`;
            }
        },
        legend: {
            bottom: 0,
            left: 'center',
            type: 'scroll',
            orient: 'horizontal',
            pageButtonPosition: 'end',
            pageTextStyle: {
                color: '#666'
            }
        },
        grid: {
            bottom: '15%'
        },
        series: [
            {
                name: 'Categories',
                type: 'pie',
                radius: ['40%', '70%'],
                center: ['50%', '40%'],
                avoidLabelOverlap: true,
                itemStyle: {
                    borderRadius: 10,
                    borderColor: '#fff',
                    borderWidth: 2
                },
                label: {
                    show: false
                },
                emphasis: {
                    label: {
                        show: true,
                        formatter: '{b}\n₹{c}'
                    }
                },
                data: data
            }
        ]
    };

    pieChart.setOption(option);
}

// Handle window resize
window.addEventListener('resize', () => {
    lineChart.resize();
    pieChart.resize();
});

// Toggle transaction type
function toggleTransactionType(type) {
    isIncome = type === 'income';
    
    // Update button styles
    if (isIncome) {
        incomeBtn.classList.add('active', 'income-btn');
        expenseBtn.classList.remove('active', 'expense-btn');
    } else {
        expenseBtn.classList.add('active', 'expense-btn');
        incomeBtn.classList.remove('active', 'income-btn');
    }

    // Update category options based on transaction type
    updateCategoryOptions();
}

// Update category options based on transaction type
function updateCategoryOptions() {
    categoryInput.innerHTML = '<option value="">Select a category</option>';
    
    const defaultCats = defaultCategories[isIncome ? 'income' : 'expense'];
    const customCats = customCategories[isIncome ? 'income' : 'expense'];
    
    // Add default categories
    if (defaultCats.length > 0) {
        const defaultGroup = document.createElement('optgroup');
        defaultGroup.label = 'Default Categories';
        defaultCats.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            defaultGroup.appendChild(option);
        });
        categoryInput.appendChild(defaultGroup);
    }
    
    // Add custom categories
    if (customCats.length > 0) {
        const customGroup = document.createElement('optgroup');
        customGroup.label = 'Custom Categories';
        customCats.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            customGroup.appendChild(option);
        });
        categoryInput.appendChild(customGroup);
    }
}

// Show category modal
function showCategoryModal() {
    categoryModal.classList.remove('hidden');
    categoryModal.classList.add('flex');
    newCategoryInput.focus();
}

// Hide category modal
function hideCategoryModal() {
    categoryModal.classList.add('hidden');
    categoryModal.classList.remove('flex');
    newCategoryInput.value = '';
}

// Add new category
function addNewCategory(e) {
    e.preventDefault();
    
    const categoryName = newCategoryInput.value.trim();
    if (categoryName) {
        const type = isIncome ? 'income' : 'expense';
        
        // Check if category already exists
        const allCategories = [...defaultCategories[type], ...customCategories[type]];
        if (!allCategories.includes(categoryName)) {
            customCategories[type].push(categoryName);
            updateCategoryOptions();
            updateLocalStorageCategories();
            hideCategoryModal();
        } else {
            alert('This category already exists!');
        }
    }
}

// Add transaction
function addTransaction(e) {
    e.preventDefault();

    const amount = +amountInput.value;
    const transaction = {
        id: generateID(),
        description: descriptionInput.value.trim(),
        amount: isIncome ? amount : -amount,
        category: categoryInput.value,
        date: new Date(dateInput.value + 'T00:00:00').toISOString()
    };

    transactions.push(transaction);
    addTransactionToDOM(transaction);
    updateValues();
    updateLocalStorage();
    updateMonthSelector();
    
    // Update charts only if the transaction is in the selected month
    if (transaction.date.startsWith(selectedMonth)) {
        updateCharts();
    }

    // Reset form
    descriptionInput.value = '';
    amountInput.value = '';
    categoryInput.value = '';
    dateInput.valueAsDate = new Date(); // Reset date to today
}

// Generate random ID
function generateID() {
    return Math.floor(Math.random() * 1000000000);
}

// Add transaction to DOM
function addTransactionToDOM(transaction) {
    const amount = Math.abs(transaction.amount).toFixed(2);
    const date = new Date(transaction.date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    const tr = document.createElement('tr');
    tr.classList.add('transaction-item', 'new-transaction', 'border-b', 'hover:bg-gray-50');
    tr.setAttribute('data-id', transaction.id);
    
    tr.innerHTML = `
        <td class="px-4 py-3">${transaction.description}</td>
        <td class="px-4 py-3">${transaction.category}</td>
        <td class="px-4 py-3">${date}</td>
        <td class="px-4 py-3 ${transaction.amount < 0 ? 'amount-negative' : 'amount-positive'}">
            ${transaction.amount < 0 ? '-' : '+'}₹${amount}
        </td>
        <td class="px-4 py-3">
            <button onclick="removeTransaction(${transaction.id})" 
                    class="delete-btn px-3 py-1 rounded-lg border border-red-500 text-red-500 text-sm">
                Delete
            </button>
        </td>
    `;

    transactionList.insertBefore(tr, transactionList.firstChild);
}

// Update balance, income and expense
function updateValues() {
    const amounts = transactions.map(transaction => transaction.amount);
    
    const total = amounts.reduce((acc, item) => (acc + item), 0).toFixed(2);
    const income = amounts
        .filter(item => item > 0)
        .reduce((acc, item) => (acc + item), 0)
        .toFixed(2);
    const expense = (amounts
        .filter(item => item < 0)
        .reduce((acc, item) => (acc + item), 0) * -1)
        .toFixed(2);

    balanceEl.textContent = `₹${total}`;
    incomeEl.textContent = `₹${income}`;
    expenseEl.textContent = `₹${expense}`;
}

// Remove transaction
function removeTransaction(id) {
    const tr = document.querySelector(`tr[data-id="${id}"]`);
    tr.classList.add('opacity-0');
    
    setTimeout(() => {
        transactions = transactions.filter(transaction => transaction.id !== id);
        updateLocalStorage();
        init();
    }, 300);
}

// Update localStorage for transactions
function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Update localStorage for categories
function updateLocalStorageCategories() {
    localStorage.setItem('customCategories', JSON.stringify(customCategories));
}

// Event listeners
transactionForm.addEventListener('submit', addTransaction);
incomeBtn.addEventListener('click', () => toggleTransactionType('income'));
expenseBtn.addEventListener('click', () => toggleTransactionType('expense'));
addCategoryBtn.addEventListener('click', showCategoryModal);
cancelCategoryBtn.addEventListener('click', hideCategoryModal);
categoryForm.addEventListener('submit', addNewCategory);
monthSelector.addEventListener('change', (e) => {
    selectedMonth = e.target.value;
    updateCharts();
});

// Close modal when clicking outside
categoryModal.addEventListener('click', (e) => {
    if (e.target === categoryModal) {
        hideCategoryModal();
    }
});

// Initialize app
toggleTransactionType('income'); // Set initial state
init(); 