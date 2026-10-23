import { Leaf } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export function Brand({ compact = false }: { compact?: boolean }) {
  const t = useTranslation();
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-forest text-white shadow-sm">
        <Leaf aria-hidden="true" size={25} strokeWidth={2.4} />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-xl font-extrabold tracking-tight text-forest">PlantPulse</span>
          <span className="text-xs font-bold text-coffee-light">{t('growWithConfidence')}</span>
        </span>
      )}
    </div>
  );
}
