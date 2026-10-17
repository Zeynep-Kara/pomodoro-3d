import { colors } from '../../colors.js';
import { createButton } from './button.js';

// Sıfırla butonu: ↺
export function createResetButton(onPress) {
  return createButton({
    color: colors.resetButton,
    sideColor: colors.resetButtonSide,
    icons: ['reset'],
    onPress,
  });
}
