// i18n 辅助函数
import i18n from '../locale/index.js'

/**
 * 更新 tabBar 文字（解决 uni-app tabBar 不支持动态国际化的问题）
 */
export const updateTabBarText = () => {
  try {
    if (!i18n || !i18n.global) {
      console.log('i18n 未初始化')
      return
    }
    
    const { t } = i18n.global
    
    uni.setTabBarItem({
      index: 0,
      text: t('tabbar.home')
    })
    
    uni.setTabBarItem({
      index: 1,
      text: t('tabbar.bills')
    })
    
    uni.setTabBarItem({
      index: 2,
      text: t('tabbar.statistics')
    })
    
    uni.setTabBarItem({
      index: 3,
      text: t('tabbar.profile')
    })
  } catch (e) {
    console.log('更新 tabBar 失败', e)
  }
}

/**
 * 获取当前语言
 */
export const getCurrentLanguage = () => {
  return i18n.global.locale.value
}

/**
 * 切换语言
 */
export const changeLanguage = (lang) => {
  i18n.global.locale.value = lang
  uni.setStorageSync('app_language', lang)
  updateTabBarText()
}

/**
 * 格式化货币
 */
export const formatCurrency = (amount) => {
  const locale = getCurrentLanguage()
  const symbol = locale === 'zh-CN' ? '¥' : '$'
  return `${symbol}${amount.toFixed(2)}`
}

export default {
  updateTabBarText,
  getCurrentLanguage,
  changeLanguage,
  formatCurrency
}
