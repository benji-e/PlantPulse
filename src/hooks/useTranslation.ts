import english from '../i18n/en.json';
import luganda from '../i18n/lg.json';
import { useAppStore } from '../store/appStore';

type MessageKey = keyof typeof english;

export function useTranslation() {
  const language = useAppStore((state) => state.language);
  const messages = language === 'lg' ? luganda : english;
  return (key: MessageKey, variables: Record<string, string | number> = {}) => {
    const message = messages[key] ?? english[key];
    return message.replace(/\{\{(\w+)\}\}/g, (placeholder, name: string) => String(variables[name] ?? placeholder));
  };
}
