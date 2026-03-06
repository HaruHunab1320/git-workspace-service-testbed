import { useRef, useEffect } from 'react';
import { PastelCard, PastelBadge } from '@cozy-village/ui';

function MessageLog({ messages }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!messages || messages.length === 0) {
    return (
      <PastelCard title="Companion Says" icon=">" padding="md">
        <p className="message-log__empty">
          Your companion is quietly observing...
        </p>
      </PastelCard>
    );
  }

  return (
    <PastelCard title="Companion Says" icon=">" padding="md">
      <div className="message-log">
        {messages.map((msg, i) => (
          <div key={msg.timestamp || i} className="message-bubble">
            <PastelBadge variant="lavender" size="sm" className="message-bubble__time">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </PastelBadge>
            <span className="message-bubble__text">{msg.text}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </PastelCard>
  );
}

export default MessageLog;
