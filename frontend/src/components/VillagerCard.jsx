import { useState } from 'react';
import GiftModal from './GiftModal';

const MOOD_EMOJI = {
  joyful: '😄', content: '😊', neutral: '😐',
  lonely: '😢', upset: '😠',
};

function friendshipHearts(tier) {
  const map = { stranger: 0, acquaintance: 1, friend: 2, close_friend: 3, best_friend: 5 };
  const count = map[tier] ?? 0;
  return '❤️'.repeat(count) || '🤍';
}

export default function VillagerCard({ villager, onRefresh, showToast }) {
  const [showGift, setShowGift] = useState(false);

  const playerFriendship = villager.friendships?.player;

  return (
    <div className="card villager-card">
      <div className="villager-header">
        <div>
          <span className="villager-name">{villager.name}</span>
          <span className={`badge badge-${villager.personality}`}>
            {villager.personality}
          </span>
        </div>
        <span className="villager-mood" title={villager.mood}>
          {MOOD_EMOJI[villager.mood] || '😐'}
        </span>
      </div>

      <div className="villager-detail">
        📍 {villager.location}
      </div>

      {playerFriendship && (
        <div className="villager-detail">
          <span>{friendshipHearts(playerFriendship.tier)}</span>
          <span className="friendship-label">
            {playerFriendship.tier.replace('_', ' ')} ({playerFriendship.points} pts)
          </span>
        </div>
      )}

      {villager.dialogue && (
        <div className="chat-bubble">
          <div className="chat-bubble-arrow" />
          <span className="chat-bubble-text">{villager.dialogue}</span>
        </div>
      )}

      <div style={{ marginTop: 8 }}>
        <button className="btn btn-sm btn-primary" onClick={() => setShowGift(true)}>
          🎁 Give Gift
        </button>
      </div>

      {showGift && (
        <GiftModal
          villagerId={villager.id}
          villagerName={villager.name}
          onClose={() => setShowGift(false)}
          onRefresh={onRefresh}
          showToast={showToast}
        />
      )}
    </div>
  );
}
