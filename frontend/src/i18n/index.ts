import { useLangStore } from '../store/langStore';
import { fr } from './fr';
import { en } from './en';

export function useT() {
  const lang = useLangStore(s => s.lang);
  return lang === 'fr' ? fr : en;
}

export { fr, en };
