import { PastelBadge, PastelTooltip } from '@cozy-village/ui';

const EXPRESSIONS = {
  idle: { face: '(^ _ ^)', status: 'Relaxing...', variant: 'lavender' },
  studying: { face: '(o _ o)', status: 'Studying together!', variant: 'mint' },
  break: { face: '(^ u ^)', status: 'Break time~', variant: 'peach' },
};

const MOOD_OVERLAYS = {
  happy: { particles: '~ ~ ~', variant: 'lemon' },
  calm: { particles: 'z z z', variant: 'mint' },
  tired: { particles: '. . .', variant: 'lavender' },
  excited: { particles: '* * *', variant: 'peach' },
  anxious: { particles: '! ! !', variant: 'blush' },
};

function Companion({ mood, studyState }) {
  const expression = EXPRESSIONS[studyState] || EXPRESSIONS.idle;
  const overlay = mood ? MOOD_OVERLAYS[mood] : null;

  return (
    <div className="companion-widget">
      <PastelTooltip text={expression.status} position="top">
        <div className="companion-widget__body">
          <div className="companion-widget__face">{expression.face}</div>
          {overlay && (
            <div className="companion-widget__particles">{overlay.particles}</div>
          )}
        </div>
      </PastelTooltip>

      <div className="companion-widget__info">
        <PastelBadge variant={expression.variant} size="sm">
          {expression.status}
        </PastelBadge>
        {mood && overlay && (
          <PastelBadge variant={overlay.variant} size="sm">
            {mood}
          </PastelBadge>
        )}
      </div>
    </div>
  );
}

export default Companion;
