import * as THREE from 'three';

// RENDERER: sahneyi kameradan bakarak <canvas>'a çizen motor (WebGL).
export function createRenderer(width, height) {
  // antialias: kenarlardaki tırtıkları yumuşatır.
  // alpha: canvas arka planı şeffaf olur, CSS'teki arka plan rengi görünür.
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  // Retina ekranlar için daha fazla piksel çiz, ama 2'den fazlası boşuna yavaşlatır.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  // Gölgeleri aç. Hangi ışık gölge yapar, hangi nesne gölge düşürür/alır ayrıca söylenir.
  renderer.shadowMap.enabled = true;

  return renderer;
}
