document.addEventListener("DOMContentLoaded", async function() {
    let API_BASE_URL;

    if (window.location.hostname === 'localhost') {
        // Running locally
        API_BASE_URL = 'http://localhost:3000';
    } else {
        //deployed
        API_BASE_URL = 'https://young-headland-02551-20b4a3f00085.herokuapp.com'; // Replace with your actual backend URL
    }

    let currentPage = 1;
    const limit = 10; // Items per page

    // Check if JWT token exists in localStorage
    const token = localStorage.getItem('token');
    const tableName = localStorage.getItem('table');

    // If no token, redirect to login page
    if (!token) {
        window.location.href = 'login.html';
    }

    try {
        // Verify the token by making a request to the backend
        const response = await fetch(`${API_BASE_URL}/api/verify-token`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            // If the token is invalid or expired, clear it and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('table');
            window.location.href = 'login.html';
        } else {
            // Token is valid; proceed with the dashboard
            const data = await response.json();
            console.log('Token is valid. User data:', data.user);
            console.log('Table Name:', tableName);
        }
    } catch (error) {
        console.error('Error verifying token:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('table');
        window.location.href = 'login.html';
    }


    document.getElementById('addRow').addEventListener('click', function() {
        // Fetch the latest table data before adding a new row
        fetchTableData(currentPage, {}, true);
    });

    async function fetchTableData(page = 1, filters = {}, isAddingNewRow = false) {
        const queryParams = new URLSearchParams({ page, limit, ...filters }).toString();
        const response = await fetch(`${API_BASE_URL}/api/table/${tableName}?${queryParams}`);
        const tableData = await response.json();
        populateTable(tableData);

        if (isAddingNewRow) {
            addNewRow(tableData, tableName);
        }
    }

    function populateTable(tableData) {
        const tableView = document.getElementById('tableView');
        tableView.innerHTML = ''; // Clear existing data

        const headerRow = document.createElement('tr');
        const filterRow = document.createElement('tr');

        if (tableData.length > 0) {
            Object.keys(tableData[0]).forEach((field, index) => {
                const th = document.createElement('th');
                th.textContent = field;
                headerRow.appendChild(th);

                const td = document.createElement('td');
                const input = document.createElement('input');
                input.setAttribute('data-field', field);
                input.addEventListener('input', filterTable);
                td.appendChild(input);
                filterRow.appendChild(td);
            });
            tableView.appendChild(headerRow);
            tableView.appendChild(filterRow);
        }

        tableData.forEach(row => {
            const tr = document.createElement('tr');
            Object.keys(row).forEach((field, index) => {
                const td = document.createElement('td');
                td.textContent = row[field];

                // Disable ID field permanently
                if (index === 0) {
                    td.addEventListener('dblclick', () => {
                        alert("ID field cannot be edited.");
                    });
                } else {
                    td.addEventListener('dblclick', editField);
                }

                tr.appendChild(td);
            });

            // Add delete button
            const deleteTd = document.createElement('td');
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => deleteRow(row.id));
            deleteTd.appendChild(deleteButton);
            tr.appendChild(deleteTd);

            tableView.appendChild(tr);
        });

        // Add pagination controls
        const paginationControls = document.getElementById('paginationControls');
        paginationControls.innerHTML = `
            <button ${currentPage === 1 ? 'disabled' : ''} id="prevPage">Previous</button>
            <span>Page ${currentPage}</span>
            <button id="nextPage">Next</button>
        `;

        document.getElementById('prevPage').addEventListener('click', () => {
            currentPage--;
            fetchTableData(currentPage);
        });

        document.getElementById('nextPage').addEventListener('click', () => {
            currentPage++;
            fetchTableData(currentPage);
        });
    }

    function filterTable(event) {
        const filters = {};
        const inputs = document.querySelectorAll('#tableView input[data-field]');
        inputs.forEach(input => {
            if (input.value.trim() !== '') {
                filters[input.getAttribute('data-field')] = input.value;
            }
        });
        fetchTableData(1, filters); // Send the filter parameters with the request
    }

    async function deleteRow(id) {
        if (confirm('Are you sure you want to delete this record?')) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/table/${tableName}/delete/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    alert('Record deleted successfully');
                    fetchTableData(currentPage); // Refresh the table data
                } else {
                    alert('Failed to delete record');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error deleting record');
            }
        }
    }

    function editField(event) {
        const td = event.target;
        const originalValue = td.textContent;
        const row = td.closest('tr');
        const id = row.querySelector('td').textContent; // Assuming the first column is the ID
        const headerCells = document.querySelectorAll('#tableView th');
        const columnIndex = Array.from(td.parentNode.children).indexOf(td);
        const key = headerCells[columnIndex].textContent.trim();

        td.innerHTML = `<input type="text" value="${originalValue}"> <button id="confirm">✔</button> <button id="cancel">✖</button>`;

        td.querySelector('#confirm').addEventListener('click', async function() {
            const newValue = td.querySelector('input').value;
            td.textContent = newValue; // Assuming update is successful
            td.style.backgroundColor = '';

            // Send PUT request with the ID, key, and newValue
            try {
                const response = await fetch(`${API_BASE_URL}/api/table/${tableName}/update/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ field: key, value: newValue })
                });

                if (response.ok) {
                    console.log('Field updated successfully!');
                } else {
                    console.error('Failed to update field.');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });

        td.querySelector('#cancel').addEventListener('click', function() {
            td.textContent = originalValue;
            td.style.backgroundColor = '';
        });

        td.style.backgroundColor = '#e0e0e0';
    }

    function addNewRow(tableData, tableName) {
        const tableView = document.getElementById('tableView');
        const newRow = document.createElement('tr');

        const nextId = tableData.length > 0 ? Math.max(...tableData.map(row => row.id)) + 1 : 1;

        Object.keys(tableData[0]).forEach((field, index) => {
            const td = document.createElement('td');
            if (index === 0) {
                td.innerHTML = `<input type="text" value="${nextId}" disabled>`;
            } else {
                td.innerHTML = `<input type="text">`;
            }
            newRow.appendChild(td);
        });

        tableView.appendChild(newRow);

        createActionButtons(newRow, tableName);
    }

    function createActionButtons(newRow, tableName) {
        let actionButtons = document.getElementById('actionButtons');

        if (!actionButtons) {
            actionButtons = document.createElement('div');
            actionButtons.id = 'actionButtons';
            document.body.appendChild(actionButtons);
        }

        actionButtons.innerHTML = ''; // Clear previous buttons if any

        const submitButton = document.createElement('button');
        submitButton.textContent = 'Submit';
        submitButton.style.marginRight = '10px';
        submitButton.addEventListener('click', function() {
            submitNewRow(newRow, tableName);
        });

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.addEventListener('click', function() {
            cancelNewRow(newRow);
        });

        actionButtons.appendChild(submitButton);
        actionButtons.appendChild(cancelButton);
        actionButtons.style.display = 'block';
    }

    async function submitNewRow(newRow, tableName) {
        const rowData = {};

        // Get the header row keys (column names)
        const headerCells = document.querySelectorAll('#tableView th');
        
        // Get the cells of the new row
        const cells = newRow.querySelectorAll('td');

        headerCells.forEach((headerCell, index) => {
            const key = headerCell.textContent.trim();  // Ensure header text is trimmed and used as key
            const input = cells[index].querySelector('input');
            const value = input ? input.value : '';  // Ensure we're getting the input value, default to an empty string if input is null

            // Only add key-value pair if key is not null or empty
            if (key) {
                rowData[key] = value;
            }
        });

        console.log('Submitting new row:', rowData);

        try {
            const response = await fetch(`${API_BASE_URL}/api/table/${tableName}/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(rowData)
            });

            if (response.ok) {
                console.log('Row added successfully!');
                cells.forEach(cell => {
                    cell.querySelector('input').disabled = true;
                });
            } else {
                console.error('Failed to add row.');
            }
        } catch (error) {
            console.error('Error:', error);
        }

        const actionButtons = document.getElementById('actionButtons');
        if (actionButtons) {
            actionButtons.remove();
        }
    }

    function cancelNewRow(newRow) {
        newRow.remove();
        const actionButtons = document.getElementById('actionButtons');
        if (actionButtons) {
            actionButtons.remove();
        }
    }

    fetchTableData(currentPage); // Initial load
});
