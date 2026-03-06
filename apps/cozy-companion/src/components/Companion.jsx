const EXPRESSIONS = {
  idle: { face: '(^ _ ^)', status: 'Relaxing...' },
  studying: { face: '(o _ o)', status: 'Studying together!' },
  break: { face: '(^ u ^)', status: 'Break time~' },
};

const MOOD_OVERLAYS = {
  Happy: '~',
  Calm: 'z',
  Tired: '.',
  Stressed: '!',
};

function Companion({ mood, studyState }) {
  const expression = EXPRESSIONS[studyState] || EXPRESSIONS.idle;
  const overlay = mood ? MOOD_OVERLAYS[mood] : null;

  return (
    <div className="companion">
      <div className="companion-body">
        <div className="companion-face">{expression.face}</div>
        {overlay && <div className="companion-overlay">{overlay.repeat(3)}</div>}
      </div>
      <p className="companion-status">{expression.status}</p>
    </div>
  );
}

export default Companion;
