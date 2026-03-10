<template>
	<view class="charts-box">
		<canvas 
			v-if="canvasId" 
			:canvas-id="canvasId" 
			:id="canvasId"
			class="charts" 
			:style="{width: cWidth + 'px', height: cHeight + 'px'}"
			@touchstart="touchStart"
			@touchmove="touchMove"
			@touchend="touchEnd"
		></canvas>
	</view>
</template>

<script>
import uCharts from '@qiun/ucharts'

export default {
	name: 'qiun-ucharts',
	props: {
		type: {
			type: String,
			default: 'pie'
		},
		opts: {
			type: Object,
			default() {
				return {}
			}
		},
		chartData: {
			type: Object,
			default() {
				return {}
			}
		},
		canvasId: {
			type: String,
			default: 'uCharts'
		},
		cWidth: {
			type: Number,
			default: 375
		},
		cHeight: {
			type: Number,
			default: 250
		}
	},
	data() {
		return {
			chart: null
		}
	},
	watch: {
		chartData: {
			handler(val) {
				this.updateChart()
			},
			deep: true
		},
		type() {
			this.initChart()
		}
	},
	mounted() {
		this.$nextTick(() => {
			this.initChart()
		})
	},
	beforeDestroy() {
		if (this.chart) {
			this.chart = null
		}
	},
	methods: {
		initChart() {
			const ctx = uni.createCanvasContext(this.canvasId, this)
			this.chart = new uCharts({
				type: this.type,
				context: ctx,
				width: this.cWidth,
				height: this.cHeight,
				categories: this.chartData.categories,
				series: this.chartData.series,
				animation: true,
				...this.opts
			})
		},
		updateChart() {
			if (this.chart) {
				this.chart.updateData({
					categories: this.chartData.categories,
					series: this.chartData.series
				})
			} else {
				this.initChart()
			}
		},
		touchStart(e) {
			if (this.chart) {
				this.chart.touchStart(e)
			}
		},
		touchMove(e) {
			if (this.chart) {
				this.chart.touchMove(e)
			}
		},
		touchEnd(e) {
			if (this.chart) {
				this.chart.touchEnd(e)
			}
		}
	}
}
</script>

<style scoped>
.charts-box {
	width: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
}

.charts {
	width: 100%;
	height: 100%;
}
</style>
