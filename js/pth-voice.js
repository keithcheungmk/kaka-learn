const MANDARIN_REGIONS = new Set(['cn', 'sg', 'my', 'tw']);
const CANTONESE_LANG = /^(?:yue|zh-yue)(?:-|$)/i;
const CANTONESE_NAME = /cantonese|粵語|粤语|廣東話|广东话|香港|hong\s*kong/i;

// Accept only voices whose locale clearly identifies Mandarin. In particular,
// zh-Hans-HK and zh-Hant-HK must not pass as Mandarin just because they include
// a Chinese-script tag; some systems expose Cantonese under those locales.
export function isMandarinVoice(voice) {
  const lang = String(voice?.lang || '').replaceAll('_', '-').toLowerCase();
  const name = String(voice?.name || '');
  if (!lang || CANTONESE_LANG.test(lang) || CANTONESE_NAME.test(name)) return false;

  const parts = lang.split('-');
  if (parts[0] === 'cmn') return true;
  if (parts[0] !== 'zh') return false;
  if (parts.includes('hk')) return false;

  const region = parts.length === 2 ? parts[1] : parts.at(-1);
  if (!MANDARIN_REGIONS.has(region)) return false;
  if (parts.length === 2) return true;
  return parts.slice(1, -1).every((part) => part === 'hans' || part === 'hant');
}
