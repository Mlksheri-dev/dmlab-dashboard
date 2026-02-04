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
    blue: '#3b82f6',
    yellow: '#eab308',
    purple: '#a855f7',
    success: '#22c55e',
    cyan: '#06b6d4',
    pink: '#ec4899'
  };

  return (
    <div className={cn(
      'glass-card rounded-[2rem] p-8 group premium-border relative overflow-hidden transition-all hover:translate-y-[-6px]',
      variant === 'blue' && 'glow-blue',
      variant === 'yellow' && 'glow-yellow',
      variant === 'purple' && 'glow-purple'
    )}>
      <div className="flex items-center justify-between mb-6">
        <div className={cn(
          "p-4 rounded-2xl bg-muted shadow-inner border border-border",
          variant === 'blue' && 'text-blue-400',
          variant === 'yellow' && 'text-yellow-400',
          variant === 'purple' && 'text-purple-400'
        )}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="bg-background/40 p-3 rounded-2xl border border-border">
          <MiniWaveChart
            color={colors[variant as keyof typeof colors]}
            width={140}
            height={50}
            intensity={0.6}
            showGrid={true}
          />
        </div>
      </div>

      <div className="relative z-10">
        <p className="text-[12px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 mb-2 italic">
          {title}
        </p>
        <div className="flex items-baseline gap-3">
          <h2 className="text-5xl font-black italic tracking-tighter text-foreground leading-none">
            {value}
          </h2>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-success uppercase tracking-widest">+12.4%</span>
            <span className="text-[8px] font-bold text-muted-foreground/40 uppercase">Growth</span>
          </div>
        </div>
      </div>

      {/* Dynamic Background Accent */}
      <div className={cn(
        "absolute -right-10 -bottom-10 w-40 h-40 blur-[80px] opacity-10 rounded-full",
        variant === 'blue' && 'bg-blue-500',
        variant === 'yellow' && 'bg-yellow-500',
        variant === 'purple' && 'bg-purple-500'
      )} />

      {/* Decorative Technical ID */}
      <div className="absolute top-4 right-8 text-[8px] font-mono font-bold text-foreground opacity-5 tracking-widest uppercase pointer-events-none">
        CORE_METRIC_S{Math.floor(Math.random() * 1000)}
      </div>
    </div>
  );
}