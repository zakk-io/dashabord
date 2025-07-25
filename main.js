
// Fetch API data including stats
async function fetchData() {
  try {
    const response = await fetch('https://iot-server-wbz3.onrender.com/api/products');
    return await response.json();
  } catch (err) {
    console.error('Error fetching data:', err);
    return { totalWeightForRice: 0, totalWeightForSugar:0 , totalRevenueForRice:0 , totalRevenueForSugar: 0, products: [] };
  }
}

//test
// Create new product in database
async function createProduct(data) {
  try {
    const response = await fetch('https://iot-server-wbz3.onrender.com/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  } catch (err) {
    console.error('Error creating product:', err);
  }
}
// Update price in database
async function updatePrice(id, price) {
  try {
    await fetch(`https://iot-server-wbz3.onrender.com/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price })
    });
  } catch (err) {
    console.error('Error updating price:', err);
  }
}
// Update transaction in database
async function updateTransaction(id, transaction) {
  try {
    await fetch(`https://iot-server-wbz3.onrender.com/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction })
    });
  } catch (err) {
    console.error('Error updating transaction:', err);
  }
}
$(document).ready(function() {
  // Initialize DataTable
  const table = $('#historyTable').DataTable({
    data: [],
    columns: [
      { data: 'createdAt' },
      { data: '_id' },
      { data: 'type' },
      {
        data: 'weight',
        render: (val, type) => {
          // only format for display/filter, keep raw value for sorting/search
          if (type === 'display' || type === 'filter') {
            return Number(val).toFixed(2);
          }
          return val;
        }
      },
      { data: 'price', createdCell: td => $(td).attr('contenteditable', true).addClass('editable-price') },
      { data: 'transaction',
        render: d => {
          // Capitalize first letter (optional)
          return d.charAt(0).toUpperCase() + d.slice(1);
        }
      }
    ],
    dom: 'Bfrtip', buttons: ['copy','excel', 'csv' ,'pdf','print']
  });
  // Refresh function to fetch and update UI
  async function refresh() {
    const { totalWeightForRice, totalWeightForSugar, totalRevenueForRice, totalRevenueForSugar, products } = await fetchData();
    $('#totalWeightRice').text(`${Number(totalWeightForRice).toFixed(2)} kg`);
    $('#totalRevenueRice').text(`$${totalRevenueForRice}`);
    $('#totalWeightSugar').text(`${Number(totalWeightForSugar).toFixed(2)} kg`);
    $('#totalRevenueSugar').text(`$${totalRevenueForSugar}`);
    table.clear().rows.add(products).draw();

        // popup if stock is low (>= 10 kg means we need more stock)
    if (totalWeightForSugar <= 10) {
      alert('⚠️ Stock Alert:Sugar is low—please add more to the stock.');
    }

    if (totalWeightForRice <= 10) {
      alert('⚠️ Stock Alert: Rice is low—please add more to the stock.');
    }

  }
  // Initial load + interval for real-time feel
  refresh();
  setInterval(refresh, 30000);
  // Export CSV handler
  $('#exportBtn').on('click', () => table.button('.buttons-csv').trigger());
  // New stock form handler: create via API then refresh
  $('#newStockForm').on('submit', async function(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(this).entries());
    await createProduct(data);
    this.reset();
    await refresh();
  });
  // Inline editing handlers
  $('#historyTable tbody')
    .on('blur', 'td.editable-price', async function() {
      const newPrice = $(this).text();
      const rowData = table.row($(this).closest('tr')).data();
      table.cell(this).data(newPrice).draw();
      await updatePrice(rowData._id, newPrice);
      await refresh();
    })
    .on('change', 'select.transaction-select', async function() {
      const newTrans = $(this).val();
      const rowData = table.row($(this).closest('tr')).data();
      table.cell($(this).closest('td')).data(newTrans).draw();
      await updateTransaction(rowData._id, newTrans);
      await refresh();
    });
});
