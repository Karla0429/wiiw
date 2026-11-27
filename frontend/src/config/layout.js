import { Platform } from 'react-native';

export function centeredWebContent(maxWidth) {
  if (Platform.OS !== 'web') return {};
  return {
    width: '100%',
    maxWidth,
    alignSelf: 'center',
  };
}
