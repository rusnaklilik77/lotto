// Преобразование ссылок (Google Drive / Dropbox / обычные) в прямые ссылки на картинку.
// Возвращает список кандидатов: если первый не загрузился — пробуем следующий.
export function candidates(raw, w = 2000) {
  const u = (raw || '').trim();
  if (!/^https?:\/\//i.test(u)) return [];
  if (/(drive|docs)\.google\.com/i.test(u)) {
    const m = u.match(/\/d\/([\w-]{10,})/) || u.match(/[?&]id=([\w-]{10,})/);
    if (m) {
      const id = m[1];
      return [
        `https://lh3.googleusercontent.com/d/${id}=w${w}`,
        `https://drive.google.com/thumbnail?id=${id}&sz=w${w}`,
        `https://drive.google.com/uc?export=view&id=${id}`,
      ];
    }
  }
  if (/dropbox\.com/i.test(u)) {
    return [u.replace(/[?&]dl=0/, '').replace(/([?&])dl=1/, '$1raw=1') + (/[?&]raw=1/.test(u) ? '' : (u.includes('?') ? '&' : '?') + 'raw=1')];
  }
  return [u];
}

// Ширина картинки под экран устройства (Drive отдаёт уменьшенную копию → быстрее на телефонах)
export function screenWidth() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  const px = Math.max(window.innerWidth, window.innerHeight) * dpr;
  return Math.min(2560, Math.max(800, Math.ceil(px / 200) * 200));
}

const seg = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
const split = s => seg ? [...seg.segment(s)].map(x => x.segment) : Array.from(s);

// Текст админа → список падающих элементов.
// Каждая строка: либо ссылка на фото, либо любые эмодзи/символы ("💵💰🪙" или "$ € ₽").
export function parseItems(text) {
  const out = [];
  String(text || '').split(/\n+/).forEach(line => {
    line = line.trim();
    if (!line) return;
    if (/^https?:\/\//i.test(line)) {
      line.split(/\s+/).forEach(p => { const c = candidates(p, 256); if (c.length) out.push({ t: 'img', c }); });
    } else {
      split(line.replace(/\s+/g, '')).forEach(e => { if (e) out.push({ t: 'e', e }); });
    }
  });
  return out.slice(0, 40);
}
