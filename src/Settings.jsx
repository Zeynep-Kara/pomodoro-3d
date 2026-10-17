import { useEffect, useRef, useState } from 'react';
import { MIN_MINUTES, MAX_MINUTES, isValidMinutes } from './pomodoro/usePomodoro.js';

// Sağ üstteki ayarlar butonu ve açılan panel.
// Kullanıcı çalışma ve mola süresini dakika olarak giriyor.
//
// Bu bir 3D obje değil, düz HTML: form alanlarına (input) yazı yazmak, Tab ile gezmek,
// ekran okuyucuyla kullanmak HTML'de hazır geliyor. Görünüşünü CSS ile 3D tuşlara benzettik.
export default function Settings({ settings, started, onSave }) {
  const [open, setOpen] = useState(false);
  // Form alanlarının değerleri. Kullanıcı yazarken "2" gibi yarım değerler olabilir,
  // bu yüzden metin olarak tutuyoruz ve sadece Kaydet'e basınca sayıya çeviriyoruz.
  const [workText, setWorkText] = useState('');
  const [breakText, setBreakText] = useState('');

  const rootRef = useRef(null);
  const firstInputRef = useRef(null);

  function openPanel() {
    // Panel her açıldığında güncel ayarlarla başlasın (önceki yarım yazılanlar kalmasın).
    setWorkText(String(settings.workMinutes));
    setBreakText(String(settings.breakMinutes));
    setOpen(true);
  }

  // Panel açıkken: ilk alana odaklan, Escape ya da dışarı tıklama paneli kapatsın.
  useEffect(() => {
    if (!open) return;
    firstInputRef.current?.select();

    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    function onPointerDown(event) {
      if (!rootRef.current.contains(event.target)) setOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  function handleSubmit(event) {
    event.preventDefault(); // formun sayfayı yenilemesini engelle
    const next = { workMinutes: Number(workText), breakMinutes: Number(breakText) };
    // Tarayıcı min/max/required ile zaten kontrol ediyor, bu ikinci bir güvenlik.
    if (!isValidMinutes(next.workMinutes) || !isValidMinutes(next.breakMinutes)) return;
    onSave(next);
    setOpen(false);
  }

  return (
    <div className="settings" ref={rootRef}>
      <button
        type="button"
        className="key-button key-button--light settings-toggle"
        aria-label="Ayarlar"
        aria-expanded={open}
        aria-controls="settings-panel"
        onClick={() => (open ? setOpen(false) : openPanel())}
      >
        <GearIcon />
      </button>

      {open && (
        <form
          id="settings-panel"
          className="settings-panel"
          role="dialog"
          aria-label="Ayarlar"
          onSubmit={handleSubmit}
        >
          <h2>Ayarlar</h2>

          <label className="settings-field">
            <span>Çalışma süresi</span>
            <span className="settings-input">
              <input
                ref={firstInputRef}
                type="number"
                inputMode="numeric"
                min={MIN_MINUTES}
                max={MAX_MINUTES}
                step={1}
                required
                value={workText}
                onChange={(event) => setWorkText(event.target.value)}
              />
              dk
            </span>
          </label>

          <label className="settings-field">
            <span>Mola süresi</span>
            <span className="settings-input">
              <input
                type="number"
                inputMode="numeric"
                min={MIN_MINUTES}
                max={MAX_MINUTES}
                step={1}
                required
                value={breakText}
                onChange={(event) => setBreakText(event.target.value)}
              />
              dk
            </span>
          </label>

          <p className="settings-note">
            Çalışma bitince mola otomatik başlar.
            {started && ' Yeni süreler şu anki tur bitince geçerli olur.'}
          </p>

          <div className="settings-actions">
            <button type="button" className="key-button key-button--light" onClick={() => setOpen(false)}>
              Vazgeç
            </button>
            <button type="submit" className="key-button">
              Kaydet
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// Basit bir dişli: ortada bir daire, etrafında 8 diş, ortasında delik.
function GearIcon() {
  const teeth = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <g fill="currentColor">
        {teeth.map((angle) => (
          <rect key={angle} x="9.75" y="1.5" width="4.5" height="5" rx="1.2" transform={`rotate(${angle} 12 12)`} />
        ))}
        <circle cx="12" cy="12" r="7.2" />
      </g>
      <circle className="gear-hole" cx="12" cy="12" r="2.8" />
    </svg>
  );
}
