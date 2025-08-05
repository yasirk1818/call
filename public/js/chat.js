document.addEventListener('DOMContentLoaded', () => {
    // =================================================
    // 1. INITIALIZATION AND STATE MANAGEMENT
    // =================================================

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // --- DOM Elements ---
    const friendsListEl = document.getElementById('friends-list');
    const searchInputEl = document.getElementById('search-input');
    const searchResultsEl = document.getElementById('search-results');
    const pendingRequestsListEl = document.getElementById('pending-requests-list');
    const chatAreaEl = document.querySelector('.chat-area');
    const messageFormEl = document.getElementById('message-form');
    const messageInputEl = document.getElementById('message-input');
    const messagesAreaEl = document.getElementById('messages-area');
    const chatFriendNameEl = document.getElementById('chat-friend-name');
    const chatFriendAvatarEl = document.getElementById('chat-friend-avatar');
    const logoutBtn = document.getElementById('logout-btn');

    // --- State Variables ---
    let activeChat = { id: null, username: null };
    let searchTimeout;

    // =================================================
    // 2. SOCKET.IO CONNECTION
    // =================================================

    const socket = io({
        auth: { token } // Authenticate socket connection with JWT
    });

    socket.on('connect', () => {
        console.log('Socket.IO se connect ho gaya! ID:', socket.id);
    });

    socket.on('receivePrivateMessage', ({ content, from }) => {
        // Agar message active chat se hai to display karo
        if (from === activeChat.id) {
            appendMessage(content, 'received');
        } else {
            // Warna friend list me notification dikhao (e.g., green dot)
            const friendItem = document.querySelector(`.friend-item[data-id="${from}"]`);
            if (friendItem && !friendItem.querySelector('.notification-dot')) {
                const dot = document.createElement('span');
                dot.className = 'notification-dot';
                friendItem.appendChild(dot);
            }
        }
    });
    
    // =================================================
    // 3. API HELPER FUNCTION
    // =================================================

    // Ek helper function jo har API request ke sath token bhejega
    async function apiFetch(endpoint, options = {}) {
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
        const config = {
            ...options,
            headers: { ...defaultHeaders, ...options.headers }
        };
        try {
            const response = await fetch(`/api/users${endpoint}`, config);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'API request fail ho gayi');
            }
            return response.json();
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            alert(error.message); // User ko error dikhayein
        }
    }

    // =================================================
    // 4. RENDERING FUNCTIONS (UI Update)
    // =================================================

    // --- Render Friends List ---
    function renderFriends(friends) {
        friendsListEl.innerHTML = '';
        if (friends.length === 0) {
            friendsListEl.innerHTML = '<li class="no-friends">Dost add karne ke liye search karein.</li>';
            return;
        }
        friends.forEach(friend => {
            const li = document.createElement('li');
            li.className = 'friend-item';
            li.dataset.id = friend._id;
            li.dataset.username = friend.username;
            li.innerHTML = `
                <img src="https://i.pravatar.cc/40?u=${friend._id}" alt="avatar">
                <div class="friend-info">
                    <p class="friend-name">${friend.username}</p>
                    <p class="last-message">Click to chat...</p>
                </div>
            `;
            friendsListEl.appendChild(li);
        });
    }

    // --- Render Pending Friend Requests ---
    function renderPendingRequests(requests) {
        pendingRequestsListEl.innerHTML = '';
        if(requests.length === 0) {
            document.getElementById('requests-container').style.display = 'none';
            return;
        }
        document.getElementById('requests-container').style.display = 'block';
        requests.forEach(req => {
            const div = document.createElement('div');
            div.className = 'request-item';
            div.innerHTML = `
                <span><b>${req.from.username}</b> ne request bheji hai.</span>
                <div>
                    <button class="btn-accept" data-id="${req._id}">Accept</button>
                    <button class="btn-reject" data-id="${req._id}">Reject</button>
                </div>
            `;
            pendingRequestsListEl.appendChild(div);
        });
    }

    // --- Render Search Results ---
    function renderSearchResults(users) {
        searchResultsEl.innerHTML = '';
        if (users.length === 0) {
            searchResultsEl.innerHTML = '<div class="search-result-item">Koi user nahi mila.</div>';
            return;
        }
        users.forEach(user => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.innerHTML = `
                <span>${user.username} (${user.city})</span>
                <button class="btn-add-friend" data-id="${user._id}">Add</button>
            `;
            searchResultsEl.appendChild(div);
        });
    }

    // --- Append Message to Chat Window ---
    function appendMessage(content, type) {
        // "Start chat" prompt ko hatao agar mojood hai
        const prompt = messagesAreaEl.querySelector('.start-chat-prompt');
        if (prompt) prompt.remove();

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', type);
        messageDiv.innerHTML = `<p>${content}</p><span>${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>`;
        messagesAreaEl.appendChild(messageDiv);
        messagesAreaEl.scrollTop = messagesAreaEl.scrollHeight; // Automatically scroll to the latest message
    }


    // =================================================
    // 5. EVENT HANDLERS
    // =================================================

    // --- Search Users ---
    searchInputEl.addEventListener('keyup', () => {
        clearTimeout(searchTimeout);
        const query = searchInputEl.value.trim();
        if (query.length > 2) {
            searchTimeout = setTimeout(async () => {
                const users = await apiFetch(`/search?username=${query}`);
                renderSearchResults(users);
            }, 300); // Debounce: request 300ms ke baad bhejein
        } else {
            searchResultsEl.innerHTML = '';
        }
    });

    // --- Event Delegation for Clicks ---
    document.body.addEventListener('click', async (e) => {
        // Friend request bhejna
        if (e.target.matches('.btn-add-friend')) {
            const toUserId = e.target.dataset.id;
            await apiFetch('/friend-requests/send', {
                method: 'POST',
                body: JSON.stringify({ toUserId })
            });
            e.target.textContent = 'Sent';
            e.target.disabled = true;
        }

        // Friend request accept karna
        if (e.target.matches('.btn-accept')) {
            const requestId = e.target.dataset.id;
            await apiFetch('/friend-requests/respond', {
                method: 'POST',
                body: JSON.stringify({ requestId, status: 'accepted' })
            });
            init(); // UI refresh karein
        }

        // Friend request reject karna
        if (e.target.matches('.btn-reject')) {
            const requestId = e.target.dataset.id;
            await apiFetch('/friend-requests/respond', {
                method: 'POST',
                body: JSON.stringify({ requestId, status: 'rejected' })
            });
            init(); // UI refresh karein
        }
        
        // Chat open karna
        const friendItem = e.target.closest('.friend-item');
        if (friendItem) {
            const friendId = friendItem.dataset.id;
            const friendUsername = friendItem.dataset.username;
            activateChat(friendId, friendUsername);
        }
    });

    // --- Send Message ---
    messageFormEl.addEventListener('submit', (e) => {
        e.preventDefault();
        const content = messageInputEl.value.trim();
        if (content && activeChat.id) {
            socket.emit('privateMessage', { content, toUserId: activeChat.id });
            appendMessage(content, 'sent');
            messageInputEl.value = '';
        }
    });

    // --- Logout ---
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        socket.disconnect();
        window.location.href = '/login';
    });

    // =================================================
    // 6. HELPER & CORE FUNCTIONS
    // =================================================

    // --- Activate a Chat ---
    function activateChat(friendId, friendUsername) {
        // Agar pehle se yehi chat active hai to kuch na karo
        if (activeChat.id === friendId) return;

        activeChat = { id: friendId, username: friendUsername };
        
        // UI update karo
        chatAreaEl.classList.remove('hidden');
        chatFriendNameEl.textContent = friendUsername;
        chatFriendAvatarEl.src = `https://i.pravatar.cc/40?u=${friendId}`;
        messagesAreaEl.innerHTML = '<div class="start-chat-prompt"><p>Loading previous messages...</p></div>';
        messageInputEl.disabled = false;
        messageFormEl.querySelector('button').disabled = false;
        
        // Remove notification dot if it exists
        const friendItem = document.querySelector(`.friend-item[data-id="${friendId}"] .notification-dot`);
        if(friendItem) friendItem.remove();

        // Highlight the active friend in the list
        document.querySelectorAll('.friend-item').forEach(item => item.classList.remove('active'));
        document.querySelector(`.friend-item[data-id="${friendId}"]`).classList.add('active');
        
        // Yahan purane messages fetch karne ka logic ayega
        // fetchChatHistory(friendId);
    }
    
    // --- Initial Load Function ---
    async function init() {
        try {
            const [friends, requests] = await Promise.all([
                apiFetch('/friends'),
                apiFetch('/friend-requests/pending')
            ]);
            renderFriends(friends);
            renderPendingRequests(requests);
        } catch (error) {
            console.error('Initialization failed:', error);
        }
    }

    // --- Start the application ---
    init();
});
