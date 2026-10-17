import { useEffect, useRef } from 'react';
import { createWorld } from './3dComponent/world/world.js';

// React ile three.js arasındaki köprü: ana sahne (domates ve kaide).
//
// Kural: React sadece boş bir <div> verir. three.js kendi <canvas>'ını
// o div'in içine koyar ve içini kendisi çizer. React canvas'ın içine hiç karışmaz.
export default function Scene() {
  // useRef: render'lar arasında değişmeyen bir "kutu". .current içinde DOM elemanı olacak.
  const mountRef = useRef(null);

  useEffect(() => {
    // Bu fonksiyon bileşen ekrana yerleştikten SONRA çalışır,
    // yani mountRef.current artık gerçek bir <div>.
    const world = createWorld(mountRef.current);

    // Döndürülen fonksiyon "temizlik"tir: bileşen ekrandan kalkınca çalışır.
    // Development'ta StrictMode effect'i bilerek kur, sök, tekrar kur şeklinde çalıştırır.
    // Temizlik eksik olsaydı ekranda iki canvas ve iki animasyon döngüsü olurdu.
    return () => world.dispose();
  }, []); // [] = sadece bir kez kur (her render'da değil)

  return <div ref={mountRef} className="scene" />;
}
