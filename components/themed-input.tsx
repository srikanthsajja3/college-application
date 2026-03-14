import { TextInput, type TextInputProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedInputProps = TextInputProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedInput({ style, lightColor, darkColor, ...otherProps }: ThemedInputProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'card');
  const borderColor = useThemeColor({ light: undefined, dark: undefined }, 'border');
  const color = useThemeColor({ light: undefined, dark: undefined }, 'text');
  const placeholderColor = useThemeColor({ light: undefined, dark: undefined }, 'textSubtle');

  return (
    <TextInput
      style={[{ backgroundColor, borderColor, color, borderWidth: 1, padding: 15, borderRadius: 12 }, style]}
      placeholderTextColor={placeholderColor}
      {...otherProps}
    />
  );
}
