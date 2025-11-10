interface StatsCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: string
  trend?: string
  progress?: number
}

export default function StatsCard({ title, value, subtitle, icon, trend, progress }: StatsCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="text-3xl">{icon}</div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend.startsWith('+') ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
            {trend}
          </span>
        )}
      </div>

      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-muted-foreground mb-1">{title}</div>
      <div className="text-xs text-muted-foreground">{subtitle}</div>

      {progress !== undefined && (
        <div className="mt-4">
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1">{progress}% gebruikt</div>
        </div>
      )}
    </div>
  )
}
