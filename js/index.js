async function fetchData() {
  const proxyUrl = 'https://cors-anywhere.herokuapp.com/';

  try {
    const customersResponse = await fetch(proxyUrl + "http://localhost:3000/customers");
    const transactionsResponse = await fetch(proxyUrl + "http://localhost:3000/transactions");

    const customers = await customersResponse.json();
    const transactions = await transactionsResponse.json();

    return { customers, transactions };
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

function getTransactionCounts(data) {
  return data.customers.map((customer) => {
    const customerTransactions = data.transactions.filter(
      (transaction) => transaction.customer_id === customer.id
    );
    return {
      id: customer.id,
      name: customer.name,
      transactionCount: customerTransactions.length,
      transactions: customerTransactions,
    };
  });
}

function generateTable(data) {
  const tableBody = document.querySelector("tbody");
  tableBody.innerHTML = "";

  data.forEach((customer) => {
    let isFirstTransaction = true;
    customer.transactions.forEach((transaction, index) => {
      const row = document.createElement("tr");
      row.classList.add("customer-row");
      row.dataset.customerId = customer.id;

      if (isFirstTransaction) {
        const nameCell = document.createElement("td");
        nameCell.textContent = customer.name;
        nameCell.rowSpan = customer.transactions.length;
        row.appendChild(nameCell);

        const countCell = document.createElement("td");
        countCell.textContent = customer.transactionCount;
        countCell.rowSpan = customer.transactions.length;
        row.appendChild(countCell);

        isFirstTransaction = false;
      }

      const dateCell = document.createElement("td");
      dateCell.textContent = transaction.date;
      row.appendChild(dateCell);

      const amountCell = document.createElement("td");
      amountCell.textContent = transaction.amount;
      row.appendChild(amountCell);

      row.addEventListener("click", () => {
        document.querySelectorAll(".customer-row").forEach((row) => {
          row.classList.remove("selected-row");
        });

        row.classList.add("selected-row");

        const customerId = row.dataset.customerId;
        const customer = data.find((customer) => customer.id == customerId);
        displayChart(customer.transactions);
      });

      tableBody.appendChild(row);
    });
  });
}

function filterTable() {
  const customerFilterValue = document
    .getElementById("customerFilter")
    .value.toLowerCase();
  const amountFilterValue = document
    .getElementById("amountFilter")
    .value.trim(); // Remove leading/trailing whitespace

  const filteredData = customerTransactionCounts.filter((customer) => {
    const matchesCustomer = customer.name
      .toLowerCase()
      .includes(customerFilterValue);

    const matchesAmount = customer.transactions.some((transaction) => {
      return amountFilterValue
        ? transaction.amount.toString().startsWith(amountFilterValue)
        : true;
    });

    return matchesCustomer && matchesAmount;
  });

  generateTable(filteredData);
}

function displayChart(transactions) {
  const ctx = document.getElementById("transactionChart").getContext("2d");
  const transactionAmounts = transactions.reduce((acc, transaction) => {
    acc[transaction.date] = (acc[transaction.date] || 0) + transaction.amount;
    return acc;
  }, {});

  const labels = Object.keys(transactionAmounts);
  const data = Object.values(transactionAmounts);

  if (
    window.transactionChart &&
    typeof window.transactionChart.destroy === "function"
  ) {
    window.transactionChart.destroy();
  }

  window.transactionChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Transaction Amount",
          data: data,
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

let customerTransactionCounts = [];

fetchData().then((data) => {
  customerTransactionCounts = getTransactionCounts(data);
  generateTable(customerTransactionCounts);

  document
    .getElementById("customerFilter")
    .addEventListener("input", filterTable);
  document
    .getElementById("amountFilter")
    .addEventListener("input", filterTable);
  document
    .getElementById("customerFilter")
    .addEventListener("keyup", filterTable);
  document
    .getElementById("amountFilter")
    .addEventListener("keyup", filterTable);
});
