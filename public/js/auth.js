document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Form ka default submission rokein

            errorMessage.textContent = ''; // Purana error message saaf karein
            
            const email = loginForm.email.value;
            const password = loginForm.password.value;

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password }),
                    headers: { 'Content-Type': 'application/json' }
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || 'Something went wrong');
                }
                
                // Token ko browser ki local storage me save karein
                localStorage.setItem('token', data.token);
                
                // Login successful hone par chat page par redirect karein
                window.location.href = '/chat';

            } catch (err) {
                errorMessage.textContent = err.message;
            }
        });
    }
});
