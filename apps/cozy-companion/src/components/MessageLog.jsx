import { useRef, useEffect } from 'react';

function MessageLog({ messages }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="message-log">
      <h2 className="section-title">Companion Says</h2>
      <div className="message-list">
        {messages.map((msg) => (
          <div key={msg.timestamp} className="message">
            <span className="message-text">{msg.text}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

export default MessageLog;
