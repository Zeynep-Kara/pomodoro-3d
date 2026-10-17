import * as THREE from 'three';

// Geniş ekranda sahne ekran genişliğinin bu oranı kadar sağa kayar, solda süre yazısına yer açılır.
// Dar ekranda (telefon) yazı üstte durduğu için kaydırmıyoruz.
// DİKKAT: bu eşik src/style.css'teki @media (min-width: 700px) ile AYNI olmalı.
const WIDE_SCREEN = 700;
const SHIFT_RIGHT = 0.15;

// Normal görüş açısı (dikey, derece).
const BASE_FOV = 45;
// Ekran bundan daha dar/uzunsa (genişlik / yükseklik < 0.9, ör. dik tutulan telefon)
// görüş açısını büyütüyoruz ki butonlar kenarlardan kesilmesin.
const MIN_ASPECT = 0.9;

// KAMERA: dünyaya nereden baktığımız.
export function createCamera(width, height) {
  // PerspectiveCamera(fov, aspect, near, far)
  //   fov:    dikey görüş açısı (derece). Küçük = zoom, büyük = balık gözü.
  //   aspect: genişlik / yükseklik. Yanlış olursa görüntü esner.
  //   near/far: kameraya bu iki mesafe arasındaki şeyler çizilir.
  const camera = new THREE.PerspectiveCamera(BASE_FOV, width / height, 0.1, 100);
  // three.js'te y yukarı, x sağa, z ekrandan sana doğru.
  // Kamerayı biraz geri (z) ve biraz yukarı (y) alıyoruz.
  camera.position.set(0, 1, 6);
  // Kameranın yüzünü dünyanın merkezine çevir.
  camera.lookAt(0, 0, 0);

  resizeCamera(camera, width, height);
  return camera;
}

// Çizim alanının boyutu değişince çağrılır (world.js'teki ResizeObserver'dan).
export function resizeCamera(camera, width, height) {
  const aspect = width / height;
  camera.aspect = aspect;

  // fov DİKEY görüş açısıdır. Yatayda ne kadar göreceğimiz ekranın genişliğine bağlı:
  // ekran daraldıkça yatay görüş daralır ve kenardaki butonlar kesilir.
  // Çözüm: dar ekranda dikey açıyı, yatay görüş MIN_ASPECT'teki kadar kalacak şekilde büyüt.
  // tan(açının yarısı) görüş alanının genişliğiyle doğru orantılıdır, hesabı bu yüzden tan ile yapıyoruz.
  if (aspect < MIN_ASPECT) {
    const halfFov = THREE.MathUtils.degToRad(BASE_FOV / 2);
    const widenedHalfFov = Math.atan((Math.tan(halfFov) * MIN_ASPECT) / aspect);
    camera.fov = THREE.MathUtils.radToDeg(widenedHalfFov * 2);
  } else {
    camera.fov = BASE_FOV;
  }

  // Sahneyi sağa kaydırmak: kamerayı ya da nesneleri taşımak yerine "görüntüyü" kaydırıyoruz.
  // setViewOffset(tam genişlik, tam yükseklik, x kayması, y kayması, genişlik, yükseklik)
  // Büyük bir fotoğrafın içinden hangi parçayı göstereceğimizi seçmek gibi düşün.
  // x kayması eksi = pencere sola kayar, yani içerik ekranda sağa gider.
  // Kamerayı yana taşısaydık domatese yandan bakardık; bu yöntemde perspektif hiç değişmiyor.
  const shift = width >= WIDE_SCREEN ? SHIFT_RIGHT : 0;
  camera.setViewOffset(width, height, -width * shift, 0, width, height);

  camera.updateProjectionMatrix(); // kamera ayarı değişince bunu çağırmak ZORUNLU
}
