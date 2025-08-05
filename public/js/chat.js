document.addEventListener('DOMContentLoaded', () => {
    // 1. INITIALIZATION
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/login'; return; }

    const myId = JSON.parse(atob(token.split('.')[1])).id;

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
    const videoCallBtn = document.getElementById('video-call-btn');
    const voiceCallBtn = document.getElementById('voice-call-btn');

    // --- State Variables ---
    let activeChat = { id: null, username: null };
    let searchTimeout;

    // 2. SOCKET.IO CONNECTION
    const socket = io({ auth: { token } });

    socket.on('connect', () => console.log('Socket.IO se connect ho gaya! ID:', socket.id));

    socket.on('receivePrivateMessage', (message) => {
        if (message.sender === activeChat.id) {
            appendMessage(message.content, 'received', message.timestamp);
        } else {
            const friendItem = document.querySelector(`.friend-item[data-id="${message.sender}"] .notification-dot`);
            if (friendItem) friendItem.style.display = 'block';
        }
    });

    // 3. API HELPER
    async function apiFetch(endpoint, options = {}) {
        const config = { ...options, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...options.headers } };
        try {
            const response = await fetch(`/api/users${endpoint}`, config);
            if (!response.ok) throw new Error((await response.json()).message);
            return response.json();
        } catch (error) { console.error(`API Error:`, error); alert(error.message); }
    }

    // 4. RENDERING FUNCTIONS
    function renderFriends(friends) {
        friendsListEl.innerHTML = friends.length ? '' : '<li class="no-friends">Dost add karne ke liye search karein.</li>';
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
                <span class="notification-dot" style="display: none;"></span>`;
            friendsListEl.appendChild(li);
        });
    }

    function renderPendingRequests(requests) {
        pendingRequestsListEl.innerHTML = '';
        document.getElementById('requests-container').style.display = requests.length ? 'block' : 'none';
        requests.forEach(req => {
            const div = document.createElement('div');
            div.className = 'request-item';
            div.innerHTML = `
                <span><b>${req.from.username}</b> ne request bheji hai.</span>
                <div>
                    <button class="btn-accept" data-id="${req._id}">Accept</button>
                    <button class="btn-reject" data-id="${req._id}">Reject</button>
                </div>`;
            pendingRequestsListEl.appendChild(div);
        });
    }
    
    function renderSearchResults(users) {
        searchResultsEl.innerHTML = users.length ? '' : '<div class="search-result-item">Koi user nahi mila.</div>';
        users.forEach(user => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.innerHTML = `
                <span>${user.username} (${user.city})</span>
                <button class="btn-add-friend" data-id="${user._id}">Add</button>`;
            searchResultsEl.appendChild(div);
        });
    }

    function appendMessage(content, type, timestamp) {
        const prompt = messagesAreaEl.querySelector('.start-chat-prompt');
        if (prompt) prompt.remove();
        const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', type);
        messageDiv.innerHTML = `<p>${content}</p><span>${time}</span>`;
        messagesAreaEl.appendChild(messageDiv);
        messagesAreaEl.scrollTop = messagesAreaEl.scrollHeight;
    }

    // 5. EVENT HANDLERS
    searchInputEl.addEventListener('keyup', () => {
        clearTimeout(searchTimeout);
        const query = searchInputEl.value.trim();
        if (query.length > 2) {
            searchTimeout = setTimeout(async () => renderSearchResults(await apiFetch(`/search?username=${query}`)), 300);
        } else {
            searchResultsEl.innerHTML = '';
        }
    });

    document.body.addEventListener('click', async (e) => {
        if (e.target.matches('.btn-add-friend')) {
            await apiFetch('/friend-requests/send', { method: 'POST', body: JSON.stringify({ toUserId: e.target.dataset.id }) });
            e.target.textContent = 'Sent'; e.target.disabled = true;
        }
        if (e.target.matches('.btn-accept')) {
            await apiFetch('/friend-requests/respond', { method: 'POST', body: JSON.stringify({ requestId: e.target.dataset.id, status: 'accepted' }) });
            init();
        }
        if (e.target.matches('.btn-reject')) {
            await apiFetch('/friend-requests/respond', { method: 'POST', body: JSON.stringify({ requestId: e.target.dataset.id, status: 'rejected' }) });
            init();
        }
        const friendItem = e.target.closest('.friend-item');
        if (friendItem) activateChat(friendItem.dataset.id, friendItem.dataset.username);
    });

    messageFormEl.addEventListener('submit', (e) => {
        e.preventDefault();
        const content = messageInputEl.value.trim();
        if (content && activeChat.id) {
            const messageData = { content, toUserId: activeChat.id };
            socket.emit('privateMessage', messageData);
            appendMessage(content, 'sent', new Date());
            messageInputEl.value = '';
        }
    });

    logoutBtn.addEventListener('click', () => { localStorage.removeItem('token'); socket.disconnect(); window.location.href = '/login'; });
    
    videoCallBtn.addEventListener('click', () => activeChat.id ? initiateCall('video') : alert("Pehle aik chat select karein."));
    voiceCallBtn.addEventListener('click', () => activeChat.id ? initiateCall('voice') : alert("Pehle aik chat select karein."));

    // 6. CORE FUNCTIONS
    async function fetchChatHistory(friendId) {
        messagesAreaEl.innerHTML = '';
        const messages = await apiFetch(`/chat-history/${friendId}`);
        messages.forEach(msg => {
            const messageType = msg.sender === myId ? 'sent' : 'received';
            appendMessage(msg.content, messageType, msg.createdAt);
        });
    }

    function activateChat(friendId, friendUsername) {
        if (activeChat.id === friendId) return;
        activeChat = { id: friendId, username: friendUsername };
        chatAreaEl.classList.remove('hidden');
        chatFriendNameEl.textContent = friendUsername;
        chatFriendAvatarEl.src = `https://i.pravatar.cc/40?u=${friendId}`;
        messageInputEl.disabled = false;
        messageFormEl.querySelector('button').disabled = false;
        
        const dot = document.querySelector(`.friend-item[data-id="${friendId}"] .notification-dot`);
        if (dot) dot.style.display = 'none';

        document.querySelectorAll('.friend-item').forEach(item => item.classList.remove('active'));
        document.querySelector(`.friend-item[data-id="${friendId}"]`).classList.add('active');
        
        fetchChatHistory(friendId);
    }
    
    async function initiateCall(callType) {
        alert(`Starting ${callType} call with ${activeChat.username}. Feature abhi ban raha hai.`);
    }

    async function init() {
        try {
            const [friends, requests] = await Promise.all([
                apiFetch('/friends'), apiFetch('/friend-requests/pending')
            ]);
            renderFriends(friends);
            renderPendingRequests(requests);
        } catch (error) { console.error('Initialization failed:', error); }
    }

    init();
});
