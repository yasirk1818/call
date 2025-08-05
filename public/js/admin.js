document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/login'; return; }

    const usersTableBody = document.querySelector('#users-table tbody');

    async function apiFetch(endpoint, options = {}) {
        const response = await fetch(`/api/admin${endpoint}`, {
            ...options,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...options.headers }
        });
        if (!response.ok) throw new Error('API request failed');
        return response.json();
    }

    async function loadUsers() {
        try {
            const users = await apiFetch('/users');
            usersTableBody.innerHTML = '';
            users.forEach(user => {
                const tr = document.createElement('tr');
                tr.dataset.userId = user._id;
                tr.innerHTML = `
                    <td>${user.username}</td>
                    <td>${user.email}</td>
                    <td>
                        <select class="status-select">
                            <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="blocked" ${user.status === 'blocked' ? 'selected' : ''}>Blocked</option>
                        </select>
                    </td>
                    <td>
                        <select class="calling-select">
                            <option value="true" ${user.callingEnabled ? 'selected' : ''}>On</option>
                            <option value="false" ${!user.callingEnabled ? 'selected' : ''}>Off</option>
                        </select>
                    </td>
                    <td><button class="save-btn">Save</button></td>
                `;
                usersTableBody.appendChild(tr);
            });
        } catch (error) {
            alert('Users load karne me error. Aap admin nahi hain.');
            window.location.href = '/chat';
        }
    }

    usersTableBody.addEventListener('click', async (e) => {
        if (e.target.classList.contains('save-btn')) {
            const row = e.target.closest('tr');
            const userId = row.dataset.userId;
            const status = row.querySelector('.status-select').value;
            const callingEnabled = row.querySelector('.calling-select').value === 'true';

            try {
                await apiFetch(`/users/${userId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ status, callingEnabled })
                });
                alert('User updated!');
            } catch (error) {
                alert('Update fail ho gaya.');
            }
        }
    });

    loadUsers();
});
