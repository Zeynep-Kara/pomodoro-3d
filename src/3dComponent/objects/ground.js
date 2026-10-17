import * as THREE from 'three';
import { colors } from '../colors.js';

// Zemin: domatesin üstünde durduğu yuvarlak bir kaide (oyuncak diorama gibi).
export function createGround() {
  // CylinderGeometry(üst yarıçap, alt yarıçap, yükseklik, dilim sayısı)
  // Üst ve alt yarıçap eşitse düz silindir, farklıysa koni gibi daralır.
  const height = 0.1;
  const geometry = new THREE.CylinderGeometry(3, 3, height, 64);
  const material = new THREE.MeshStandardMaterial({ color: colors.podium });
  const mesh = new THREE.Mesh(geometry, material);
  // Silindir zaten dik durur, CircleGeometry gibi yatırmaya gerek yok.
  // position silindirin ORTASIdır: üst yüzey = position.y + yükseklik / 2.
  // Domatesin alt noktası -0.85 (yarıçap 1 × basıklık 0.85), nefes alırken -0.9'a iniyor.
  // Domatesin kaideye oturması için üst yüzey -0.9 olmalı.
  mesh.position.y = -1.1;
  mesh.receiveShadow = true;

  return {
    object: mesh,

    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
