import * as THREE from 'three';
import { colors } from '../colors.js';
import { createRenderer } from './renderer.js';
import { createPointer } from './pointer.js';
import { createToggleButton } from '../objects/buttons/toggleButton.js';
import { createResetButton } from '../objects/buttons/resetButton.js';
import { BUTTON_WIDTH, BUTTON_DEPTH } from '../objects/buttons/button.js';

// Butonlar için küçük, ayrı bir 3D dünya.
//
// Neden ana sahneye koymuyoruz? Butonlar süre yazısının hemen altında, sayfa düzeninin
// (HTML/CSS) bir parçası olarak durmalı. Ana sahnenin içinde olsalardı yazının nerede
// durduğunu bilmeleri gerekirdi. Bunun yerine butonlara kendi küçük <canvas>'larını veriyoruz;
// o canvas'ı CSS ile istediğimiz yere koyuyoruz.
//
// Dünya zamanlayıcının nasıl çalıştığını bilmez. Sadece butonlara basılınca haber verir
// (onToggle, onReset) ve dışarıdan ne göstermesi gerektiği söylenir (setRunning).

const GAP = 0.35; // iki buton arasındaki boşluk

// BUTONLARIN DURUŞU
// button.js butonu masaya konmuş gibi yatay kuruyor: yüzü yukarı (+y) bakıyor.
// Kamera tam önden (+z'den) bakıyor. Butonu üç adımda kameraya çeviriyoruz:
const STAND_UP = Math.PI / 2; // 1) x ekseninde 90°: yatay buton dikilir, yüzü bize bakar.
const TILT_DOWN = THREE.MathUtils.degToRad(14); // 2) x ekseninde biraz daha: yüz aşağı eğilir → ÜST kenar görünür.
const TURN_RIGHT = THREE.MathUtils.degToRad(-5); // 3) y ekseninde: yüz sağa döner → SOL kenar görünür.
// İki açıyı da büyütürsen kenarlar kalınlaşır, 0 yaparsan buton dümdüz bize bakar.

export function createButtonsWorld(container, { onToggle, onReset } = {}) {
  let width = container.clientWidth;
  let height = container.clientHeight;

  const scene = new THREE.Scene();

  // ───────────────────────────────────────────────
  // KAMERA: OrthographicCamera (dik izdüşüm)
  // ───────────────────────────────────────────────
  // PerspectiveCamera'da uzaktaki şeyler küçük görünür. OrthographicCamera'da uzaklık
  // boyutu değiştirmez: bir kutunun içini görüntüler gibi. Simgeler ve arayüzler için ideal,
  // iki buton da birebir aynı boyda ve şekilde görünür.
  // Kutunun boyutunu (left, right, top, bottom) aşağıda fitCamera() ayarlıyor.
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50);
  // Butonlara tam önden bak. Eğimi kamerayla değil, butonları döndürerek veriyoruz (aşağıda).
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);

  // Butonların kapladığı alan (dünya biriminde), görünen kenarlar ve hover büyümesi için pay bırakarak.
  // Butonlar dik durduğu için ekrandaki yükseklikleri BUTTON_DEPTH kadar.
  const contentWidth = (2 * BUTTON_WIDTH + GAP) * 1.12;
  const contentHeight = BUTTON_DEPTH * 1.4;

  // Canvas'ın oranı ne olursa olsun butonların tamamı sığsın, oranlar da bozulmasın.
  function fitCamera() {
    const aspect = width / height;
    let halfHeight = contentHeight / 2;
    let halfWidth = halfHeight * aspect;
    if (halfWidth < contentWidth / 2) {
      // Genişlik sığmıyor: genişliğe göre ayarla, yüksekliği ondan hesapla.
      halfWidth = contentWidth / 2;
      halfHeight = halfWidth / aspect;
    }
    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
  }
  fitCamera();

  // ───────────────────────────────────────────────
  // RENDERER VE IŞIK
  // ───────────────────────────────────────────────
  const renderer = createRenderer(width, height);
  container.appendChild(renderer.domElement);

  // Burada zemin yok, gölgeye gerek yok. Sadece her yöne eşit bir ortam ışığı ve bir güneş.
  // (HemisphereLight burada işe yaramıyor: butonların yüzü yukarı değil bize baktığı için
  // gökyüzü renginin yarısını, yerin kahverengisinin yarısını alıp matlaşıyordu.)
  const ambientLight = new THREE.AmbientLight(colors.skyLight, 1.3);
  const sunLight = new THREE.DirectionalLight(colors.sunLight, 1.8);
  sunLight.position.set(-2, 3, 8); // sol-üst-önden: yüzler parlak, üst ve sol kenarlar da ışık alsın
  scene.add(ambientLight, sunLight);

  // ───────────────────────────────────────────────
  // BUTONLAR
  // ───────────────────────────────────────────────
  const toggleButton = createToggleButton(onToggle);
  toggleButton.object.position.x = -(BUTTON_WIDTH + GAP) / 2;

  const resetButton = createResetButton(onReset);
  resetButton.object.position.x = (BUTTON_WIDTH + GAP) / 2;

  const buttons = [toggleButton, resetButton];
  for (const button of buttons) {
    // DÖNDÜRME: rotation.set(x açısı, y açısı, z açısı, sıra)
    // Açılar radyan. Sıra önemli: 'YXZ' = önce x'te dik (STAND_UP + TILT_DOWN), sonra y'de sağa çevir.
    // Varsayılan sıra 'XYZ' olsaydı önce y'de çevirip sonra x'te dikerdi; buton yan yatmış gibi dururdu.
    button.object.rotation.set(STAND_UP + TILT_DOWN, TURN_RIGHT, 0, 'YXZ');
    scene.add(button.object);
  }

  // Fareyle butonlara tıklayabilmek için. pointer.js her kamerayla çalışıyor.
  const pointer = createPointer(renderer.domElement, camera, buttons);

  // ───────────────────────────────────────────────
  // RENDER DÖNGÜSÜ
  // ───────────────────────────────────────────────
  let frameId = 0;
  let lastTime = performance.now();

  function tick(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    for (const button of buttons) button.update(dt);

    renderer.render(scene, camera);
    frameId = requestAnimationFrame(tick);
  }
  frameId = requestAnimationFrame(tick);

  // ───────────────────────────────────────────────
  // BOYUT DEĞİŞİMİ
  // ───────────────────────────────────────────────
  const resizeObserver = new ResizeObserver(() => {
    width = container.clientWidth;
    height = container.clientHeight;
    fitCamera();
    renderer.setSize(width, height);
  });
  resizeObserver.observe(container);

  // ───────────────────────────────────────────────
  // DIŞARIYA AÇILAN KAPI VE TEMİZLİK
  // ───────────────────────────────────────────────
  return {
    // Zamanlayıcı çalışıyorsa ⏸ (duraklat), duruyorsa ▶ (devam et) görünsün.
    setRunning(running) {
      toggleButton.setIcon(running ? 'pause' : 'play');
    },

    dispose() {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      pointer.dispose();
      for (const button of buttons) button.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
