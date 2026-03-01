import { Lang } from '../constants';

interface Props {
  lang: Lang;
  setLang: (l: Lang) => void;
}

export default function LangSelector({ lang, setLang }: Props) {
  return (
    <button
      onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
      className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-sm px-3 py-1.5 rounded-lg transition-all border border-white/10 hover:border-white/25 backdrop-blur-sm font-semibold"
      title={lang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
    >
      <span className="text-base leading-none">{lang === 'es' ? '🇺🇸' : '🇵🇪'}</span>
      <span>{lang === 'es' ? 'EN' : 'ES'}</span>
    </button>
  );
}