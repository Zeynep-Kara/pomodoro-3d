// Sahnede kullanılan tüm renkler tek yerde.
// Bir rengi değiştirmek istediğinde sadece burayı değiştirmen yeterli.
export const colors = {
  // Arka plan. src/style.css'teki body rengiyle AYNI olmalı:
  // sis uzaktaki nesneleri bu renge karıştırıyor, farklı olursa ufukta bir çizgi belirir.
  background: '#f7d9c4',

  // Işıklar
  skyLight: '#ffffff', // HemisphereLight: yukarıdan gelen renk
  bounceLight: '#c98b6b', // HemisphereLight: aşağıdan (yerden yansıyan) renk
  sunLight: '#ffffff', // DirectionalLight

  // Domates karakteri
  tomato: '#e8513e',
  stem: '#4e8a3a', // sap
  leaf: '#6cbf4f', // yapraklar
  eyeWhite: '#ffffff', // gözün beyazı ve parlama noktası
  pupil: '#2b1d1a', // göz bebeği (saf siyah yerine çok koyu kahve, daha yumuşak durur)
  cheek: '#ff8f8f', // yanak allığı
  mouth: '#5a1f17', // ağız

  // Zemin
  podium: '#f3c5a8',

  // Butonlar: her butonun üst yüzü bir renk, yan yüzü (alttaki kalın şerit) aynı rengin koyusu.
  toggleButton: '#ffb547', // başlat / duraklat
  toggleButtonSide: '#d9861c',
  resetButton: '#4a9be0', // sıfırla
  resetButtonSide: '#2c76bb',
  buttonIcon: '#ffffff', // butonların üstündeki simgeler
};
