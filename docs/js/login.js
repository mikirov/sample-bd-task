document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const table = document.getElementById("table").value;
    const hashedPassword = CryptoJS.SHA256(password).toString(); // Hashing the password using SHA-256

    const response = await fetch(`${API_BASE_URL}/api/login`, { // Use API_BASE_URL for the request
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include', // This sends the cookies and credentials along with the request
        body: JSON.stringify({ username, password: hashedPassword })
    });

    if (response.ok) {
        const data = await response.json();
        // Store JWT token and table name in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('table', table);

        // Redirect to the dashboard page
        window.location.href = 'table.html';
    } else {
        alert("Invalid credentials");
    }
});
