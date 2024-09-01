document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    let API_BASE_URL;

    if (window.location.hostname === 'localhost' || window.location.protocol === 'file:') {
        // Running locally
        API_BASE_URL = 'http://localhost:3000';
    } else {
        //deployed
        API_BASE_URL = 'https://young-headland-02551-20b4a3f00085.herokuapp.com'; // Replace with your actual backend URL
    }

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
