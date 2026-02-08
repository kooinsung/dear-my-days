import { Platform } from 'react-native'

export const PlatformModule = {
  getPlatform: () => Platform.OS, // 'ios' | 'android'
  getVersion: () => Platform.Version,
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
}
