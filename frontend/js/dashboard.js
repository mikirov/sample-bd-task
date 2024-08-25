document.addEventListener("DOMContentLoaded", async function() {
    const response = await fetch('/api/tables');
    const tables = await response.json();

    const tableList = document.getElementById('tableList');
    tables.forEach(table => {
        const tableLink = document.createElement('a');
        tableLink.href = `/table.html?name=${table}`;
        tableLink.textContent = table;
        tableList.appendChild(tableLink);
        tableList.appendChild(document.createElement('br'));
    });
});
