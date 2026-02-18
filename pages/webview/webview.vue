<template>
	<view class="webview-page">
		<web-view :src="url"></web-view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const url = ref('')

onLoad((options) => {
	if (options.url) {
		url.value = decodeURIComponent(options.url)
	}
})
</script>

<style scoped>
.webview-page {
	width: 100%;
	height: 100vh;
}
</style>
