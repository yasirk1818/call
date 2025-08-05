const APP_ID = "7dd406183d1e42a08cfc6a946b454b82"; // Isay .env se lene ka behtar tareeqa banayein
let token = null;
let channel = null;
const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

let localAudioTrack = null;
let localVideoTrack = null;
let remoteUser = null;

async function joinChannel(channelName, callType) {
    // Backend se token fetch karein
    const response = await fetch('/api/agora/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ channelName })
    });
    const { token: fetchedToken } = await response.json();
    token = fetchedToken;
    channel = channelName;

    const uid = await client.join(APP_ID, channel, token, null);

    // Local tracks create aur publish karein
    localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    if (callType === 'video') {
        localVideoTrack = await AgoraRTC.createCameraVideoTrack();
        localVideoTrack.play('local-video');
        await client.publish([localAudioTrack, localVideoTrack]);
    } else {
        await client.publish([localAudioTrack]);
    }
    console.log('Successfully joined channel');
}

client.on('user-published', async (user, mediaType) => {
    remoteUser = user;
    await client.subscribe(user, mediaType);

    if (mediaType === 'video') {
        const remoteVideoTrack = user.videoTrack;
        remoteVideoTrack.play('remote-video');
    }
    if (mediaType === 'audio') {
        const remoteAudioTrack = user.audioTrack;
        remoteAudioTrack.play();
    }
});

async function leaveChannel() {
    localAudioTrack.close();
    if(localVideoTrack) localVideoTrack.close();
    
    await client.leave();
    document.getElementById('call-modal').classList.add('hidden');
}

// Ye functions chat.js se call honge
window.startCall = joinChannel;
window.endCall = leaveChannel;
