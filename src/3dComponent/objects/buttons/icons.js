import * as THREE from 'three';

// Butonların üstündeki simgeler. Hepsi yatay duruyor (xz düzleminde), kalınlıkları y ekseninde.
// Kamera önden-yukarıdan baktığı için +x ekranın sağı, +z ekranın altı (bize yakın taraf).
//
// Her fonksiyon bir malzeme alır ve bir Group döndürür. Boyutlar küçük tutuldu,
// button.js simgeyi butonun boyutuna göre büyütüyor.

export const ICON_HEIGHT = 0.04;

export const ICON_BUILDERS = {
  // ▶ Üçgen: 3 dilimli bir silindir aslında üçgen bir prizmadır!
  play(material) {
    const icon = new THREE.Group();
    const triangle = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, ICON_HEIGHT, 3), material);
    // İlk köşe +z'de (bize doğru) oluşur. 90° çevirince sağı (+x) gösterir.
    triangle.rotation.y = Math.PI / 2;
    // Üçgenin ağırlık merkezi sağ uca yakın, sola kaydırınca göze ortalı görünür.
    triangle.position.x = -0.03;
    icon.add(triangle);
    return icon;
  },

  // ⏸ İki dikey çubuk
  pause(material) {
    const icon = new THREE.Group();
    const barGeometry = new THREE.BoxGeometry(0.075, ICON_HEIGHT, 0.24);
    for (const x of [-0.065, 0.065]) {
      const bar = new THREE.Mesh(barGeometry, material);
      bar.position.x = x;
      icon.add(bar);
    }
    return icon;
  },

  // ↺ Ucunda ok olan, 3/4'lük bir halka
  reset(material) {
    const icon = new THREE.Group();
    // TorusGeometry(yarıçap, tüp kalınlığı, tüp dilimi, halka dilimi, yay açısı)
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.03, 8, 32, Math.PI * 1.5), material);
    arc.rotation.x = -Math.PI / 2; // halka dik oluşur, yatırıyoruz
    icon.add(arc);

    // Ok ucu: yayın bittiği yerde, küçük bir üçgen.
    const arrowHead = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, ICON_HEIGHT, 3), material);
    arrowHead.rotation.y = Math.PI / 2;
    arrowHead.position.set(0.03, 0, 0.13);
    icon.add(arrowHead);

    // Bütün simgeyi 180° çevir: ok ucu üste gelsin, sola baksın (saat yönünün tersine ↺).
    icon.rotation.y = Math.PI;
    return icon;
  },
};
