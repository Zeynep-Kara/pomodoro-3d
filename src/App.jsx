import { useEffect } from 'react';
import Scene from './Scene.jsx';
import Controls from './Controls.jsx';
import Settings from './Settings.jsx';
import { usePomodoro, formatTime } from './pomodoro/usePomodoro.js';

// Etikette yazacak metin. Anahtar aynı zamanda CSS sınıfının sonu: .hud-mode--work, --break, --paused
const STATUS_LABELS = {
  work: 'Odaklanma',
  break: 'Mola',
  paused: 'Duraklatıldı',
};

export default function App() {
  const timer = usePomodoro();
  const time = formatTime(timer.remainingMs);
  // Duraklatıldıysa bunu göster, değilse hangi moddaysak onu (odaklanma ya da mola).
  const status = timer.paused ? 'paused' : timer.mode;

  // Klavye kısayolları. 3D butonlara ekran okuyucu ya da klavyeyle ulaşılamaz,
  // bu yüzden aynı işleri klavyeden de yapabilmek önemli.
  useEffect(() => {
    function onKeyDown(event) {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      // Kullanıcı bir alana yazı yazıyorsa ya da bir butonun üstündeyse kısayollar devreye girmesin:
      // ayarlarda "R" yazınca süre sıfırlanmasın, butondayken Boşluk o butona bassın.
      if (event.target.closest?.('input, textarea, select, button, [role="dialog"]')) return;
      if (event.code === 'Space') {
        event.preventDefault(); // boşluk tuşu sayfayı kaydırmasın
        timer.toggle();
      } else if (event.code === 'KeyR') {
        timer.reset();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [timer.toggle, timer.reset]);

  // Sekme başlığında da kalan süre görünsün: başka sekmedeyken bile takip edebilirsin.
  useEffect(() => {
    document.title = `${time} · ${STATUS_LABELS[status]}`;
  }, [time, status]);

  return (
    <div className="app">
      <Scene />

      {/* Ana sahnenin üstünde duran yazılar ve butonlar. */}
      <div className="hud">
        <div className={`hud-mode hud-mode--${status}`}>{STATUS_LABELS[status]}</div>
        {/* role="timer": ekran okuyuculara bunun bir zamanlayıcı olduğunu söyler. */}
        <div className="hud-time" role="timer">
          {time}
        </div>
        {/* 3D butonlar: kendi küçük canvas'larında, sürenin hemen altında. */}
        <Controls running={timer.running} onToggle={timer.toggle} onReset={timer.reset} />
      </div>

      <Settings settings={timer.settings} started={timer.started} onSave={timer.updateSettings} />

      <p className="hint">Boşluk: başlat / duraklat · R: sıfırla</p>
    </div>
  );
}
