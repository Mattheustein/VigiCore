interface StatusBadgeProps {
  status: 'secure' | 'warning' | 'critical';
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const statusConfig = {
    secure: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      text: 'text-green-400',
      dot: 'bg-green-400',
      label: label || 'Secure',
    },
    warning: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      dot: 'bg-amber-400',
      label: label || 'Warning',
    },
    critical: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      dot: 'bg-red-400',
      label: label || 'Critical',
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${config.bg} ${config.border}`}
    >
      <div className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`} />
      <span className={`text-sm ${config.text}`}>{config.label}</span>
    </div>
  );
}
