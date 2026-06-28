import { getLevelTitle, getXPProgress } from '@/utils/helpers';

// ── Skeleton ──────────────────────────────────────────────────
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`shimmer rounded-lg ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="card p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'ghost';
  className?: string;
}
export function Badge({ children, variant = 'ghost', className = '' }: BadgeProps) {
  const variants = {
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    ghost: 'badge-ghost',
  };
  return <span className={`badge ${variants[variant]} ${className}`}>{children}</span>;
}

// ── XP Bar ────────────────────────────────────────────────────
interface XPBarProps { xp: number; level: number; showLabel?: boolean; className?: string; }
export function XPBar({ xp, level, showLabel = true, className = '' }: XPBarProps) {
  const progress = getXPProgress(xp, level);
  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-xs text-[#8b949e] mb-1">
          <span>{getLevelTitle(level)}</span>
          <span>{xp.toLocaleString()} XP</span>
        </div>
      )}
      <div className="xp-bar">
        <div className="xp-bar-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────
export function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <div className={`${sizes[size]} border-2 border-[#30363d] border-t-indigo-500 rounded-full animate-spin ${className}`} />
  );
}

// ── Empty State ───────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: {
  icon?: string; title: string; description?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-5xl mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && <p className="text-[#8b949e] text-sm max-w-sm mb-4">{description}</p>}
      {action && (
        <button onClick={action.onClick} className="btn-primary">
          {action.label}
        </button>
      )}
    </div>
  );
}

// ── Stats Card ────────────────────────────────────────────────
export function StatCard({ label, value, icon, color = 'indigo' }: {
  label: string; value: string | number; icon: string; color?: string;
}) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`text-2xl p-2 rounded-lg bg-${color}-500/10`}>{icon}</div>
      <div>
        <div className="text-xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</div>
        <div className="text-xs text-[#8b949e]">{label}</div>
      </div>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────
interface TabsProps {
  tabs: { id: string; label: string; icon?: string }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}
export function Tabs({ tabs, active, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex gap-1 bg-[#0d1117] rounded-lg p-1 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            active === tab.id
              ? 'bg-indigo-600 text-white'
              : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
          }`}
        >
          {tab.icon && <span>{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────
export function Modal({ isOpen, onClose, title, children }: {
  isOpen: boolean; onClose: () => void; title?: string; children: React.ReactNode;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-[#30363d]">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <button onClick={onClose} className="text-[#8b949e] hover:text-white transition-colors text-xl">✕</button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
