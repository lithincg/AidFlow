export default function UrgencyBadge({ urgency }) {
  const className = {
    HIGH: 'badge badge-high',
    MEDIUM: 'badge badge-medium',
    LOW: 'badge badge-low',
  };

  return (
    <span className={className[urgency] || 'badge badge-low'}>
      {urgency}
    </span>
  );
}
