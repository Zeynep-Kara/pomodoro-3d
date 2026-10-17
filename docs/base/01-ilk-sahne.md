# Ders 1: İlk three.js sahnesi (React içinde)

**Hedef:** Ekranda yavaşça dönen, kırmızı, low-poly bir küre görmek. Bu küre domatesin gövdesi olacak.

## 1. Kurulum

```bash
npm create vite@latest pomodoro -- --template react
cd pomodoro
npm install three
npm run dev
```

## 2. Kavramlar

### Üçlü: Scene, Camera, Renderer
three.js'te her şey bu üçüyle başlar:
- **Scene**: dünyanın kendisi. İçine eklediğin her şey (mesh, ışık) bir ağaç yapısında durur.
- **Camera**: dünyaya nereden ve nasıl bakıldığı. `PerspectiveCamera(fov, aspect, near, far)` kullanacağız. `near` ile `far` arasındaki şeyler çizilir, dışındakiler kesilir.
- **WebGLRenderer**: sahneyi kameradan bakarak bir `<canvas>`'a çizer. `renderer.domElement` o canvas'tır, onu DOM'a sen eklersin.

### Scene graph, DOM'a benzer
DOM'da `div.appendChild(span)` yaptığın gibi three.js'te `parent.add(child)` yaparsın. Her nesne bir `Object3D`'dir ve `position`, `rotation`, `scale` taşır. Çocuk, ebeveyninin dönüşünü ve konumunu miras alır. Karakteri kurarken bu çok işimize yarayacak: domatesi döndürünce gözleri ve yaprakları da onunla birlikte döner.

### Mesh = Geometry + Material
- **Geometry**: şeklin köşe noktaları (vertex). `IcosahedronGeometry(1, 1)` düşük detaylı bir küre verir, low-poly görünüm için ideal.
- **Material**: yüzeyin ışıkla nasıl etkileşeceği. `MeshBasicMaterial` ışıktan etkilenmez, düz renk boyar. `MeshStandardMaterial` ışığa tepki verir. `flatShading: true` her üçgeni tek renk boyar, The Aviator'daki o köşeli görünüm buradan gelir.

### Işık
Işıksız bir sahnede `MeshStandardMaterial` simsiyah görünür. İki ışık yeterli:
- `HemisphereLight(gökRengi, yerRengi, şiddet)`: ortamdan gelen yumuşak ışık.
- `DirectionalLight`: güneş gibi tek yönden gelen ışık, yüzlerin farklı tonlarda görünmesini sağlar.

### Render döngüsü
Tarayıcı ekranı saniyede ~60 kez yeniler. `requestAnimationFrame(fn)` bir sonraki yenilemeden hemen önce `fn`'i çağırır. Döngü şu şekilde çalışır: bir kare çiz, sonra bir sonrakini iste.

Önemli nokta: 120Hz bir ekranda döngü iki kat hızlı çalışır. Bu yüzden "her karede 0.01 döndür" demek yerine **"saniyede 0.5 radyan döndür"** deriz ve iki kare arasında geçen süreyle (delta time) çarparız:

```js
mesh.rotation.y += 0.5 * dt; // dt: saniye cinsinden geçen süre
```

`THREE.Timer` ya da `performance.now()` ile dt'yi kendin hesaplayabilirsin. Kendin hesaplamanı öneririm.

### React ile birleştirme
React DOM'u yönetir, three.js ise canvas'ın içini. Kuralı basit tut: **React sadece bir `<div>` verir, three.js'in kendi dünyası o div'in içinde yaşar.**
- `useRef` ile div'i al.
- `useEffect(() => { ... }, [])` içinde sahneyi kur.
- Effect'in döndürdüğü temizlik fonksiyonunda her şeyi geri al: `cancelAnimationFrame`, `renderer.dispose()`, geometry ve material'ların `dispose()`'u, canvas'ı DOM'dan kaldırmak, resize dinleyicisini kaldırmak.

Development modunda React `StrictMode` effect'leri bilerek iki kez çalıştırır (kur, sök, tekrar kur). Temizliğin eksikse ekranda iki canvas görürsün. Bu, temizliğini test etmenin bedava bir yolu.

### Ekran boyutu
Pencere boyutu değişince iki şeyi güncellemelisin:
```js
camera.aspect = width / height;
camera.updateProjectionMatrix(); // bunu unutursan görüntü esner
renderer.setSize(width, height);
```
Ayrıca `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))` ile retina ekranlarda net ama aşırı ağır olmayan bir görüntü alırsın.

## 3. Görev

Mimariyi baştan doğru kuralım. three.js kodu React'ten bağımsız, düz bir JS modülünde olsun:

**`src/three/world.js`**
```js
import * as THREE from 'three';

export function createWorld(container) {
  // TODO 1: scene, camera, renderer oluştur. renderer.domElement'i container'a ekle.
  // TODO 2: iki ışık ekle (Hemisphere + Directional).
  // TODO 3: IcosahedronGeometry + MeshStandardMaterial({ color: '#e8513e', flatShading: true }) ile domates gövdesi.
  // TODO 4: delta time kullanan bir render döngüsü. Gövde yavaşça y ekseninde dönsün.
  // TODO 5: resize'ı yönet (container'ın boyutunu kullan, window'unkini değil).

  return {
    dispose() {
      // TODO 6: kurduğun her şeyi geri al.
    },
  };
}
```

**`src/Scene.jsx`**: bir div render eden, `useEffect` içinde `createWorld`'ü çağırıp temizlikte `dispose()` eden bileşen.

**`App.jsx`**: şimdilik sadece tam ekran `<Scene />`.

## 4. Kendine sor
- `MeshStandardMaterial` yerine `MeshBasicMaterial` kullanırsan ne değişiyor? Neden?
- `flatShading`'i kapatınca ne oluyor?
- `IcosahedronGeometry`'nin ikinci parametresini (detail) 0, 1, 3 yapınca ne görüyorsun?
- Kamerayı `z = 5`'ten `z = 1.5`'e çekince ne oluyor? `fov`'u 30 ile 90 arasında değiştir.
- Bonus: resize için `window.resize` yerine `ResizeObserver` kullanmak neden daha iyi?

## Bitince
`world.js` ve `Scene.jsx` kodunu thread'e yapıştır. İnceleyip Ders 2'ye geçelim: domatesin yüzü, yaprakları ve scene graph ile karakter kurmak.
