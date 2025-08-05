document.addEventListener('DOMContentLoaded', () => {
    // 1. INITIALIZATION and STATE
    // ... (purana code waisa hi hai) ...
    const incomingCallModal = document.getElementById('incoming-call-modal');
    const acceptCallBtn = document.getElementById('accept-call-btn');
    const declineCallBtn = document.getElementById('decline-call-btn');
    const endCallBtn = document.getElementById('end-call-btn');
    const callModal = document.getElementById('call-modal');
    
    let callInfo = { // Call-related state
        channelName: null,
        caller: null,
        callType: null
    };

    // 2. SOCKET.IO LISTENERS
    // ... (purana 'connect' aur 'receivePrivateMessage' ka code) ...
    
    // --- Naye Call-related Listeners ---
    socket.on('incoming-call', ({ from, fromUsername, channelName, callType }) => {
        callInfo = { channelName, caller: from, callType };
        document.getElementById('incoming-call-text').textContent = `${fromUsername} is calling you...`;
        document.getElementById('caller-avatar').src = `https://i.pravatar.cc/80?u=${from}`;
        incomingCallModal.classList.remove('hidden');
    });

    socket.on('call-accepted', async () => {
        console.log('Call accepted! Joining channel...');
        callModal.querySelector('h3').textContent = "Connecting...";
        await window.startCall(callInfo.channelName, callInfo.callType);
        callModal.querySelector('h3').textContent = `${callInfo.callType} Call in Progress`;
    });

    socket.on('call-declined', () => {
        alert('Call declined by user.');
        resetCallUI();
    });

    socket.on('call-ended', () => {
        alert('Call ended by other user.');
        window.endCall(); // Agora client se leave karein
        resetCallUI();
    });

    // 3. API HELPER and 4. RENDERING FUNCTIONS
    // ... (yeh sections waise hi rahenge) ...

    // 5. EVENT HANDLERS
    // ... (purane event handlers) ...

    acceptCallBtn.addEventListener('click', async () => {
        socket.emit('call-accepted', { toUserId: callInfo.caller });
        incomingCallModal.classList.add('hidden');
        callModal.classList.remove('hidden');
        callModal.querySelector('h3').textContent = "Connecting...";
        document.getElementById('call-partner-name').textContent = "partner"; // Isay behtar kar sakte hain

        await window.startCall(callInfo.channelName, callInfo.callType);
        callModal.querySelector('h3').textContent = `${callInfo.callType} Call in Progress`;
    });

    declineCallBtn.addEventListener('click', () => {
        socket.emit('call-declined', { toUserId: callInfo.caller });
        incomingCallModal.classList.add('hidden');
        resetCallUI();
    });

    endCallBtn.addEventListener('click', () => {
        socket.emit('call-ended', { toUserId: activeChat.id }); // End call signal bhejein
        window.endCall();
        resetCallUI();
    });


    // 6. CORE FUNCTIONS
    // ... (purana code) ...
    
    // --- initiateCall function ko update karein ---
    async function initiateCall(type) {
        // Unique channel name banayein
        const myId = JSON.parse(atob(token.split('.')[1])).id;
        const channelName = [myId, activeChat.id].sort().join('-');

        callInfo = { channelName, callType: type }; // Call ki info save karein

        // Doosre user ko call ka signal bhejein
        socket.emit('outgoing-call', {
            toUserId: activeChat.id,
            channelName,
            callType: type
        });

        // Apna call UI show karein
        callModal.classList.remove('hidden');
        document.getElementById('call-partner-name').textContent = activeChat.username;
        callModal.querySelector('h3').textContent = `Calling ${activeChat.username}...`;
    }

    function resetCallUI() {
        callModal.classList.add('hidden');
        incomingCallModal.classList.add('hidden');
        callInfo = { channelName: null, caller: null, callType: null };
        document.getElementById('local-video').innerHTML = '';
        document.getElementById('remote-video').innerHTML = '';
    }

    // ... (baki code) ...
});
