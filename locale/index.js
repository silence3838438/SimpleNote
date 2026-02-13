import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import enUS from './en-US'

// 获取系统语言
const getSystemLanguage = () => {
  let language = 'zh-CN'
  
  try {
    // #ifdef APP-PLUS
    if (typeof plus !== 'undefined') {
      language = plus.os.language
    }
    // #endif
    
    // #ifdef H5
    if (typeof navigator !== 'undefined') {
      language = navigator.language
    }
    // #endif
    
    // #ifdef MP-WEIXIN
    if (typeof uni !== 'undefined') {
      language = uni.getSystemInfoSync().language
    }
    // #endif
  } catch (e) {
    console.log('获取系统语言失败', e)
  }
  
  // 语言映射
  const languageMap = {
    'zh': 'zh-CN',
    'zh-CN': 'zh-CN',
    'zh-Hans': 'zh-CN',
    'zh-Hans-CN': 'zh-CN',
    'zh-TW': 'zh-CN',
    'zh-Hant': 'zh-CN',
    'en': 'en-US',
    'en-US': 'en-US',
    'en-GB': 'en-US'
  }
  
  return languageMap[language] || 'zh-CN'
}

// 获取保存的语言设置
const getSavedLanguage = () => {
  try {
    if (typeof uni !== 'undefined') {
      return uni.getStorageSync('app_language')
    }
  } catch (e) {
    console.log('获取保存的语言失败', e)
  }
  return ''
}

const savedLanguage = getSavedLanguage() || getSystemLanguage()

const i18n = createI18n({
  locale: savedLanguage,
  fallbackLocale: 'zh-CN',
  legacy: false,
  globalInjection: true,
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS
  }
})

export default i18n
