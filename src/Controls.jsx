import { useEffect, useRef } from 'react';
import { createButtonsWorld } from './3dComponent/world/buttonsWorld.js';

// 3D butonlar (duraklat/devam et, sıfırla) için React köprüsü.
// Kendi küçük canvas'ı var, CSS ile süre yazısının altına yerleşiyor.
//
// İki yönlü haberleşme:
//   three.js → React: 3D butona basılınca onToggle / onReset çağrılır.
//   React → three.js: running değişince buttons.setRunning() ile butonun simgesi değişir.
export default function Controls({ running, onToggle, onReset }) {
  const mountRef = useRef(null);
  // Kurulan buton dünyasını saklıyoruz, sonraki effect'ler ona ulaşabilsin.
  const buttonsRef = useRef(null);

  // Butonları sadece bir kez kuruyoruz. Ama onToggle/onReset ileride değişebilir.
  // Dünyaya fonksiyonların kendisini değil, "ref'teki en güncel fonksiyonu çağır" diyen
  // küçük aracıları veriyoruz. Böylece dünyayı yeniden kurmadan hep günceli çağırıyoruz.
  const handlersRef = useRef({ onToggle, onReset });
  useEffect(() => {
    handlersRef.current = { onToggle, onReset };
  });

  useEffect(() => {
    const buttons = createButtonsWorld(mountRef.current, {
      onToggle: () => handlersRef.current.onToggle(),
      onReset: () => handlersRef.current.onReset(),
    });
    buttonsRef.current = buttons;

    return () => {
      buttons.dispose();
      buttonsRef.current = null;
    };
  }, []);

  // running her değiştiğinde butona bildir.
  // Bu effect yukarıdakinden SONRA tanımlandığı için, çalıştığında butonlar zaten kurulmuş olur.
  useEffect(() => {
    buttonsRef.current?.setRunning(running);
  }, [running]);

  return <div ref={mountRef} className="controls" />;
}
