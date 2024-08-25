document.addEventListener("DOMContentLoaded", async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const tableName = urlParams.get('name');

    const response = await fetch(`/api/table/${tableName}`);
    const tableData = await response.json();

    const tableView = document.getElementById('tableView');
    const headerRow = document.createElement('tr');

    // Create Header Row
    Object.keys(tableData[0]).forEach(field => {
        const th = document.createElement('th');
        th.textContent = field;
        headerRow.appendChild(th);
    });
    tableView.appendChild(headerRow);

    // Create Filter Row
    const filterRow = document.createElement('tr');
    Object.keys(tableData[0]).forEach(field => {
        const td = document.createElement('td');
        const input = document.createElement('input');
        input.setAttribute('data-field', field);
        input.addEventListener('input', filterTable);
        td.appendChild(input);
        filterRow.appendChild(td);
    });
    tableView.appendChild(filterRow);

    // Create Data Rows
    tableData.forEach(row => {
        const tr = document.createElement('tr');
        Object.keys(row).forEach(field => {
            const td = document.createElement('td');
            td.textContent = row[field];
            td.addEventListener('dblclick', editField);
            tr.appendChild(td);
        });
        tableView.appendChild(tr);
    });
});

function filterTable(event) {
    const field = event.target.getAttribute('data-field');
    const filter = event.target.value.toLowerCase();
    const rows = document.querySelectorAll('#tableView tr:not(:first-child)');

    rows.forEach(row => {
        const cell = row.querySelector(`td:nth-child(${Array.from(row.cells).indexOf(event.target.parentNode) + 1})`);
        row.style.display = cell && cell.textContent.toLowerCase().includes(filter) ? '' : 'none';
    });
}

function editField(event) {
    const td = event.target;
    const originalValue = td.textContent;
    td.innerHTML = `<input type="text" value="${originalValue}"> <button id="confirm">✔</button> <button id="cancel">✖</button>`;

    td.querySelector('#confirm').addEventListener('click', async function() {
        const newValue = td.querySelector('input').value;
        // Perform validation and update the database here
        td.textContent = newValue; // Assuming update is successful
        td.style.backgroundColor = '';
    });

    td.querySelector('#cancel').addEventListener('click', function() {
        td.textContent = originalValue;
        td.style.backgroundColor = '';
    });

    td.style.backgroundColor = '#e0e0e0';
}

document.getElementById('addRow').addEventListener('click', function() {
    const newRow = document.createElement('tr');
    // Generate empty row with inputs
    // You need to customize this according to your table structure
});
