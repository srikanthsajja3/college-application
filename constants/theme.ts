/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#2e7d32';
const tintColorDark = '#4caf50'; // slightly lighter green for dark mode

export const Colors = {
  light: {
    text: '#11181C',
    textSubtle: '#687076',
    background: '#FFFFFF',
    card: '#f9f9f9',
    border: '#eee',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    textSubtle: '#9BA1A6',
    background: '#000000',
    card: '#121212',
    border: '#2e3235',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};
