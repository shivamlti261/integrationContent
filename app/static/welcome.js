document.addEventListener('DOMContentLoaded', function() {
    // Toggle login/register cards
    const showLoginBtn = document.getElementById('showLoginBtn');
    const showRegisterBtn = document.getElementById('showRegisterBtn');
    const loginCard = document.getElementById('loginCard');
    const registerCard = document.getElementById('registerCard');
    if (showLoginBtn && showRegisterBtn && loginCard && registerCard) {
        showLoginBtn.onclick = function() {
            showLoginBtn.classList.add('active');
            showRegisterBtn.classList.remove('active');
            loginCard.style.display = '';
            registerCard.style.display = 'none';
        };
        showRegisterBtn.onclick = function() {
            showRegisterBtn.classList.add('active');
            showLoginBtn.classList.remove('active');
            registerCard.style.display = '';
            loginCard.style.display = 'none';
        };
    }
    const btn = document.getElementById('infoBtn');
    const infoBox = document.getElementById('infoBox');
    btn.addEventListener('click', function() {
        infoBox.classList.toggle('hidden');
    });

    // Login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('login_username').value;
            const password = document.getElementById('login_password').value;
            handleLogin(username, password);
        });
    }

    // Register form handler
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const client_id = document.getElementById('reg_client_id').value;
            const client_secret = document.getElementById('reg_client_secret').value;
            const token_url = document.getElementById('reg_token_url').value;
            const tenant_url = document.getElementById('reg_tenant_url').value;
            const username = document.getElementById('reg_username').value;
            const password = document.getElementById('reg_password').value;
            handleRegister(client_id, client_secret, token_url, tenant_url, username, password);
        });
    }
});

// Dummy login logic: send username and password to server
async function handleLogin(username, password) {
    // TODO: Replace with real API call
    console.log('Login attempt:', { username, password });
    // Example: send to /api/login
    /*
    const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    */
    // Simulate login success
    window.location.href = '/dashboard';
}

// Dummy register logic: send all fields to server
async function handleRegister(client_id, client_secret, token_url, tenant_url, username, password) {
    // TODO: Replace with real API call
    console.log('Register attempt:', { client_id, client_secret, token_url, tenant_url, username, password });
    // Example: send to /api/register
    /*
    const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id, client_secret, token_url, tenant_url, username, password })
    });
    */
    // Simulate register success
    alert('Registration successful! You can now log in.');
}
