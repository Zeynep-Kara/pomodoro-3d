import * as THREE from 'three';
import { colors } from '../colors.js';

// IŞIKLAR: MeshStandardMaterial ışık olmadan simsiyah görünür.
export function createLights() {
  // HemisphereLight: yukarıdan bir renk, aşağıdan başka bir renk gelen yumuşak ortam ışığı.
  // Gölgesiz bölgelerin tamamen kararmasını engeller.
  const hemiLight = new THREE.HemisphereLight(colors.skyLight, colors.bounceLight, 1.2);

  // DirectionalLight: güneş gibi, sonsuz uzaktan tek yönde gelen ışık.
  // Yüzlerin farklı tonlarda görünmesini sağlayan ışık bu.
  const sunLight = new THREE.DirectionalLight(colors.sunLight, 2);
  sunLight.position.set(3, 5, 4); // ışık bu noktadan merkeze doğru vurur
  sunLight.castShadow = true;
  // Gölge haritasının çözünürlüğü: büyük = keskin ama pahalı.
  sunLight.shadow.mapSize.set(1024, 1024);

  return {
    hemiLight,
    sunLight,

    dispose() {
      // Gölge yapan ışık, gölge haritasını GPU'da bir doku olarak tutar. Onu da serbest bırak.
      sunLight.dispose();
    },
  };
}
