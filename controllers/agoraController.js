const { RtcTokenBuilder, RtcRole } = require('agora-token');

exports.generateAgoraToken = (req, res) => {
    const { channelName } = req.body;
    const uid = 0; // UID '0' kisi bhi user ko join karne deta hai, security ke liye aap yahan user ID istemaal kar sakte hain
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600; // 1 ghanta
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    if (!channelName) {
        return res.status(400).json({ 'error': 'channel name is required' });
    }

    const token = RtcTokenBuilder.buildTokenWithUid(
        process.env.AGORA_APP_ID,
        process.env.AGORA_APP_CERTIFICATE,
        channelName,
        uid,
        role,
        privilegeExpiredTs
    );

    res.json({ token });
};
