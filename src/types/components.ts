/**
 * Component-related interfaces and types
 */

/**
 * Language switcher component props
 */
export interface LanguageSwitcherProps {
  style?: any;
  onLanguageChange?: (language: string) => void;
}

/**
 * Results screen component props
 */
export interface NutritionItemProps {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
}

export interface MacroCardProps {
  value: number;
  label: string;
  color: string;
  icon: string;
}

export interface NutrientCardProps {
  title: string;
  icon: string;
  children: React.ReactNode;
}

/**
 * Common button props
 */
export interface ButtonProps {
  title: string;
  onPress: () => void;
  style?: any;
  textStyle?: any;
  disabled?: boolean;
  loading?: boolean;
}

/**
 * Common input props
 */
export interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: any;
  multiline?: boolean;
  numberOfLines?: number;
}
