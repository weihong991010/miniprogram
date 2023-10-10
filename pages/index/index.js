const app = getApp()
const COLOR_MAP = [
	'blue',
	'green',
	'grey',
	'red',
	'white',
	'orange',
	'#f9f9f9',
	'#f2f1f1',
	'#fbf1c7',
	'#036aca'
]
Page({
	data: {
		styleMap: [{ visible: true, height: 0 }],
		groupList: []
	},
	onLoad() {
		//不在视图上使用的变量不在data内申明
		this.current = 0
		this.observerList = []
		this.getDeviceHeight()
		this.fetchData()
	},
	//节流
	throttle(method, wait) {
		let previous = 0
		return function (...args) {
			const context = this
			const now = new Date().getTime()
			if (now - previous > wait) {
				method.apply(context, args)
				previous = now
			}
		}
	},
	//获取设备高度
	getDeviceHeight() {
		wx.getSystemInfo({
			success: res => {
				this.deviceHeight = res.windowHeight
			}
		})
	},
	fetchData() {
		let data = [];
		for (let i = 0; i < 10; i++) {
			data.push({
				height: Math.random().toFixed(3) * 1000,
				id: Date.now(),
				color: COLOR_MAP[Math.random().toFixed(1) * 10]
			})
		}
		const key = `groupList[${this.current}]`
		const styleKey = `styleMap[${this.data.styleMap.length}]`

		this.setData({
			[key]: data,
			[styleKey]: {
				visible: true,
				height: 0
			}
		})
		this.current++
		wx.nextTick(() => {
			this.observeElement(this.current - 1)
		})

	},
	
	observeElement(index, isImmediate = false) {
		const observer = wx.createIntersectionObserver(this, { initialRatio: 0 })
		//已经存在的节点 无需在下一个tick中监听
		isImmediate ?
			(
				this.observeBorder(observer, index, isImmediate)
				&& this.observerList.splice(index, 1, observer)
			) :
			wx.nextTick(() => {
				this.observeBorder(observer, index, isImmediate)
				this.observerList.splice(index, 1, observer)
			})
	},
	//上下首尾各两屏为边界 超出的页列表容器隐藏 并获取高度占位
	observeBorder(observer = null, index) {
		const callback = (visible, height) => {
			if (this.data.styleMap[index] && this.data.styleMap[index].visible !== visible) {
				const key = `styleMap[${index}]`
				this.setData({
					[key]: {
						visible: visible,
						height: height
					}
				})
				this.observerList[index].disconnect()
			}
		}
		observer.relativeToViewport({
			top: this.deviceHeight * 2,
			bottom: this.deviceHeight * 2
		})
			.observe(`#selection-${index}`, ({ intersectionRatio, boundingClientRect }) => {
				const visible = intersectionRatio !== 0;
				console.log(visible ? '可见' : '不可见', `第${index + 1}页`);
				callback(visible, boundingClientRect.height)
			})
	},
	manualCheck(scrollTop) {
		let height = 0,
			showIndex = ''
		//找到第一个需要显示的分页容器 这里只判断上边界
		for (let index = 0; index < this.data.styleMap.length; index++) {
			height += this.data.styleMap[index].height;
			if (height < scrollTop + this.deviceHeight * 2) {
				showIndex = index;
				continue;
			}
		}
		
		//对上下两页进行判断处理 简单处理 如果三页不够撑开的 可以在上面的判断中把下边界也加上即可
		const showIndexs = [showIndex - 1, showIndex, showIndex + 1]
		showIndexs.forEach(visibleIndex => {
			this.data.styleMap[visibleIndex] && (this.data.styleMap[visibleIndex].visible || this.observeElement(visibleIndex, true))
		})
	},
	onPageScroll(e){
		this.throttle(() => {
			this.manualCheck(e.scrollTop);
		}, 800)()
	},
	onReachBottom() {
		this.fetchData()
	},
	onUnload() {
		//断开监听 避免内存泄漏
		this.observerList.forEach(observer => observer?.disconnect())
	}
})
