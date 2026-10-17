import * as THREE from 'three';
import { colors } from '../../colors.js';
import { ICON_BUILDERS, ICON_HEIGHT } from './icons.js';

// Köşeleri yuvarlatılmış, klavye tuşu gibi kalın bir buton.
// Önden-yukarıdan bakınca üst yüzü renkli, altında koyu renkli kalın bir şerit görünür.
// Basınca şerit incelir, yani buton içeri gömülür.
//
//   button (Group)    ← üstüne gelince hafifçe büyür
//   ├── body (Mesh)   ← koyu renkli gövde (şerit). Basınca y'de basılır.
//   └── cap (Group)   ← renkli üst kapak, gövdenin hep üstünde durur
//       ├── capMesh
//       └── simgeler (play, pause, reset...) → aynı anda sadece biri görünür
//
// color: üst yüzün rengi, sideColor: gövdenin (şeridin) rengi.
// icons: bu butonun gösterebileceği simgeler, ör. ['play', 'pause'].
// onPress: basılınca çağrılacak fonksiyon.

export const BUTTON_WIDTH = 1.6; // x
export const BUTTON_DEPTH = 1.0; // z (önden arkaya)
const CORNER_RADIUS = 0.28;
const BODY_HEIGHT = 0.18;
const CAP_HEIGHT = 0.06;
const BEVEL = 0.03; // kenarları yumuşatan pah (aşağıya bak)
const ICON_SCALE = 1.8;
const PRESSED_BODY_SCALE = 0.3; // basınca gövde yüksekliğinin %30'una iner

export function createButton({ color, sideColor, icons, onPress }) {
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: sideColor, roughness: 0.6 });
  const capMaterial = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
  const iconMaterial = new THREE.MeshStandardMaterial({ color: colors.buttonIcon, roughness: 0.4 });

  const button = new THREE.Group();

  // Gövde ve kapak aynı yuvarlak dikdörtgen tabandan çıkıyor, sadece kalınlıkları farklı.
  const bodyGeometry = createRoundedSlab(BODY_HEIGHT);
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  button.add(body);
  const bodyTop = BODY_HEIGHT + 2 * BEVEL; // pah iki yandan da kalınlık ekliyor

  const cap = new THREE.Group();
  cap.position.y = bodyTop;
  button.add(cap);

  const capMesh = new THREE.Mesh(createRoundedSlab(CAP_HEIGHT), capMaterial);
  cap.add(capMesh);
  const capTop = CAP_HEIGHT + 2 * BEVEL;

  // Simgeler kapağın üst yüzeyine oturuyor.
  const iconGroups = {};
  for (const name of icons) {
    const icon = ICON_BUILDERS[name](iconMaterial);
    icon.scale.setScalar(ICON_SCALE);
    icon.position.y = capTop + (ICON_HEIGHT * ICON_SCALE) / 2;
    cap.add(icon);
    iconGroups[name] = icon;
  }

  // Animasyon durumu
  let hovered = false;
  let pressAmount = 0; // basınca 1 olur, sonra 0'a doğru azalır

  const api = {
    object: button,

    setHovered(value) {
      hovered = value;
    },

    press() {
      pressAmount = 1;
      onPress?.(); // ?. = onPress verilmediyse hiçbir şey yapma
    },

    // Sadece istenen simge görünsün, diğerleri gizlensin.
    setIcon(name) {
      for (const [key, icon] of Object.entries(iconGroups)) {
        icon.visible = key === name;
      }
    },

    update(dt) {
      // Üstüne gelince %5 büyü. Hedefe her karede biraz yaklaş (lerp): yumuşak geçiş.
      const targetScale = hovered ? 1.05 : 1;
      const s = button.scale.x + (targetScale - button.scale.x) * Math.min(1, dt * 12);
      button.scale.setScalar(s);

      // Basma: pressAmount 1'den 0'a ~0.2 saniyede iner.
      // sin(π · a) bu sırada 0 → 1 → 0 yapar: gövde basılır ve geri kalkar.
      pressAmount = Math.max(0, pressAmount - dt * 5);
      const squash = 1 - (1 - PRESSED_BODY_SCALE) * Math.sin(Math.PI * pressAmount);
      // Gövdenin geometrisi tabanı y = 0'da olacak şekilde kurulu,
      // bu yüzden y'de ölçekleyince yukarıdan aşağı basılıyor (tabanı yerinde kalıyor).
      body.scale.y = squash;
      // Kapak gövdenin yeni tepesine iner.
      cap.position.y = bodyTop * squash;
    },

    dispose() {
      button.traverse((child) => {
        if (child.isMesh) {
          child.geometry.dispose();
          child.material.dispose();
        }
      });
    },
  };

  api.setIcon(icons[0]); // başta ilk simge görünsün
  return api;
}

// Yuvarlak köşeli, yatay duran kalın bir levha. Tabanı y = 0'da.
function createRoundedSlab(height) {
  // 1) Shape: 2D bir çizim. Kalemle kâğıda çizer gibi: moveTo ile kalemi koy,
  //    lineTo ile düz çiz, quadraticCurveTo ile köşeleri yuvarlat.
  const w = BUTTON_WIDTH - 2 * BEVEL; // pah dışarı taştığı için şekli biraz küçük çiziyoruz
  const d = BUTTON_DEPTH - 2 * BEVEL;
  const r = CORNER_RADIUS;
  const x = -w / 2;
  const y = -d / 2;

  const shape = new THREE.Shape();
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r); // sağ alt köşe
  shape.lineTo(x + w, y + d - r);
  shape.quadraticCurveTo(x + w, y + d, x + w - r, y + d); // sağ üst köşe
  shape.lineTo(x + r, y + d);
  shape.quadraticCurveTo(x, y + d, x, y + d - r); // sol üst köşe
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y); // sol alt köşe

  // 2) ExtrudeGeometry: 2D şekli z ekseni boyunca uzatıp 3D'ye çevirir (kurabiye kalıbı gibi).
  //    bevel (pah): kenarları keskin bırakmak yerine yumuşatır, buton daha sevimli görünür.
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: true,
    bevelThickness: BEVEL, // pahın kalınlık yönündeki boyu
    bevelSize: BEVEL, // pahın şeklin dışına doğru taşması
    bevelSegments: 4, // pahın yuvarlaklığı
    curveSegments: 12, // köşe eğrilerinin pürüzsüzlüğü
  });

  // 3) Uzatma z yönünde yapıldı, oysa biz levhanın yatay durmasını istiyoruz.
  //    Geometriyi kalıcı olarak -90° çevir: z yönündeki kalınlık y'ye (yukarı) döner.
  //    (mesh.rotation'dan farkı: köşe noktalarının kendisi değişir, ölçek de doğru eksende kalır.)
  geometry.rotateX(-Math.PI / 2);
  // Pah tabanı y = -BEVEL'e taşırdı. Yukarı kaydır: taban tam y = 0'da olsun.
  geometry.translate(0, BEVEL, 0);

  return geometry;
}
