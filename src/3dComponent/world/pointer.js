import * as THREE from 'three';

// Fareyle (ya da parmakla) 3D butonlara tıklamak.
//
// Sorun: tarayıcı bize sadece "canvas'ın şu pikseline tıklandı" der.
// O pikselin arkasında 3D dünyada hangi nesne var, bunu bilmez.
//
// Çözüm: Raycaster (ışın atıcı). Kameradan, tıklanan pikselin yönüne doğru
// görünmez bir ışın gönderir ve ışının çarptığı nesneleri yakından uzağa sıralar.
export function createPointer(canvas, camera, buttons) {
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2(); // tıklanan nokta, -1 ile 1 arasında (aşağıya bak)

  // Işın butonun herhangi bir parçasına (kapak, simge, halka) çarpabilir.
  // Hangi butona ait olduğunu bulmak için butonun kök grubuna kendisini not ediyoruz.
  // userData: three.js'in her nesnede bize ayırdığı boş bir not defteri.
  for (const button of buttons) {
    button.object.userData.button = button;
  }

  function findButton(event) {
    // Piksel koordinatını "normalized device coordinates"a (NDC) çevir:
    // canvas'ın sol kenarı x = -1, sağ kenarı x = 1, üst kenarı y = 1, alt kenarı y = -1.
    // (Ekranda y aşağı doğru artar, three.js'te yukarı doğru. Bu yüzden y'de eksi var.)
    const rect = canvas.getBoundingClientRect();
    ndc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(ndc, camera);
    // true = çocuklara da bak (butonlar birçok parçadan oluşan Group'lar)
    const hits = raycaster.intersectObjects(
      buttons.map((b) => b.object),
      true,
    );
    if (hits.length === 0) return null;

    // En yakın çarpılan parçadan başlayıp ebeveynlere tırman, notu bulana kadar.
    let object = hits[0].object;
    while (object && !object.userData.button) object = object.parent;
    return object ? object.userData.button : null;
  }

  function setHovered(hit) {
    for (const button of buttons) button.setHovered(button === hit);
    canvas.style.cursor = hit ? 'pointer' : '';
  }

  function onPointerMove(event) {
    setHovered(findButton(event));
  }

  function onPointerDown(event) {
    const hit = findButton(event);
    if (hit) hit.press();
  }

  function onPointerLeave() {
    setHovered(null);
  }

  // pointer olayları hem fareyi hem dokunmatik ekranı kapsar.
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerleave', onPointerLeave);

  return {
    dispose() {
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerleave', onPointerLeave);
    },
  };
}
