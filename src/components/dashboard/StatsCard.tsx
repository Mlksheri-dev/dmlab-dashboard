import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { MiniWaveChart } from './MiniWaveChart';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant?: 'blue' | 'yellow' | 'purple' | 'success' | 'cyan' | 'pink';
}

export function StatsCard({ title, value, icon: Icon, variant = 'blue' }: StatsCardProps) {
  const colors = {
    blue: '#01416D', // ITU Blue
    yellow: '#f99a1d', // New Golden #f99a1d
    purple: '#6B7280', // Gray for neutral
    success: '#10B981',
    cyan: '#0891B2',
    pink: '#BE185D'
  };

  return (
    <div className={cn(
      'bg-card rounded-2xl p-6 border border-border shadow-sm transition-all hover:shadow-md hover:translate-y-[-2px] relative overflow-hidden',
      variant === 'blue' && 'border-l-4 border-l-secondary',
      variant === 'yellow' && 'border-l-4 border-l-primary'
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "p-3 rounded-lg bg-muted border border-border",
          variant === 'blue' && 'text-primary',
          variant === 'yellow' && 'text-secondary'
        )}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="relative z-10">
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
          {title}
        </p>
        <div className="flex items-baseline gap-2">
          <h2 className="text-3xl font-bold tracking-tight text-white leading-none">
            {value}
          </h2>
          <span className="text-[10px] font-bold text-emerald-400">Active</span>
        </div>
      </div>
    </div>
  );
}