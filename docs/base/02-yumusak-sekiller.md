# Ders 2: Low-poly'den yumuşak şekillere

**Hedef:** Köşeli domatesi pürüzsüz bir küreye çevirmek ve onu yuvarlak bir kaidenin (podyum) üstüne oturtmak.

## Yeni stil: "oyuncak diorama"

Ders 1'deki köşeli The Aviator tarzını bırakıyoruz, ama gerçekçi bir görünüme de gitmiyoruz. Hedef, yuvarlak bir kaidenin üstünde duran sevimli bir oyuncak sahnesi. Bu tarzı oluşturan şeyler:

| Özellik | three.js'teki karşılığı | Hangi derste |
|---|---|---|
| Yumuşak, yuvarlak şekiller | Yüksek dilimli `SphereGeometry`, `CylinderGeometry`, `TorusGeometry`... ve `flatShading` kapalı | **Bu ders** |
| Yuvarlak kaide | `CylinderGeometry` | **Bu ders** |
| Mat, kil gibi yüzeyler; birkaç parlak detay | `roughness`, `metalness`, `clearcoat` | Sonraki dersler |
| Yumuşak gölgeler ve stüdyo ışığı | Yumuşak gölge haritası, ortam ışığı (environment), tone mapping | Sonraki dersler |
| Koyu, gradyanlı arka plan | CSS gradyan + sis | Sonraki dersler |
| Sevimli karakter | Büyük parlak gözler, küçük yapraklar | Sonraki dersler |

Adım adım ilerliyoruz. Bu derste sadece **şekiller** değişiyor, renkler ve ışık aynı kalıyor.

## Kavramlar

### SphereGeometry: gerçek küre
Evet, three.js'te hazır bir küre fonksiyonu var:

```js
new THREE.SphereGeometry(radius, widthSegments, heightSegments)
```

| Parametre | Anlamı |
|---|---|
| `radius` | Yarıçap. |
| `widthSegments` | Yatay dilim sayısı. Dünya haritasındaki **boylam** çizgileri gibi düşün (kürenin çevresini kaç parçaya bölüyoruz). En az 3. |
| `heightSegments` | Dikey dilim sayısı. **Enlem** çizgileri gibi (kuzey kutbundan güney kutbuna kaç kat). En az 2. |

Genelde `widthSegments` sayısı `heightSegments` sayısının iki katı seçilir. Bunun sebebi, çevrenin (360°) kutuptan kutba olan mesafenin (180°) iki katı olması. Böylece dilimler kareye yakın olur.

`IcosahedronGeometry` de bir küreydi, ama farklı kurulmuştu: tüm üçgenleri eşit büyüklükte, kutupları olmayan bir küre. `SphereGeometry` ise kutuplarda sıkışan dilimlerden oluşur. Pürüzsüz bir yüzeyde bu fark gözle görülmez.

> Ek bilgi: `SphereGeometry`'nin 4 ek parametresi daha var (`phiStart, phiLength, thetaStart, thetaLength`). Bunlarla kürenin sadece bir parçasını çizebilirsin, örneğin yarım küre ya da portakal dilimi gibi.

### Pürüzsüzlüğün iki parçası
1. **Siluet (dış hat):** Dilim sayısı yeterince yüksek değilse kenar çokgen gibi görünür. 64 × 32 yeterli.
2. **Işıklandırma:** `flatShading: true` her üçgeni tek tonla boyar. Kapalı olunca (varsayılan) ışık her köşe noktasında hesaplanır ve üçgenlerin arasında yumuşakça karıştırılır. Bu yüzden `flatShading` ayarını kaldırdık.

İkisinden biri eksik olursa domates yine köşeli görünür.

### MeshPhysicalMaterial
`MeshStandardMaterial`'ın gelişmiş bir sürümüdür. Aynı ayarlara sahiptir, ek olarak `clearcoat` (cilalı katman), `sheen` (kadife parıltısı), `transmission` (cam gibi geçirgenlik) gibi özellikler sunar. Biraz daha ağırdır, ama tek bir karakter için bu fark önemsiz. Domatesin parlak kabuğunu ileride `clearcoat` ile yapacağız.

### CylinderGeometry: kaide
```js
new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments)
```

| Parametre | Bizdeki değer | Anlamı |
|---|---|---|
| `radiusTop` | `3` | Üst yüzeyin yarıçapı. |
| `radiusBottom` | `3` | Alt yüzeyin yarıçapı. Üstle aynıysa düz silindir olur, farklıysa koni gibi daralır. `0` verirsen tam bir koni olur. |
| `height` | `0.4` | Yükseklik. |
| `radialSegments` | `64` | Çevresi kaç dilim. Az olursa (ör. `6`) altıgen bir sütun olur. |

`CircleGeometry` dik oluştuğu için onu yatırmamız gerekiyordu. Silindir ise zaten dik (y ekseni boyunca) oluşur, bu yüzden `rotation.x` satırını sildik.

### Konum hesabı: nesneyi yere oturtmak
three.js'te `position` nesnenin **merkezini** belirler, alt yüzeyini değil.

- Kaide: merkezi `y = -1.1`'de, yüksekliği `0.4`. Üst yüzeyi: `-1.1 + 0.4 / 2 = -0.9`.
- Domates: yarıçapı 1, y'de 0.85 ile basıklaştırılmış. En alt noktası `-0.85`. Nefes alırken ±0.05 hareket ettiği için en fazla `-0.9`'a iniyor.

Bu iki sayı aynı olunca domates kaideye tam oturuyor. Ders 1'de zemin `-1.1`'de düz bir daireydi ve domates aslında ~0.25 birim havada duruyordu.

### İleride işimize yarayacak diğer hazır şekiller
| Fonksiyon | Şekil | Nerede kullanabiliriz |
|---|---|---|
| `TorusGeometry` | Simit / halka | Referanstaki sarı halkalar |
| `CapsuleGeometry` | İki ucu yuvarlak silindir | Domatesin sapı, kollar |
| `ConeGeometry` | Koni | Yapraklar |
| `BoxGeometry` | Kutu | Tuğlalar |
| `RoundedBoxGeometry` | Köşeleri yuvarlatılmış kutu (`three/addons` içinde) | Sevimli bloklar |

## Görev

Kod güncellendi, `npm.cmd run dev` ile çalıştırıp bak. Sonra şunları dene (her denemeden sonra eski değere geri dön):

1. `SphereGeometry(1, 64, 32)` yerine `(1, 8, 4)` yaz. Siluet nasıl değişiyor? Bir de `flatShading: true` ekleyip öyle bak.
2. Kaidenin `radiusBottom` değerini `3.3` yap. Kaide nasıl görünüyor?
3. Kaidenin `radialSegments` değerini `6` yap.
4. **Kendi görevin:** Kaidenin yüksekliğini `0.4`'ten `1`'e çıkar. Domates kaidenin içine gömülecek. `ground.position.y` değerini, üst yüzey yine `-0.9`'da kalacak şekilde hesapla ve düzelt.

## Kendine sor
- Domatesi `scale.set(1, 0.7, 1)` ile daha basık yaparsan alt noktası nereye gelir? Kaideye oturması için neyi değiştirmen gerekir?
- Kaide neden üstten açık renkli, yandan daha koyu görünüyor? (İpucu: ışık nereden geliyor?)
- Neden `heightSegments` sayısını `widthSegments` sayısının yarısı seçiyoruz?

## Bitince
Sonraki adım ışık ve renkler: yumuşak gölgeler, koyu gradyanlı arka plan ve domatesin parlak kabuğu. Ardından yüzü ve yaprakları ekleyip karakteri kuracağız.
