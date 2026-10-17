# Ders 5: Klavye tuşu gibi 3D butonlar

**Hedef:** Kaidedeki yuvarlak butonları kaldırıp sürenin hemen altına, köşeleri yuvarlatılmış, kalın 3D tuşlar koymak:
- **Duraklat / devam et:** zamanlayıcı dururken ▶, çalışırken ⏸ gösterir.
- **Sıfırla:** ↺

## Yeni dosyalar

```
src/
├── Controls.jsx                      ← butonların React köprüsü (sürenin altına yerleşir)
└── 3dComponent/
    ├── world/buttonsWorld.js         ← butonların küçük, ayrı 3D sahnesi
    └── objects/buttons/
        ├── button.js                 ← ortak tuş şekli: gövde + kapak + simge, hover ve basma
        ├── icons.js                  ← ▶ ⏸ ↺ simgeleri
        ├── toggleButton.js           ← duraklat / devam et
        └── resetButton.js            ← sıfırla
```

`toggleButton.js` ve `resetButton.js` çok kısa. Tek yaptıkları `button.js`'e renk ve simge vermek. Yeni bir buton eklemek için sadece böyle küçük bir dosya yazman yeterli.

## Kavramlar

### 1. Shape: 2D çizim
`THREE.Shape` kâğıda kalemle çizmek gibidir:
```js
shape.moveTo(x, y);                       // kalemi koy
shape.lineTo(x2, y2);                     // düz çizgi çek
shape.quadraticCurveTo(kx, ky, x3, y3);   // (kx, ky) köşesine doğru kıvrılarak (x3, y3)'e git
```
Dört kenar ve dört yuvarlak köşe çizince yuvarlak köşeli bir dikdörtgen elde ediyoruz.

### 2. ExtrudeGeometry: 2D'den 3D'ye
`ExtrudeGeometry` bir 2D şekli z ekseni boyunca uzatarak kalınlık verir. Kurabiye kalıbıyla hamur kesmek gibi düşün.

```js
new THREE.ExtrudeGeometry(shape, {
  depth: 0.18,          // kalınlık
  bevelEnabled: true,   // kenarları yumuşat
  bevelThickness: 0.03, // pahın kalınlık yönündeki boyu
  bevelSize: 0.03,      // pahın dışa taşması
  bevelSegments: 4,     // pahın yuvarlaklığı
  curveSegments: 12,    // köşe eğrilerinin pürüzsüzlüğü
});
```

**Bevel (pah)**, kenarı keskin bırakmak yerine hafifçe yuvarlar. Buton bu sayede oyuncak gibi yumuşak görünüyor. Pah şeklin dışına taştığı için şekli o kadar küçük çiziyoruz, sonuç yine istediğimiz boyutta oluyor.

### 3. Geometriyi döndürmek ve kaydırmak
Uzatma z yönünde yapılıyor, oysa butonun yatay durmasını istiyoruz:
```js
geometry.rotateX(-Math.PI / 2); // köşe noktalarının kendisini çevirir
geometry.translate(0, BEVEL, 0); // tabanı y = 0'a getir
```
`mesh.rotation` ile `geometry.rotateX` arasındaki fark:
- `mesh.rotation` nesneyi döndürür, şeklin kendisine dokunmaz.
- `geometry.rotateX` şeklin noktalarını kalıcı olarak değiştirir.

Biz ikincisini seçtik. Basınca gövdeyi `scale.y` ile basacağız, bu yüzden "yukarı" yönünün gerçekten geometrinin y ekseni olması gerekiyor. Tabanı y = 0'a koymamızın sebebi de bu: ölçek y = 0'a göre uygulandığı için gövde yukarıdan aşağı basılıyor ve tabanı yerinde kalıyor.

### 4. Tuş hissi: gövde + kapak
- **Gövde:** koyu renkli ve kalın. Önden-yukarıdan bakınca alttaki koyu şerit bu.
- **Kapak:** asıl renkli, ince bir levha. Simgeler onun çocuğu.

Basınca gövde `scale.y` ile yüksekliğinin %30'una kadar basılıyor, kapak da gövdenin yeni tepesine iniyor. Şerit inceldiği için buton gerçekten içeri gömülmüş gibi görünüyor. Bu, CSS'teki "3D buton" efektinin gerçek 3D hali.

### 5. Butonu kameraya döndürmek
`button.js` butonu masaya konmuş gibi yatay kuruyor (yüzü +y'ye, yukarı bakıyor). Kamera ise tam önden bakıyor. [buttonsWorld.js](../../src/3dComponent/world/buttonsWorld.js) içinde her butonu döndürüyoruz:

```js
const STAND_UP = Math.PI / 2;                    // 90°
const TILT_DOWN = THREE.MathUtils.degToRad(14);  // derece → radyan
const TURN_RIGHT = THREE.MathUtils.degToRad(16);

button.object.rotation.set(STAND_UP + TILT_DOWN, TURN_RIGHT, 0, 'YXZ');
```

| Dönüş | Eksen | Sonuç |
|---|---|---|
| `STAND_UP` (90°) | x | Yatay buton dikilir, yüzü bize bakar. |
| `TILT_DOWN` (+14°) | x | Yüz biraz aşağı eğilir. **Üst kenar** görünür. |
| `TURN_RIGHT` (16°) | y | Yüz biraz sağa döner. **Sol kenar** görünür. |

Kural: Bir kenarı görmek istiyorsan yüzü o kenarın **tersine** çevir. Üst kenar için aşağı, sol kenar için sağa.

**Dönüş sırası neden önemli?** `rotation.set`'in son parametresi (`'YXZ'`) dönüşlerin hangi sırayla uygulanacağını söyler. Biz önce x'te dikip sonra y'de çevirmek istiyoruz. Varsayılan sıra (`'XYZ'`) önce y'de çevirip sonra x'te dikerdi. Buton dikilirken yan yatmış gibi olurdu. Kitabı önce dik tutup sonra kendi etrafında çevirmekle, önce çevirip sonra dikmek aynı sonucu vermez.

Butonun içindeki basma animasyonu (`body.scale.y`) butonun **kendi** y ekseninde çalışıyor. Buton döndüğü için bu eksen artık bize doğru bakıyor, yani basınca buton ekrandan içeri doğru gömülüyor. Hiçbir değişiklik yapmadan doğru çalışmasının sebebi bu (yerel koordinatlar, Ders 3).

**Işık:** Yüzler artık yukarıya değil bize baktığı için `HemisphereLight` yüzlere gökyüzü rengini değil, gökyüzü ile yer renginin karışımını veriyordu ve butonlar matlaşıyordu. Bunun yerine her yöne eşit ışık veren bir `AmbientLight` ve önden gelen bir güneş kullandık.

### 6. OrthographicCamera
Butonlar için `PerspectiveCamera` değil, `OrthographicCamera` kullandık.

| | PerspectiveCamera | OrthographicCamera |
|---|---|---|
| Uzaktaki nesneler | Küçük görünür | Aynı boyda görünür |
| Ayar | Görüş açısı (`fov`) | Görüntülenen kutunun sınırları (`left, right, top, bottom`) |
| Uygun olduğu yer | Sahneler, karakterler | Arayüzler, simgeler, haritalar |

İki buton yan yana birebir aynı görünsün diye bu kamera daha uygun. `fitCamera()` her boyut değişiminde kutuyu, butonların tamamı sığacak ve oranlar bozulmayacak şekilde ayarlıyor.

### 7. Neden ikinci bir canvas?
Butonların sürenin hemen altında, sayfa düzeninin (HTML/CSS) bir parçası olarak durması gerekiyor. Ana sahnenin içinde olsalardı, yazının ekranın neresinde olduğunu 3D koordinatlara çevirmemiz gerekirdi. Bunun yerine butonlara kendi küçük canvas'larını verdik ve o canvas'ı CSS ile yerleştirdik.

Bedeli: iki renderer, iki çizim döngüsü. Bu kadar küçük bir sahne için fark edilmez.

`pointer.js` hiç değişmedi. `Raycaster.setFromCamera` her iki kamera türüyle de çalışıyor.

### 8. `pointer-events`
`.hud` kutusu `pointer-events: none` ile tıklamaları alttaki ana canvas'a geçiriyor. Ama butonların canvas'ı tıklanabilir olmalı, bu yüzden `.controls` için `pointer-events: auto` yazdık. Çocuk eleman, ebeveynin ayarını kendi için geri açabilir.

## Görev
1. [buttonsWorld.js](../../src/3dComponent/world/buttonsWorld.js) içinde `TILT_DOWN` değerini `-14` yap. Hangi kenar görünüyor? Sonra `TURN_RIGHT` değerini `-16` yap. Kuralı (yüzü kenarın tersine çevir) doğrula.
2. `'YXZ'` sırasını `'XYZ'` yapıp farkı gör, sonra geri al.
3. [button.js](../../src/3dComponent/objects/buttons/button.js) içinde `CORNER_RADIUS` değerini `0.05` ve `0.5` yap.
4. `bevelEnabled: false` yap ve kenarlara yakından bak.
5. `PRESSED_BODY_SCALE` değerini `0.05` yap: buton neredeyse tamamen gömülsün.
6. **Kendi görevin:** Üçüncü bir buton ekle: **atla** (⏭).
   - `icons.js`'e bir `skip` simgesi ekle (iki üçgen ve bir çubuk).
   - `objects/buttons/skipButton.js` dosyasını yaz.
   - `buttonsWorld.js`'te üç butonu yan yana diz. `contentWidth` hesabını da güncellemeyi unutma!
   - `usePomodoro`'ya bir `skip` fonksiyonu ekle ve `Controls.jsx` üzerinden bağla.

## Kendine sor
- Butonlara `PerspectiveCamera` ile bakarsak sol ve sağ butonlar neden birbirinden biraz farklı görünürdü?
- Gövdeyi `scale.y` ile basarken neden kapağı da ayrıca aşağı indirmemiz gerekiyor? Kapak gövdenin çocuğu olsaydı ne olurdu? (İpucu: Ders 3'teki ölçek tuzağı.)
- `geometry.translate(0, BEVEL, 0)` satırını silersen basma animasyonu nasıl değişir?
