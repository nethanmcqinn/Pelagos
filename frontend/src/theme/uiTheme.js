import { DefaultTheme } from '@react-navigation/native';
import { Text, TextInput } from 'react-native';

export const uiColors = {
  background: '#061a40',
  surface: '#0b2545',
  primary: '#13315c',
  accent: '#134074',
  border: '#1f4e79',
  text: '#e6f0ff',
  mutedText: '#8da9c4',
};

export const pixelFontFamily = 'PressStart2P_400Regular';

export const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: uiColors.accent,
    background: uiColors.background,
    card: uiColors.surface,
    text: uiColors.text,
    border: uiColors.border,
    notification: uiColors.accent,
  },
};

let defaultsApplied = false;

const mergeDefaultStyle = (Component, styleObject) => {
  if (!Component.defaultProps) {
    Component.defaultProps = {};
  }

  const existingStyle = Component.defaultProps.style;
  if (Array.isArray(existingStyle)) {
    Component.defaultProps.style = [styleObject, ...existingStyle];
  } else if (existingStyle) {
    Component.defaultProps.style = [styleObject, existingStyle];
  } else {
    Component.defaultProps.style = styleObject;
  }
};

export const applyPixelFontDefaults = () => {
  if (defaultsApplied) {
    return;
  }

  mergeDefaultStyle(Text, {
    color: uiColors.text,
    fontFamily: pixelFontFamily,
  });

  mergeDefaultStyle(TextInput, {
    color: uiColors.text,
    fontFamily: pixelFontFamily,
  });

  if (!TextInput.defaultProps) {
    TextInput.defaultProps = {};
  }

  TextInput.defaultProps.placeholderTextColor = uiColors.mutedText;
  defaultsApplied = true;
};