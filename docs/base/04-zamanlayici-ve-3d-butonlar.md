# Ders 4: Zamanlayıcı ve 3D butonlar

**Hedef:** Gerçek bir Pomodoro zamanlayıcısı (25 dk odaklanma, 5 dk mola) eklemek. Onu kaidenin üstündeki tıklanabilir 3D butonlarla yönetmek.

> **Not:** Ders 5'te butonlar kaideden alınıp süre yazısının altına taşındı ve şekilleri değişti. Bu dersteki dosya yolları (`objects/button.js`, world.js içindeki butonlar) artık yok. Zamanlayıcı, Raycaster ve React köprüsü anlatımı ise hâlâ geçerli.

## Mimari: kim neyi biliyor?

```
App.jsx ─────────── usePomodoro()   ← zamanlayıcı mantığı (3D'den habersiz)
  │                     ▲
  │  running            │ toggle(), reset()
  ▼                     │
Scene.jsx ──────────── köprü
  │  setRunning()       ▲ onToggle, onReset
  ▼                     │
world.js ─── butonlar + pointer.js (Raycaster)
```

- **Zamanlayıcı** ([src/pomodoro/usePomodoro.js](../../src/pomodoro/usePomodoro.js)) sadece süreyi bilir. Butonların 3D olduğundan haberi yoktur. Yarın butonları HTML'e çevirsen bu dosyaya dokunmazsın.
- **Dünya** ([world.js](../../src/3dComponent/world/world.js)) sadece butonları çizer ve "bana basıldı" diye haber verir. Zamanlayıcının nasıl çalıştığını bilmez.
- **Scene.jsx** ikisinin arasındaki köprüdür.

Her parça tek bir işi biliyor. Bir parçayı değiştirince diğerleri bozulmuyor.

## Kavramlar

### 1. Doğru zamanlayıcı: sayma, hesapla
İlk akla gelen yöntem şu:
```js
setInterval(() => kalan = kalan - 1, 1000); // YANLIŞ
```
Sorun şu ki `setInterval` tam zamanında çalışmaz. Sekme arka plandayken tarayıcı onu saniyelerce geciktirebilir. Sayaç her seferinde biraz geri kalır ve 25 dakika sonunda dakikalarca hata birikebilir.

Doğrusu, **bitiş anını** saklamak ve kalan süreyi her seferinde gerçek saatten hesaplamak:
```js
endTime = Date.now() + kalanSüre;          // başlatınca
kalan   = endTime - Date.now();            // her güncellemede
```
Interval geç çalışsa bile sonuç doğru olur, çünkü saat hep doğrudur. Duraklatınca kalan süreyi saklarız, devam edince yeni bir `endTime` hesaplarız.

### 2. `setState`'e fonksiyon vermek
```js
setState((s) => ({ ...s, running: false }));
```
`s` her zaman **en güncel** durumdur. Bu sayede `toggle` ve `reset` fonksiyonları dışarıdaki duruma bakmak zorunda kalmaz. `useCallback(..., [])` ile bir kez oluşturulup hep aynı kalırlar. Klavye dinleyicisi gibi onları kullanan yerler de gereksiz yere yeniden kurulmaz.

### 3. Raycaster: 3D'de tıklamak
Tarayıcı bize sadece "canvas'ın şu pikseline tıklandı" der. O pikselin arkasında hangi 3D nesne olduğunu bilmez. **Raycaster** kameradan o pikselin yönüne görünmez bir ışın gönderir ve çarptığı nesneleri yakından uzağa sıralar.

Adımlar ([pointer.js](../../src/3dComponent/world/pointer.js)):
1. **Pikseli NDC'ye çevir.** NDC (normalized device coordinates) şöyle bir koordinat sistemidir: canvas'ın solu `-1`, sağı `+1`, üstü `+1`, altı `-1`.
   ```js
   ndc.x = (x / genişlik) * 2 - 1;
   ndc.y = -(y / yükseklik) * 2 + 1; // ekranda y aşağı artar, 3D'de yukarı
   ```
2. `raycaster.setFromCamera(ndc, camera)` ile ışını kur.
3. `raycaster.intersectObjects(nesneler, true)` ile çarpılanları bul. `true` parametresi, çocuklara da bakılmasını söyler.

### 4. `userData`: nesneye not iliştirmek
Işın butonun herhangi bir parçasına çarpabilir: kapağa, simgeye, alt halkaya. Hangi butona ait olduğunu bulmak için butonun kök grubuna `userData.button = button` notunu yazdık. Çarpılan parçadan başlayıp `parent` zinciri boyunca yukarı tırmanarak notu buluyoruz. Ders 3'teki scene graph burada da işimize yaradı.

### 5. Hover ve basma animasyonu
- **Hover:** Üstüne gelince buton %8 büyüyor. Hedef ölçeğe birden atlamak yerine her karede yolun bir kısmını gidiyor:
  ```js
  s = s + (hedef - s) * dt * 12;
  ```
  Buna **lerp** (doğrusal ara değer) denir. Yumuşak geçişlerin en basit yoludur.
- **Basma:** `pressAmount` 1'den 0'a iniyor. `sin(π · a)` bu sırada 0 → 1 → 0 yapıyor, yani kapak iniyor ve geri çıkıyor. Ders 1'deki nefes almanın kardeşi.

### 6. Simge değiştirme: `visible`
Başlat/duraklat butonunda ▶ ve ⏸ simgelerinin ikisi de baştan kurulu. `setRunning` sadece hangisinin `visible` olacağını değiştiriyor. Her seferinde nesneyi silip yeniden oluşturmaktan çok daha ucuz.

### 7. Hazır şekillerle simge yapmak
- ▶: **3 dilimli bir silindir** aslında üçgen bir prizmadır.
- ⏸: iki `BoxGeometry` çubuğu.
- ↺: 3/4'lük bir `TorusGeometry` ve ucunda küçük bir üçgen.

### 8. React'ten three.js'e, three.js'ten React'e
[Scene.jsx](../../src/Scene.jsx) iki yönlü haberleşiyor:
- **React → three.js:** `running` değişince bir `useEffect` `world.setRunning(running)` çağırıyor.
- **three.js → React:** Dünyaya `onToggle` fonksiyonunun kendisini değil, "ref'teki en güncel fonksiyonu çağır" diyen bir aracıyı veriyoruz. Böylece dünya sadece bir kez kuruluyor ama her zaman güncel fonksiyonu çağırıyor.

### 9. Erişilebilirlik
3D butonlara ekran okuyucu veya klavyeyle ulaşılamaz. Bu yüzden:
- **Boşluk** ve **R** kısayolları eklendi.
- Süre yazısı HTML'de, `role="timer"` ile işaretli.
- Sekme başlığında da kalan süre görünüyor.

## Görev
1. `DURATIONS` değerlerini `work: 10 * 1000, break: 5 * 1000` yap ve bir turu baştan sona izle. **Sonra geri al!**
2. [colors.js](../../src/3dComponent/colors.js) dosyasında buton renklerini değiştir.
3. [button.js](../../src/3dComponent/objects/button.js) içinde hover ölçeğini `1.08`'den `1.2`'ye, lerp hızını `12`'den `3`'e çıkar. Fark nasıl hissettiriyor?
4. **Kendi görevin:** Üçüncü bir buton ekle: **atla** (⏭). Basınca süreyi beklemeden diğer moda geçsin.
   - `usePomodoro`'ya bir `skip` fonksiyonu yaz.
   - `ICON_BUILDERS`'a bir `skip` simgesi ekle (ipucu: iki üçgen yan yana).
   - world.js'te üçüncü butonu oluştur, `onSkip` ile Scene ve App'e bağla.
5. **Kendi görevin:** Domates zamanlayıcıya tepki versin. Örneğin çalışırken daha sakin nefes alsın, molada zıplasın. `world.setRunning`'in yanına bir de `tomato.setRunning` ekleyebilirsin.

## Kendine sor
- `pointer.js`'te `intersectObjects` çağrısına sadece butonları veriyoruz, domatesi vermiyoruz. Domates bir butonun önünde dursaydı ne olurdu?
- `formatTime` neden `Math.floor` değil de `Math.ceil` kullanıyor? `floor` kullansaydık başlatır başlatmaz ne görürdün?
- `.hud` içindeki `pointer-events: none` satırını silersen ne olur? Neden?

## Bitince
Sırada ışık ve atmosfer var: yumuşak gölgeler, gradyanlı arka plan, domatesin parlak kabuğu. Sonra süre bitince bir ses ve domatesin sevinç animasyonu.
