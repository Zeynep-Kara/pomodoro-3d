# Ders 3: Domatesi karaktere çevirmek (scene graph)

**Hedef:** Domatese bir sap, iki yaprak, iri beyaz gözler, yanak allığı ve küçük bir gülümseme eklemek. Bütün parçaların tek bir karakter gibi birlikte hareket etmesini sağlamak.

Kod: [src/3dComponent/objects/tomato.js](../../src/3dComponent/objects/tomato.js)

## Kavramlar

### Group: görünmez bir taşıyıcı
`THREE.Group` hiçbir şey çizmez. Tek görevi çocuklarını taşımaktır. Karakteri parçalardan kurarken bütün parçaları bir grubun içine koyarız:

```
tomato (Group)        ← hareket burada: salınma ve nefes alma
├── body (Mesh)       ← basık gövde
├── face (Group)      ← gözler, yanaklar, ağız
│   ├── eye (Group)   ← beyaz + göz bebeği + parlama
│   ├── eye (Group)
│   ├── cheek, cheek
│   └── mouth
└── top (Group)       ← gövdenin tepesinde
    ├── stem
    └── pivot → leaf  (×2)
```

Bu ağaca **scene graph** denir. DOM'daki `div > span` ilişkisinin aynısı: `parent.add(child)`.

### Çocuk, ebeveyninin hareketini miras alır
`update()` içinde sadece `tomato` grubunu döndürüp yukarı aşağı oynatıyoruz. Gözler, sap ve yapraklar bunu kendiliğinden takip ediyor. Her parçayı tek tek hareket ettirmemiz gerekmiyor.

Miras üç şeyi kapsar: **konum, dönüş ve ölçek**. Ölçek konusunda dikkatli olmak gerekir.

### Tuzak: ölçek de miras kalır
Gövde `scale.set(1, 0.85, 1)` ile basıklaştırılmış. Gözleri `body`'nin çocuğu yapsaydık onlar da %15 basılır ve yamuk görünürdü. Bu yüzden yüzü ve yaprakları `body`'nin değil, `tomato` grubunun çocuğu yaptık. Gövde ile yüz **kardeş**.

Kural: Bir nesneyi bozuk oranlarla ölçeklediysen ona çocuk ekleme. Ölçeksiz bir grup kullan.

### Yerel koordinatlar
Her nesnenin `position` değeri **ebeveynine göre** ölçülür.
- `top` grubu `y = 0.85`'te, yani gövdenin tepesinde.
- Sapın `y = 0.1` değeri dünyada 0.1 değil, **tepenin 0.1 üstü** demek.

Bu sayede tepeyi kaydırırsan sap ve yapraklar da onunla gelir.

### Menteşe (pivot) hilesi
Yaprakları gövdenin etrafında farklı yönlere çevirmek istiyoruz. Bunu doğrudan açı ve konum hesaplayarak yapmak zor. Bunun yerine:
1. Merkeze görünmez bir `pivot` grubu koy.
2. Yaprağı pivot'un içinde **+x yönünde** kur (dışarı uzansın, ucu sarksın).
3. Pivot'u y ekseninde istediğin açıya çevir.

Böylece iki yaprak aynı kodla kuruluyor, sadece pivot açıları farklı. Kapının menteşesi gibi düşün: kapıyı değil menteşeyi döndürüyorsun.

### Yüzeye yerleştirmek: `placeOnSurface`
Gözleri gövdenin yüzeyine koymak için o noktadaki **derinliği (z)** bilmemiz gerekiyor. Gövde basık bir küre (elipsoid), denklemi şöyle:

```
x² + (y / 0.85)² + z² = 1
```

`x` ve `y`'yi biz seçiyoruz (gözün yüzdeki yeri), `z`'yi bu denklemden çözüyoruz:

```js
const z = Math.sqrt(1 - x * x - (y / 0.85) ** 2);
```

Sonra parçayı yüzeye dik bakacak şekilde çeviriyoruz. Yandaki bir göz biraz yana, üstteki bir göz biraz yukarı bakar. `Math.atan2(karşı, komşu)` iki kenardan açıyı bulur.

`inset` parametresi parçayı yüzeyden biraz içeri gömer. Böylece kenarlarda boşluk kalmaz ve parça gövdeye yapışık görünür.

### Sevimli göz nasıl yapılır?
Üç katman, hepsi yassılaştırılmış küre:
1. **Beyaz:** büyük ve hafif uzun bir oval.
2. **Göz bebeği:** daha küçük, beyazın biraz önünde ve yarısı içine gömülü. Saf siyah yerine çok koyu kahve kullandık, daha yumuşak duruyor.
3. **Parlama noktası:** sağ üstte küçük beyaz bir nokta. Bu küçük nokta gözü canlı gösteriyor. Silip farkı kendin gör.

Parlama noktası için `MeshBasicMaterial` kullandık. Ders 1'deki soruyu hatırla: bu malzeme ışıktan etkilenmez, gözün hangi tarafı gölgede kalırsa kalsın nokta hep bembeyaz parlar.

### Malzeme ve geometry paylaşımı
İki göz aynı `eyeWhiteMaterial` malzemesini, iki yaprak aynı `leafGeometry` şeklini kullanıyor. Paylaşmak GPU belleğinden tasarruf sağlar. Bir rengi değiştirdiğinde de her yerde birden değişir.

### `traverse`: ağacı gezmek
```js
tomato.traverse((child) => { if (child.isMesh) child.castShadow = true; });
```
`traverse` ağaçtaki her nesneyi (çocukları, torunları...) tek tek ziyaret eder. Bunu iki yerde kullandık:
- Tüm parçaların gölge düşürmesini sağlamak için.
- `dispose()` içinde tüm geometry ve material'ları temizlemek için. Parça eklediğinde temizliği ayrıca güncellemene gerek kalmıyor.

### Dönmek yerine salınmak
Artık bir yüzü var. Sürekli dönseydi zamanın yarısında bize sırtını dönerdi. Bunun yerine `sin` ile sağa sola ~20° salınıyor:

```js
tomato.rotation.y = Math.sin(elapsed * 0.8) * 0.35;
```

Burada `+=` yerine `=` kullandığımıza dikkat et. Açıyı biriktirmiyoruz, her karede zamana göre yeniden hesaplıyoruz.

## Görev
1. Parlama noktasını sil (`eye.add(shine)` satırını yorum satırı yap). Karakter nasıl değişti?
2. `createEye` içinde göz bebeğinin konumunu `(0.03, -0.02, 0.06)` yap. Karakter nereye bakıyor gibi görünüyor?
3. Yanakların `placeOnSurface` çağrısındaki `-0.08` değerini değiştirerek allığı yukarı aşağı kaydır.
4. **Kendi görevin:** Üçüncü bir yaprak ekle. Tek yapman gereken pivot açıları dizisine bir değer eklemek. Hangi açı yaprağı tam arkaya koyar?
5. **Kendi görevin:** Gözleri yanlışlıkla `body.add(eye)` ile gövdeye ekle ve sonucu gör. Sonra geri al.

## Kendine sor
- `top` grubunun `position.y` değerini değiştirirsen sap ve yapraklara ne olur? Neden?
- Pivot hilesi olmadan bir yaprağı 45° yana nasıl yerleştirirdin? Hangi değerleri hesaplaman gerekirdi?
- `update()` içinde neden `tomato.rotation.y += ...` değil de `= Math.sin(...)` yazdık? İkisi arasındaki fark ne?

## Bitince
Sıradaki adım ışık ve renkler: yumuşak gölgeler, koyu gradyanlı arka plan ve domatesin parlak kabuğu (`clearcoat`). Sonra karaktere canlılık katacağız: göz kırpma ve zamanlayıcının durumuna göre değişen hareketler.
