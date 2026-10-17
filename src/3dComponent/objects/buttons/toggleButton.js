import { colors } from '../../colors.js';
import { createButton } from './button.js';

// Duraklat / devam et butonu.
// Zamanlayıcı dururken ▶ (devam et), çalışırken ⏸ (duraklat) gösterir.
// Hangi simgenin görüneceğini dışarıdan setIcon('play' | 'pause') ile söylüyoruz.
export function createToggleButton(onPress) {
  return createButton({
    color: colors.toggleButton,
    sideColor: colors.toggleButtonSide,
    icons: ['play', 'pause'],
    onPress,
  });
}
