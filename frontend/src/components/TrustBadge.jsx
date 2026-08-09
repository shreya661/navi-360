const labels = {
  fact: ['From the notice', 'fact'],
  interpretation: ['NAVI’s guidance', 'interpretation'],
  uncertain: ['Please confirm', 'uncertain'],
}

export default function TrustBadge({ kind }) {
  const [label, className] = labels[kind] ?? labels.uncertain
  return <span className={`trust-badge ${className}`}>{label}</span>
}

