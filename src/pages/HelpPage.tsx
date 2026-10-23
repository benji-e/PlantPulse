import { BookOpen, Camera, CircleHelp, Leaf, ShieldCheck, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, PageTitle } from '../components/UI';
import { useTranslation } from '../hooks/useTranslation';

const howTo = [
  { icon: Camera, title: 'takePhoto', text: 'chooseLeafFocus' },
  { icon: Sun, title: 'goodLight', text: 'daylightAvoidShadows' },
  { icon: Leaf, title: 'readResult', text: 'compareAndAsk' }
] as const;

export function HelpPage() {
  const t = useTranslation();
  return <div className="mx-auto max-w-3xl page-enter"><PageTitle eyebrow={t('helpEyebrow')} title={t('helpTitle')} text={t('helpIntro')} />
    <div className="grid gap-3 sm:grid-cols-3">{howTo.map(({ icon: Icon, title, text }, index) => <Card key={title} className="p-5"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF2E6] text-forest"><Icon size={24} /></div><p className="mt-4 text-xs font-extrabold uppercase tracking-wider text-coffee-light">{t('step')} {index + 1}</p><h2 className="mt-1 text-lg font-extrabold">{t(title)}</h2><p className="mt-2 text-sm leading-relaxed text-coffee">{t(text)}</p></Card>)}</div>
    <div className="mt-5 space-y-3">
      <Card><div className="flex gap-4"><span className="settings-icon"><CircleHelp /></span><div><h2 className="font-extrabold">{t('whatCanCheck')}</h2><p className="mt-2 leading-relaxed text-coffee">{t('canCheckText')}</p></div></div></Card>
      <Card><div className="flex gap-4"><span className="settings-icon text-warning"><BookOpen /></span><div><h2 className="font-extrabold">{t('whatCannotDo')}</h2><p className="mt-2 leading-relaxed text-coffee">{t('cannotDoText')}</p></div></div></Card>
      <Card className="bg-warm"><div className="flex gap-4"><span className="settings-icon"><ShieldCheck /></span><div><h2 className="font-extrabold">{t('photoPrivate')}</h2><p className="mt-2 leading-relaxed text-coffee">{t('photoPrivateText')}</p></div></div></Card>
    </div>
    <p className="mt-5 rounded-2xl border border-warning/20 bg-[#FFF8EE] p-4 text-sm leading-relaxed text-coffee">{t('helpDisclaimer')}</p>
    <Link className="button mt-5" to="/guide"><BookOpen size={19} />{t('openGuide')}</Link>
  </div>;
}
