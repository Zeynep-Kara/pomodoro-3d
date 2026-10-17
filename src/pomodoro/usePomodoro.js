import { useCallback, useEffect, useState } from 'react';

// Varsayılan süreler (dakika). Kullanıcı ayarlardan değiştirebilir.
export const DEFAULT_SETTINGS = {
  workMinutes: 25, // odaklanma
  breakMinutes: 5, // mola
};
export const MIN_MINUTES = 1;
export const MAX_MINUTES = 180;

// Ayarlar tarayıcıda saklanıyor, sayfayı yenileyince kaybolmasın.
const STORAGE_KEY = 'pomodoro.settings';

// Pomodoro zamanlayıcısının tüm mantığı. 3D'den tamamen habersiz.
//
// Neden her saniye "kalan süreden 1 çıkar" demiyoruz?
// setInterval tam zamanında çalışmaz. Sekme arka plandayken tarayıcı onu saniyelerce
// geciktirebilir. Sayaç yavaş yavaş geri kalır. Bunun yerine bitiş anını (endTime) saklıyoruz
// ve kalan süreyi her seferinde saatten hesaplıyoruz: kalan = endTime - şimdi.
//
// Akış: odaklanma biter → mola OTOMATİK başlar → mola biter → odaklanma bekler (kullanıcı başlatır).
export function usePomodoro() {
  // useState'e fonksiyon verince sadece ilk render'da çalışır: localStorage'ı her render'da okumayız.
  const [state, setState] = useState(() => {
    const settings = loadSettings();
    return {
      settings, // { workMinutes, breakMinutes }
      mode: 'work', // 'work' | 'break'
      running: false,
      started: false, // bu tur başlatıldı mı? (duraklatılmış ile hiç başlamamışı ayırmak için)
      remainingMs: durationMs(settings, 'work'),
      endTime: 0, // çalışırken: bitiş anı (Date.now() cinsinden)
    };
  });

  // Çalışırken saniyede 4 kez kalan süreyi güncelle.
  // (Saniyede 1 olsaydı ekrandaki sayı bazen 2 saniye atlıyormuş gibi görünürdü.)
  useEffect(() => {
    if (!state.running) return;

    const id = setInterval(() => {
      const now = Date.now();
      setState((s) => {
        if (!s.running) return s;
        const left = s.endTime - now;
        if (left > 0) return { ...s, remainingMs: left };

        if (s.mode === 'work') {
          // Odaklanma bitti: molaya geç ve molayı HEMEN başlat.
          // Bitiş anını "şimdi"den değil, odaklanmanın bittiği andan hesaplıyoruz.
          // Bilgisayar uykudaydıysa ve mola da çoktan bittiyse, bir sonraki güncellemede o da biter.
          const breakMs = durationMs(s.settings, 'break');
          return { ...s, mode: 'break', remainingMs: breakMs, endTime: s.endTime + breakMs };
        }

        // Mola bitti: odaklanmaya geç ve dur. Kullanıcı hazır olunca başlatır.
        return {
          ...s,
          mode: 'work',
          running: false,
          started: false,
          remainingMs: durationMs(s.settings, 'work'),
          endTime: 0,
        };
      });
    }, 250);

    // Temizlik: duraklatınca ya da bileşen kalkınca interval'i durdur.
    return () => clearInterval(id);
  }, [state.running]);

  // useCallback: bu fonksiyonlar her render'da yeniden oluşmasın, hep aynı kalsın.
  // setState'e fonksiyon verdiğimiz için (s => ...) güncel duruma dışarıdan bakmaya gerek yok.
  const toggle = useCallback(() => {
    const now = Date.now();
    setState((s) =>
      s.running
        ? { ...s, running: false, remainingMs: Math.max(0, s.endTime - now) } // duraklat
        : { ...s, running: true, started: true, endTime: now + s.remainingMs }, // başlat / devam et
    );
  }, []);

  const reset = useCallback(() => {
    setState((s) => ({
      ...s,
      running: false,
      started: false,
      remainingMs: durationMs(s.settings, s.mode),
      endTime: 0,
    }));
  }, []);

  // Ayarlardan yeni süreler geldiğinde.
  // Zamanlayıcı hiç başlamadıysa yeni süre hemen ekrana gelir.
  // Çalışıyorsa ya da duraklatılmışsa mevcut tur bozulmaz, yeni süreler bir sonraki turda geçerli olur.
  const updateSettings = useCallback((settings) => {
    saveSettings(settings);
    setState((s) => ({
      ...s,
      settings,
      remainingMs: s.started ? s.remainingMs : durationMs(settings, s.mode),
    }));
  }, []);

  // Duraklatılmış mı? Durmuş ama bu tur başlatılmıştı, yani yarıda kesilmiş.
  const paused = !state.running && state.started;

  return { ...state, paused, toggle, reset, updateSettings };
}

function durationMs(settings, mode) {
  const minutes = mode === 'work' ? settings.workMinutes : settings.breakMinutes;
  return minutes * 60 * 1000;
}

export function isValidMinutes(value) {
  return Number.isInteger(value) && value >= MIN_MINUTES && value <= MAX_MINUTES;
}

// localStorage'a erişim bazı durumlarda (gizli sekme, kapalı site verileri) hata verebilir.
// Bu yüzden try/catch: hata olursa varsayılan ayarlarla devam ediyoruz.
function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && isValidMinutes(saved.workMinutes) && isValidMinutes(saved.breakMinutes)) {
      return { workMinutes: saved.workMinutes, breakMinutes: saved.breakMinutes };
    }
  } catch {
    // okunamadı: varsayılana düş
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // kaydedilemedi: ayar bu oturum boyunca yine de geçerli
  }
}

// 1499000 ms → "24:59"
export function formatTime(ms) {
  // ceil (yukarı yuvarla): başlattıktan 0.2 sn sonra hâlâ "25:00" yazsın,
  // tam 1 saniye geçince "24:59" olsun. Sona gelince de "00:00" sadece süre bitince görünür.
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
