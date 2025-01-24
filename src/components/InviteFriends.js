import React, { useState } from 'react';

const InviteFriends = () => {
  const [friendPhone, setFriendPhone] = useState('');
  const [message, setMessage] = useState(
    `Hey! I’m using this amazing app to grow my network. Join me here: https://your-platform-link.com`
  );

  const handleWhatsAppInvite = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleSmsInvite = () => {
    const url = `sms:${friendPhone}?&body=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div>
      <h3>Invite Friends</h3>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows="4"
        placeholder="Customize your invite message"
      />
      <input
        type="tel"
        placeholder="Friend's Phone Number"
        value={friendPhone}
        onChange={(e) => setFriendPhone(e.target.value)}
      />
      <button onClick={handleWhatsAppInvite}>Invite via WhatsApp</button>
      <button onClick={handleSmsInvite}>Invite via SMS</button>
    </div>
  );
};

export default InviteFriends;
