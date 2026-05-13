/**
 * RiskBadge Component
 * ===================
 * Renders a color-coded badge indicating the threat risk level of a security event.
 * Used throughout the dashboard (AlertsPage, SuspiciousActivityPage, AlertModal)
 * to provide at-a-glance risk assessment.
 *
 * Risk Level → Visual Mapping:
 * - High:   Red border + red text (danger indicator)
 * - Medium: Amber border + amber text (warning indicator)
 * - Low:    Green border + green text (safe indicator)
 */
interface RiskBadgeProps {
  level: 'Low' | 'Medium' | 'High';
}

export function RiskBadge({ level }: RiskBadgeProps) {
  const riskConfig = {
    Low: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      text: 'text-green-400',
    },
    Medium: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
    },
    High: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
    },
  };

  const config = riskConfig[level];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${config.bg} ${config.border} ${config.text}`}
    >
      {level}
    </span>
  );
}
