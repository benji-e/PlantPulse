import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

export function PageTitle({ eyebrow, title, text }: { eyebrow?: string; title: string; text?: string }) {
  return <div className="mb-6"><p className="eyebrow">{eyebrow}</p><h1 className="page-title">{title}</h1>{text && <p className="mt-2 max-w-2xl text-base leading-relaxed text-coffee">{text}</p>}</div>;
}

export function Button({ children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return <button className={`button ${className}`} {...props}>{children}</button>;
}

export function Card({ children, className = '', ...props }: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return <section className={`card ${className}`} {...props}>{children}</section>;
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon">{icon}</div><h2 className="mt-4 text-xl font-extrabold">{title}</h2><p className="mt-2 max-w-sm text-coffee">{text}</p>{action && <div className="mt-5">{action}</div>}</div>;
}
