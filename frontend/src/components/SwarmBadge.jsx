import './SwarmBadge.css';

export default function SwarmBadge({ agentId = 'alpha' }) {
  return (
    <div className="swarm-badge">
      <span className="swarm-badge-dot" />
      <span className="swarm-badge-label">Swarm</span>
      <span className="swarm-badge-id">{agentId}</span>
    </div>
  );
}
