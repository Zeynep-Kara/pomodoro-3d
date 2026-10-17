import * as THREE from 'three';
import { colors } from '../colors.js';

// Domates karakteri: kendi şeklini, malzemesini ve hareketini bilir.
// world.js onu sahneye ekler ve her karede update()'ini çağırır.
//
// Scene graph (ağaç yapısı):
//
//   tomato (Group)        ← hareket burada: salınma ve nefes alma
//   ├── body (Mesh)       ← basık gövde
//   ├── face (Group)      ← gözler, yanaklar, ağız
//   └── top (Group)       ← sap ve yapraklar
//
// Çocuklar ebeveynin konumunu ve dönüşünü miras alır.
// tomato'yu döndürünce yüzü ve yaprakları da onunla birlikte döner.

// Gövdenin basıklığı (y ekseni ölçeği). Yüzü ve yaprakları yerleştirirken de lazım.
const BODY_SQUASH = 0.85;

export function createTomato() {
  // ───────────────────────────────────────────────
  // MALZEMELER: aynı malzemeyi birden çok parça paylaşabilir (iki göz, iki yaprak...).
  // ───────────────────────────────────────────────
  // MeshPhysicalMaterial = MeshStandardMaterial + ekstra özellikler (clearcoat, sheen...).
  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: colors.tomato,
    roughness: 0.5, // 0 = ayna gibi parlak, 1 = tamamen mat
  });
  const stemMaterial = new THREE.MeshStandardMaterial({ color: colors.stem, roughness: 0.8 });
  const leafMaterial = new THREE.MeshStandardMaterial({ color: colors.leaf, roughness: 0.7 });
  const eyeWhiteMaterial = new THREE.MeshStandardMaterial({ color: colors.eyeWhite, roughness: 0.3 });
  const pupilMaterial = new THREE.MeshStandardMaterial({ color: colors.pupil, roughness: 0.3 });
  // Gözdeki parlama noktası ışıktan etkilenmesin, hep bembeyaz parlasın: MeshBasicMaterial.
  const shineMaterial = new THREE.MeshBasicMaterial({ color: colors.eyeWhite });
  const cheekMaterial = new THREE.MeshStandardMaterial({ color: colors.cheek, roughness: 1 });
  const mouthMaterial = new THREE.MeshStandardMaterial({ color: colors.mouth, roughness: 0.8 });

  // Kök: karakterin tamamı. Group görünmez bir kutudur, sadece çocuklarını taşır.
  const tomato = new THREE.Group();

  // ───────────────────────────────────────────────
  // GÖVDE
  // ───────────────────────────────────────────────
  // SphereGeometry(yarıçap, yatay dilim, dikey dilim): pürüzsüz bir küre.
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), bodyMaterial);
  // Domatesler tam yuvarlak değil, biraz basık: y ekseninde küçült.
  // DİKKAT: ölçek de çocuklara miras kalır. Gözleri body'nin çocuğu yapsaydık
  // onlar da basılırdı. Bu yüzden yüz ve yapraklar body'nin değil tomato'nun çocuğu.
  body.scale.set(1, BODY_SQUASH, 1);
  tomato.add(body);

  // ───────────────────────────────────────────────
  // YÜZ
  // ───────────────────────────────────────────────
  const face = new THREE.Group();
  tomato.add(face);

  // İki göz: aynı fonksiyon, sadece x'in işareti farklı (sol = eksi, sağ = artı).
  for (const side of [-1, 1]) {
    const eye = createEye(eyeWhiteMaterial, pupilMaterial, shineMaterial);
    placeOnSurface(eye, side * 0.33, 0.15, -0.03);
    face.add(eye);

    // Yanak allığı: gözlerin biraz dışında ve altında, yassı pembe bir leke.
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 12), cheekMaterial);
    cheek.scale.set(1, 0.6, 0.3);
    placeOnSurface(cheek, side * 0.55, -0.08, -0.01);
    face.add(cheek);
  }

  // Ağız: küçük bir gülümseme.
  // TorusGeometry(yarıçap, tüp kalınlığı, tüp dilimi, halka dilimi, yay açısı)
  // Yay açısı Math.PI = yarım halka. Yukarı bakan bir yay (∩) olarak oluşur,
  // z ekseninde 180° çevirince gülümsemeye (∪) dönüşür.
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.018, 8, 24, Math.PI), mouthMaterial);
  placeOnSurface(mouth, 0, -0.1, -0.005);
  mouth.rotation.z = Math.PI;
  face.add(mouth);

  // ───────────────────────────────────────────────
  // SAP VE YAPRAKLAR
  // ───────────────────────────────────────────────
  // Bu grubu gövdenin tepesine koyuyoruz. İçindekiler artık "tepeye göre" konumlanıyor:
  // sapın y = 0.1'i, dünyada değil tepenin 0.1 üstü demek (yerel koordinat).
  const top = new THREE.Group();
  top.position.y = BODY_SQUASH;
  tomato.add(top);

  // Sap: aşağısı biraz kalın, hafif yana yatık kısa bir silindir.
  // CylinderGeometry(üst yarıçap, alt yarıçap, yükseklik, dilim sayısı)
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.07, 0.28, 16), stemMaterial);
  stem.position.y = 0.1;
  stem.rotation.z = 0.2;
  top.add(stem);

  // İki yaprak: biri sağ-öne, biri sol-öne uzanıyor (V şeklinde, perçem gibi).
  // Kamera alçakta, yana uzanan yassı yapraklar önden ince bir çizgi gibi görünürdü.
  // Öne doğru sarkınca üst yüzleri kameraya dönüyor.
  // Yaprağın şekli: iyice yassılaştırılmış bir küre. İki yaprak aynı geometry'yi paylaşıyor.
  const leafGeometry = new THREE.SphereGeometry(1, 32, 16);
  for (const angle of [-0.6, Math.PI + 0.6]) {
    // pivot: yaprağı tepenin etrafında döndürmek için bir menteşe.
    // Önce yaprağı +x yönünde kur, sonra pivot'u y ekseninde çevirip istediğin yöne bak.
    const pivot = new THREE.Group();
    pivot.rotation.y = angle;
    top.add(pivot);

    const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
    leaf.scale.set(0.36, 0.045, 0.16); // uzun, ince, yassı
    leaf.position.set(0.32, -0.02, 0); // merkezi saptan 0.32 dışarıda
    leaf.rotation.z = -0.35; // ucu aşağı sarksın, gövdenin eğimini takip etsin
    pivot.add(leaf);
  }

  // Tüm parçalar gölge düşürsün. traverse(): ağaçtaki her nesneyi tek tek gezer.
  tomato.traverse((child) => {
    if (child.isMesh) child.castShadow = true;
  });

  return {
    object: tomato,

    // dt: bir önceki kareden bu yana geçen süre, elapsed: başlangıçtan beri geçen süre (saniye).
    update(dt, elapsed) {
      // Sürekli dönmek yerine sağa sola hafifçe salınıyor, böylece yüzü hep bize dönük kalıyor.
      // sin(t) -1 ile 1 arasında gider gelir: 0.35 radyan ≈ 20° sağa, 20° sola.
      tomato.rotation.y = Math.sin(elapsed * 0.8) * 0.35;

      // Küçük bir "nefes alma" hareketi. Bunu ileride karakterin durumlarına bağlayacağız.
      tomato.position.y = Math.sin(elapsed * 2) * 0.05;
    },

    // GPU'ya yüklenen tüm geometry ve material'ları serbest bırak.
    // Paylaşılan bir material iki kez dispose edilirse sorun olmaz.
    dispose() {
      tomato.traverse((child) => {
        if (child.isMesh) {
          child.geometry.dispose();
          child.material.dispose();
        }
      });
    },
  };
}

// Bir göz: beyaz, göz bebeği ve parlama noktası.
// Yerel koordinatta +z gözün baktığı yön (dışarısı).
function createEye(whiteMaterial, pupilMaterial, shineMaterial) {
  const eye = new THREE.Group();

  // Beyazı: biraz uzun (y), önden arkaya yassı (z) bir oval.
  const white = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 16), whiteMaterial);
  white.scale.set(1, 1.15, 0.5);
  eye.add(white);

  // Göz bebeği: beyazın biraz önünde, yarısı beyazın içine gömülü.
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 16), pupilMaterial);
  pupil.scale.set(1, 1.15, 0.5);
  pupil.position.set(0, -0.02, 0.06);
  eye.add(pupil);

  // Parlama noktası: gözü "canlı" ve sevimli gösteren küçük beyaz nokta.
  const shine = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 8), shineMaterial);
  shine.scale.set(1, 1, 0.5);
  shine.position.set(0.04, 0.05, 0.115);
  eye.add(shine);

  return eye;
}

// Bir parçayı gövdenin ön yüzeyine yerleştirir ve yüzeye dik bakacak şekilde çevirir.
// x, y: yüzeydeki konum. inset: yüzeyden ne kadar içeri gömülsün (eksi = içeri).
function placeOnSurface(object, x, y, inset) {
  // Gövde basık bir küre (elipsoid): x² + (y / 0.85)² + z² = 1
  // x ve y'yi biliyoruz, z'yi buradan çözüyoruz: yüzeyin o noktadaki derinliği.
  const z = Math.sqrt(1 - x * x - (y / BODY_SQUASH) ** 2);
  object.position.set(x, y, z + inset);

  // Yüzey o noktada yana ve yukarı/aşağı eğik. Parçayı da aynı açıyla çeviriyoruz.
  // Math.atan2(karşı, komşu): iki kenardan açıyı bulur (radyan).
  object.rotation.y = Math.atan2(x, z);
  object.rotation.x = -Math.atan2(y / BODY_SQUASH, z);
}
