import * as THREE from 'three';
import { colors } from '../colors.js';
import { createCamera, resizeCamera } from './camera.js';
import { createRenderer } from './renderer.js';
import { createLights } from './lights.js';
import { createTomato } from '../objects/tomato.js';
import { createGround } from '../objects/ground.js';

// Bu dosya React'ten tamamen bağımsız, düz JavaScript.
// Bir DOM elemanı alır, içine 3D bir dünya kurar ve
// geri sökmek için bir dispose() fonksiyonu döndürür.
//
// Burası ana sahne (domates ve kaide). Parçaların kendisi ayrı dosyalarda:
//   world/   → kamera, renderer, ışıklar (ortam)
//   objects/ → domates, zemin (sahnedeki nesneler)
// Butonların kendi küçük sahnesi var: world/buttonsWorld.js
export function createWorld(container) {
  // Çizim alanının boyutu: window'un değil, bize verilen div'in boyutu.
  let width = container.clientWidth;
  let height = container.clientHeight;

  // ───────────────────────────────────────────────
  // 1) SAHNE: her şeyin içine konduğu dünya.
  // ───────────────────────────────────────────────
  const scene = new THREE.Scene();
  // Sis: uzaktaki nesneleri arka plan rengine doğru soldurur, derinlik hissi verir.
  // (renk, sisin başladığı mesafe, tamamen kapladığı mesafe)
  scene.fog = new THREE.Fog(colors.background, 8, 20);

  // ───────────────────────────────────────────────
  // 2) ORTAM: kamera, renderer, ışıklar
  // ───────────────────────────────────────────────
  const camera = createCamera(width, height);

  const renderer = createRenderer(width, height);
  // renderer.domElement = three.js'in oluşturduğu <canvas>. DOM'a biz ekliyoruz.
  container.appendChild(renderer.domElement);

  const lights = createLights();
  scene.add(lights.hemiLight, lights.sunLight);

  // ───────────────────────────────────────────────
  // 3) NESNELER: her biri objects/ altındaki kendi dosyasında kuruluyor.
  // ───────────────────────────────────────────────
  // Her nesne { object, dispose() } döndürür. Hareket edenlerde bir de update() var.
  // object: sahneye eklenecek şey. Tek bir Mesh de olabilir (zemin),
  // birçok parçadan oluşan bir Group da (domates).
  const tomato = createTomato();
  scene.add(tomato.object);

  const ground = createGround();
  scene.add(ground.object);

  // ───────────────────────────────────────────────
  // 4) RENDER DÖNGÜSÜ
  // ───────────────────────────────────────────────
  // requestAnimationFrame(fn): tarayıcı bir sonraki kareyi çizmeden hemen önce fn'i çağırır.
  // 60Hz ekranda saniyede ~60, 120Hz ekranda ~120 kez.
  // Bu yüzden hareketi "kare başına" değil "saniye başına" tanımlıyoruz (delta time).
  let frameId = 0;
  let lastTime = performance.now(); // milisaniye
  let elapsed = 0; // başlangıçtan beri geçen toplam süre (saniye)

  function tick(now) {
    // dt: bir önceki kareden bu yana geçen süre, saniye cinsinden.
    // Sekme arka plandayken döngü durur. Geri dönünce dev bir dt gelmesin diye sınırlıyoruz.
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    elapsed += dt;

    // Nesnelerin kendi hareketleri (dönme, nefes alma) kendi dosyalarında.
    tomato.update(dt, elapsed);

    renderer.render(scene, camera); // asıl çizim burada
    frameId = requestAnimationFrame(tick); // bir sonraki kareyi iste
  }
  frameId = requestAnimationFrame(tick);

  // ───────────────────────────────────────────────
  // 5) BOYUT DEĞİŞİMİ
  // ───────────────────────────────────────────────
  // ResizeObserver, window.resize'dan iyidir: div'in boyutu pencere değişmeden de
  // değişebilir (ör. yanında bir panel açılırsa). Biz doğrudan div'i izliyoruz.
  const resizeObserver = new ResizeObserver(() => {
    width = container.clientWidth;
    height = container.clientHeight;
    resizeCamera(camera, width, height);
    renderer.setSize(width, height);
  });
  resizeObserver.observe(container);

  // ───────────────────────────────────────────────
  // 6) TEMİZLİK
  // ───────────────────────────────────────────────
  // GPU'ya yüklenen geometry ve material'lar JavaScript'in çöp toplayıcısıyla silinmez.
  // Onları elle dispose() etmezsek her yeniden kurulumda GPU belleği şişer.
  return {
    dispose() {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      tomato.dispose();
      ground.dispose();
      lights.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
