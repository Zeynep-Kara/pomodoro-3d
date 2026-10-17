# Temel dersler

Bu projeyi sıfırdan kurarken three.js'i adım adım öğrenmek için yazılmış ders notları. Her ders bir öncekinin üzerine kurulu, sırayla okunması önerilir.

| # | Ders | Amaç |
|---|---|---|
| 1 | [İlk sahne](01-ilk-sahne.md) | three.js'in temelini (sahne, kamera, renderer, ışık, render döngüsü) React içinde doğru mimariyle kurup ekranda dönen ilk domates gövdesini görmek. |
| 2 | [Yumuşak şekiller](02-yumusak-sekiller.md) | Köşeli low-poly görünümden `SphereGeometry` ve `CylinderGeometry` ile pürüzsüz, "oyuncak diorama" tarzına geçip domatesi yuvarlak bir kaideye oturtmak. |
| 3 | [Karakter](03-karakter.md) | Scene graph (`Group`, ebeveyn-çocuk ilişkisi, yerel koordinatlar) ile domatese gözler, sap ve yapraklar ekleyerek onu sevimli bir karaktere çevirmek. |
| 4 | [Zamanlayıcı ve 3D butonlar](04-zamanlayici-ve-3d-butonlar.md) | Kaymayan bir Pomodoro zamanlayıcısı yazmak ve `Raycaster` ile 3D nesnelere tıklayarak onu React'ten bağımsız bir 3D dünyadan yönetmek. |
| 5 | [Tuş butonlar](05-tus-butonlar.md) | `Shape` ve `ExtrudeGeometry` ile klavye tuşu gibi kalın 3D butonlar yapıp `OrthographicCamera` ve nesne döndürme ile onları süre yazısının altına yerleştirmek. |

> Not: Dersler projenin o anki halini anlatır. Sonraki derslerde değişen kısımlar (ör. Ders 4'teki kaide butonları) ilgili dersin başında belirtilmiştir.
