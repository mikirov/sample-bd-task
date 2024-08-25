document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const hashedPassword = sha256(password); // Assuming you have a SHA-256 library

    const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password: hashedPassword })
    });

    if (response.ok) {
        window.location.href = "/dashboard.html";
    } else {
        alert("Invalid credentials");
    }
});
