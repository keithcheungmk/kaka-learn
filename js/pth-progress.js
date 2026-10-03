import {groups} from './pth-content.js?v=20261004';
const PREFIX = 'kaka-pth-v2';
const read = (store, key) => { try { return JSON.parse(store.getItem(key)); } catch { return null; } };
export function createProgress(store, profile) {
  if (!['kaka', 'heihei', 'guest'].includes(profile)) throw new Error('Invalid PTH profile');
  const key = suffix => `${PREFIX}:${profile}:${suffix}`;
  // Preserve old unscoped records for KAKA only; historical stars are not new awards.
  if (profile === 'kaka' && !read(store, key('migration'))) {
    const legacy = read(store, 'kaka-pth-v1');
    if (legacy) {
      store.setItem(key('legacy-backup'), JSON.stringify(legacy));
      const legacyGroup = groups.includes(store.getItem('kaka-pth-group')) ? store.getItem('kaka-pth-group') : 'bpmf';
      for (const group of groups) {
        const previous = legacy.groupProgress?.[group] || (group === legacyGroup ? legacy : null);
        if (previous && !read(store, key(`round:${group}`))) {
          const index = previous.completed ? 10 : Math.max(0, Math.min(10, Math.floor(Number(previous.roundStars) || 0)));
          store.setItem(key(`round:${group}`), JSON.stringify({seed:0,index}));
        }
        if (previous?.completed && !read(store, key(`award:${group}`))) {
          store.setItem(key(`award:${group}`), JSON.stringify({ legacy: true, stars: 0 }));
        }
      }
    }
    store.setItem(key('migration'), JSON.stringify({ stars: Math.max(0, Number(legacy?.totalStars) || 0) }));
  }
  const load = group => {
    const data = read(store, key(`round:${group}`));
    return { seed: Number.isFinite(data?.seed) ? data.seed : 0,
      index: Math.max(0, Math.min(10, Number.isInteger(data?.index) ? data.index : 0)) };
  };
  const awarded = group => Boolean(read(store, key(`award:${group}`)));
  const save = (group, data) => store.setItem(key(`round:${group}`), JSON.stringify(data));
  return {
    load, awarded,
    accept(group, expectedIndex, seed) {
      const round = load(group);
      if (round.index !== expectedIndex || round.seed !== seed || round.index >= 10) return false;
      round.index++;
      if (round.index === 10 && !awarded(group)) {
        // One immutable key per profile/course; two tabs cannot sum rewards twice.
        store.setItem(key(`award:${group}`), JSON.stringify({ stars: 10 }));
      }
      save(group, round);
      return true;
    },
    restart(group) { const round = load(group); save(group, { seed: round.seed + 1, index: 0 }); },
    total() { return (read(store, key('migration'))?.stars || 0) + groups.reduce((sum, group) => sum + (read(store, key(`award:${group}`))?.stars || 0), 0); },
  };
}
