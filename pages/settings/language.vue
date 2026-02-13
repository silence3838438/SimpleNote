<template>
	<view class="language-page">
		<view class="language-list">
			<view 
				v-for="lang in languages" 
				:key="lang.value"
				class="language-item"
				@click="selectLanguage(lang.value)"
			>
				<view class="language-info">
					<text class="language-flag">{{ lang.flag }}</text>
					<text class="language-name">{{ lang.label }}</text>
				</view>
				<text v-if="currentLanguage === lang.value" class="selected-icon">✓</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { updateTabBarText } from '@/utils/i18nHelper'

const { locale } = useI18n()
const currentLanguage = ref(locale.value)

const languages = [
	{ label: '简体中文', value: 'zh-CN', flag: '🇨🇳' },
	{ label: 'English', value: 'en-US', flag: '🇺🇸' }
]

const selectLanguage = (lang) => {
	if (currentLanguage.value === lang) return
	
	currentLanguage.value = lang
	locale.value = lang
	uni.setStorageSync('app_language', lang)
	
	// 更新 tabBar 文字
	updateTabBarText()
	
	uni.showToast({
		title: lang === 'zh-CN' ? '语言已切换' : 'Language changed',
		icon: 'success',
		duration: 1500
	})
	
	setTimeout(() => {
		uni.navigateBack()
	}, 1500)
}
</script>

<style scoped lang="scss">
.language-page {
	min-height: 100vh;
	background: #f5f5f5;
}

.language-list {
	background: white;
}

.language-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 30rpx 40rpx;
	border-bottom: 1px solid #f0f0f0;
	
	&:active {
		background-color: #f8f8f8;
	}
	
	&:last-child {
		border-bottom: none;
	}
}

.language-info {
	display: flex;
	align-items: center;
	gap: 20rpx;
}

.language-flag {
	font-size: 48rpx;
}

.language-name {
	font-size: 32rpx;
	color: #333;
}

.selected-icon {
	color: #52C41A;
	font-size: 40rpx;
	font-weight: bold;
}
</style>
