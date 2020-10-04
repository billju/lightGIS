<template lang="pug">
.w-100.h-100.position-relative(style="overflow:hidden;user-select:none")
	.d-flex.position-absolute.shadow(ref="thead" :style="theadStyle")
		div(v-for="col,ci in cols" :key="ci")
			.position-relative.d-flex.align-items-center.justify-content-between.p-2(:style="{width:col.width+'px'}")
				.mr-1(style="word-break:keep-all") {{col.key}}
				Dropdown(:lists="col.list" @blur="isFocus=true" @focus="isFocus=false" @add-col="" @sort="col.sort=$event;resize()" @set-filter="col.filter=$event;resize()"
					@rename="$emit('rename',col)" @remove="$emit('remove',col)")
				.position-absolute.h-100.bg-hover(style="width:8px;cursor:ew-resize" @mousedown="resizerStart($event,ci)" @dblclick="autoResize()"
					:style="{right:resizer.ci==ci?-resizer.dx-4+'px':'-4px',background:resizer.ci==ci?'grey':''}")
	.position-absolute.w-100(ref="scroll" style="overflow:auto" :style="scrollStyle" @mousedown="handleMousedown" @dblclick="handleDblclick")
		table.table.table-striped.w-100(ref="spreadsheet" style="table-layout:fixed")
			tbody
				tr(v-for="(row,ri) in rows" :key="ri")
					td(v-for="(col,ci) in cols" :key="ci" :style="{width:col.width+'px'}")
						transition(name="fade-in")
							.text-light(:key="row[col.key]") {{row[col.key]}}
		.position-absolute(:style="rangeStyle")
			.position-absolute.p-1.bg-primary(style="bottom:-5px;right:-5px;cursor:cell;" @mousedown.stop="mapping=true;edit.active=false")
			.position-absolute.h-100.p-2.bg-dark.text-nowrap(v-if="edit.active" ref="edit" style="min-width:100%" contenteditable @blur="handleBlur($event)")
		.position-absolute(:style="mapStyle" style="border:2px dashed dodgerblue;")
		.position-absolute(:style="copyStyle" style="outline:2px dashed dodgerblue;animation:blink 2s infinite;")
</template>
<script>
import Dropdown from './dropdown.vue'
export default {
	name: 'spreadsheet',
	components: {Dropdown},
	data:()=>({
		heights: [],
		thead: {clientHeight:0,left:0},
		edit: {active:false, row:-1, cell:-1, content:''},
		resizer : {active:false, ci:-1, x:0, dx:0},
		ranging:false,
		rangeStart: {row:-1, col:0},
		rangeEnd: {row:0, col:0},
		mapping:false,
		mapStart: {row:0, col:0},
		mapEnd: {row:0, col:0},
		copying: false, cutting: false,
		copyStart: {row:0, col:0},
		copyEnd: {row:0, col:0},
		events: {}, 
		histories: [], historyIdx: 0,
		isFocus: true,
	}),
	props: {
		rows:{
			type: Array,
			default: ()=>([]),
		},
		cols:{
			type: Array,
			default: ()=>([]),
		},
	},
	methods:{
		setEdit(cell){ // 產生字元編輯DIV
			let colName = this.cols[cell.col].key
			let content = this.rows[cell.row][colName]??''
			this.edit = {
				active:true,
				row: cell.row,
				col: cell.col,
			}
			this.$nextTick(()=>{ // 渲染完畢還得用再異步執行
				setTimeout(()=>{
					this.$refs['edit'].focus()
					this.$refs['edit'].innerText = content
					let range = document.getSelection().getRangeAt(0)
					range.setStart(range.startContainer,range.startContainer.textContent.length)
					range.collapse(true)
				},0)
			})
		},
		checkEqualCell(c1,c2){
			return c1.row==c2.row&&c1.col==c2.col
		},
		getCell(e){ // 判斷滑鼠位置是哪一格
			let {top,left} = this.tableRef.getBoundingClientRect()
			let {clientX,clientY} = e
			let accH=0, accW=0, row=0, col=0
			for(let ri=0;ri<this.heights.length;ri++){
				row = ri
				accH += this.heights[ri]
				if(top+accH>clientY)
					break
			}
			for(let ci=0;ci<this.cols.length;ci++){
				col = ci
				accW += this.cols[ci].width
				if(left+accW>clientX)
					break
			}
			return {row,col}
		},
		updateScroll(rangeEnd){
			let buffer = 30
			let scrollBarSize = 20
			let scrollRef = this.$refs['scroll']
			const getOuterBBOX = ()=>{
				let {width,height} = scrollRef.getBoundingClientRect()
				let sLeft = scrollRef.scrollLeft
				let sTop = scrollRef.scrollTop
				return [sLeft,sTop,sLeft+width-20,sTop+height-20]
			}
			const getInnerBBOX = ()=>{
				let {left,top,width,height} = this.getRangeStyle(rangeEnd,rangeEnd)
				return [
					parseInt(left),
					parseInt(top),
					parseInt(left)+parseInt(width),
					parseInt(top)+parseInt(height)
				]
			}
			let outerBBOX = getOuterBBOX()
			let innerBBOX = getInnerBBOX()
			let [sLeft,sTop,_R,_B] = outerBBOX
			if(innerBBOX[0]<outerBBOX[0])
				sLeft-= outerBBOX[0]-innerBBOX[0]
			if(innerBBOX[1]<outerBBOX[1])
				sTop-= outerBBOX[1]-innerBBOX[1]
			if(innerBBOX[2]>outerBBOX[2])
				sLeft+= innerBBOX[2]-outerBBOX[2]
			if(innerBBOX[3]>outerBBOX[3])
				sTop+= innerBBOX[3]-outerBBOX[3]
			scrollRef.scrollTo({top:sTop,left:sLeft,behavior:'smooth'})
		},
		getRangeStyle(start,end){ // 框框的左、上、寬、高樣式
			let [sr,sc,er,ec] = this.swapRangeIfBigger(start,end)
			let top = this.heights.slice(0,sr).reduce((acc,cur)=>acc+cur,0)+'px'
			let left = this.cols.slice(0,sc).map(c=>c.width).reduce((acc,cur)=>acc+cur,0)+'px'
			let height = this.heights.slice(sr,er+1).reduce((acc,cur)=>acc+cur,0)+'px'
			let width = this.cols.slice(sc,ec+1).map(c=>c.width).reduce((acc,cur)=>acc+cur,0)+'px'
			return {
				top, left, width, height,
				transition: '0.2s',
			}
		},
		swapRangeIfBigger(start,end){
			let sr = start.row, sc = start.col
			let er = end.row, ec = end.col
			if(sr>er) er = [sr,sr=er][0]
			if(sc>ec) ec = [sc,sc=ec][0]
			return [sr,sc,er,ec]
		},
		handleBlur($event){ // 滑鼠離開字元編輯DIV
			this.edit.active = false;
			this.addHistory()
			let colName = this.cols[this.edit.col].key
			this.rows[this.edit.row][colName] = $event.target.innerText
			this.resize()
		},
		resize(setWidth=true){ // 螢幕縮放或字元超過框框時要重新調整
			this.$nextTick(()=>{
				// init col width
				if(setWidth){
					let thead = [...this.$refs['thead'].children].map(th=>th.clientWidth)
					let tbody = this.rows.length?[...this.tableRef.rows[0].cells].map(td=>td.clientWidth):[]
					for(let i=0;i<thead.length;i++)
						this.cols[i].width = Math.max(thead[i],tbody[i]??0)
					this.resize(false)
				}
				// init cell height
				this.heights = [...this.tableRef.rows].map(row=>row.clientHeight)
				let { clientHeight } = this.$refs['thead']
				this.thead = { clientHeight }
			})
		},
		autoResize(){
			let {fontSize} = window.getComputedStyle(this.tableRef)
			let full = parseInt(fontSize)
			let half = parseInt(fontSize)/2
			const isAscii = (str)=>/^[\x00-\x7F]*$/.test(str)
			const getTextWidth = (str)=>str.split('').reduce((acc,cur)=>acc+(isAscii(cur)?half:full),0)
			for(let col of this.cols){
				let texts = this.rows.map(row=>row[col.key]??'').map(v=>v.toString())
				let thead = getTextWidth(col.key)+48
				let tbody = Math.max(...texts.map(str=>getTextWidth(str)))+24
				col.width = Math.max(thead,tbody)
			}
			this.resize(false)
		},
		minmax(input,min,max){return input<min?min:input>max?max:input},
		checkIsChar(e){ // 判斷鍵盤敲下去輸入的是不是字元
			let codes = ['Key','Digit','Backqoute','Equal','Minus','Backslash',
			'BracketLeft','BracketRight','Quote','Semicolon','Slash','Period','Comma']
			let isChar = codes.some(code=>e.code.includes(code)||e.key=='Process')
			if(e.ctrlKey&&['KeyZ','KeyX','KeyC','KeyV'].includes(e.code)) isChar=false
			return isChar
		},
		resizerStart(e,ci){
			this.resizer.active  =true
			this.resizer.x = e.clientX
			this.resizer.ci = ci
		},
		handleDblclick(e){
			this.setEdit(this.getCell(e))
		},
		handleMousedown(e){
			if(!this.isFocus||this.edit.active) return
			this.ranging = true
			let cell = this.getCell(e)
			if(JSON.stringify(this.mapStart)!=JSON.stringify(cell))
				this.edit.active = false
			this.mapStart = this.mapEnd = cell
			this.rangeStart = this.rangeEnd = cell
		},
		handleMousemove(e){
			if(this.edit.active){
		
			}else if(this.resizer.active){
				let {x,ci} = this.resizer
				let w = this.cols[ci].width
				let dx = this.minmax(e.clientX-x,-w+50,200)
				this.resizer.dx = dx
			}else if(this.ranging){
				let cell = this.getCell(e)
				this.rangeEnd = {...cell}
				this.mapEnd = {...cell}
			}else if(this.mapping){
				this.mapEnd = this.getCell(e)
				this.mapEnd.col = this.rangeEnd.col
				this.mapStart.col = this.rangeStart.col
			}
		},
		handleMouseup(e){
			if(this.mapping){
				this.addHistory()
				let baseRI = this.mapStart.row
				let [sr,sc,er,ec] = this.swapRangeIfBigger(this.mapStart,this.mapEnd)
				for(let ci=sc;ci<=ec;ci++){
					let colName = this.cols[ci].key
					let content = this.rows[baseRI][colName]
					for(let ri=sr;ri<=er;ri++){
						this.rows[ri][colName] = content
					}
				}
				this.mapStart = {...this.mapEnd}
				this.rangeStart = {...this.mapEnd}
				this.rangeEnd = {...this.mapEnd}
				this.resize()
			}else if(this.resizer.active){
				let {dx,ci} = this.resizer
				this.cols[ci].width+= dx
				this.resizer.ci = -1
				this.resizer.dx = 0
				this.resizer.active = false
				this.resize(false)
			}
			this.ranging = false
			this.mapping = false
		},
		handleKeydown(e){
			// console.log(e)
			if(!this.isFocus) return // 確保不會跟下拉選單重疊
			let row, col
			if(this.edit.active){
				if(e.key!='Process'&&e.code=='Enter'&&!e.shiftKey){
					this.$refs['edit'].blur()
					let row = this.minmax(this.rangeEnd.row+1,1,this.rows.length)
					this.rangeStart.row = this.rangeEnd.row = row
				}
			}else if(this.checkIsChar(e)){
				this.setEdit(this.rangeEnd)
			}else if(e.code=='Enter'){
				if(e.shiftKey){
					this.addHistory()
					let idx = this.rangeStart.row
					let newRow = JSON.parse(JSON.stringify(this.rows[idx]))
					this.rows.splice(idx,0,newRow)
					this.resize()
				}
				this.rangeStart.row = ++this.rangeEnd.row
			}else if(e.code=='Escape'){
				this.copying = false
			}else if(e.code=='Delete'){
				this.rangeDelete()
			}else if(e.code.includes('Arrow')){
				e.preventDefault()
				this.rangeEnd = {...this.rangeEnd}
				switch(e.code){
					case 'ArrowUp':
						row = this.minmax(this.rangeEnd.row-1,0,this.rows.length-1)
						this.rangeEnd.row = row
						break
					case 'ArrowDown':
						row = this.minmax(this.rangeEnd.row+1,0,this.rows.length-1)
						this.rangeEnd.row = row
						break
					case 'ArrowLeft':
						col = this.minmax(this.rangeEnd.col-1,0,this.cols.length-1)
						this.rangeEnd.col = col
						break
					case 'ArrowRight':
						col = this.minmax(this.rangeEnd.col+1,0,this.cols.length-1)
						this.rangeEnd.col = col
						break
					default: break
				}
				if(!e.shiftKey) this.rangeStart = this.rangeEnd
			}else if(e.ctrlKey){
				e.preventDefault()
				switch(e.key.toUpperCase()){
					case 'Z':
						if(e.shiftKey)
							this.traceHistory(1)
						else 
							this.traceHistory(-1)
						break
					case 'X':
						this.cutting = true
						this.copying = true
						this.copyStart = {...this.rangeStart}
						this.copyEnd = {...this.rangeEnd}
						break
					case 'C':
						this.copying = true
						this.copyStart = {...this.rangeStart}
						this.copyEnd = {...this.rangeEnd}
						break
					case 'V':
						this.rangePaste()
						break
					default: break
				}
			}
		},
		rangeDelete(){
			this.addHistory()
			let [sr,sc,er,ec] = this.swapRangeIfBigger(this.rangeStart,this.rangeEnd)
			for(let ri=er;ri>=sr;ri--){
				for(let ci=sc;ci<=ec;ci++){
					let colName = this.cols[ci].key
					this.rows[ri][colName] = undefined
				}
				if(Object.values(this.rows[ri]).every(c=>c==undefined)){
					this.rows.splice(ri,1)
					this.rangeEnd.row = --this.rangeStart.row
				}
			}
			this.resize();
		},
		rangePaste(){
			if(!this.copying) return
			this.addHistory()
			let [sr,sc,er,ec] = this.swapRangeIfBigger(this.copyStart,this.copyEnd)
			let aoa = []
			for(let ri=sr;ri<=er;ri++){
				let row = []
				for(let ci=sc;ci<=ec;ci++){
					let colName = this.cols[ci].key
					let col = this.rows[ri][colName]
					if(this.cutting)
						this.rows[ri][colName] = undefined
					row.push(col)
				}
				aoa.push(row)
			}
			aoa.map((row,ri)=>{
				row.map((col,ci)=>{
					let rowIdx = this.rangeStart.row+ri
					let colIdx = this.rangeStart.col+ci
					let colName = this.cols[colIdx].key
					this.rows[rowIdx][colName] = col
				})
			})
			this.rangeEnd = {
				row: this.rangeStart.row+aoa.length-1,
				col: this.rangeStart.col+aoa[0].length-1
			}
			if(this.cutting)
				this.copying = false
			this.cutting = false
			this.resize()
		},
		addHistory(){
			this.histories[this.historyIdx] = {
				rangeStart: {...this.rangeStart},
				rangeEnd: {...this.rangeEnd},
				aoa: this.rows.map(row=>this.cols.map(col=>row[col.key]))
			}
			this.historyIdx++
			this.histories = this.histories.slice(0,this.historyIdx)
		},
		traceHistory(offset){
			if(offset<0&&!this.histories[this.historyIdx]){
				this.addHistory()
				this.historyIdx--
			}
			this.historyIdx = this.minmax(this.historyIdx+offset,0,this.histories.length-1)
			let {aoa,rangeStart,rangeEnd} = this.histories[this.historyIdx]
			this.rows = aoa.map((arr,ri)=>{
				let row = {}
				arr.map((val,ci)=>{
					let colName = this.cols[ci].key
					row[colName] = val
				})
				return row
			})
			this.rangeStart = {...rangeStart}
			this.rangeEnd = {...rangeEnd}
			this.resize()
		},
	},
	computed:{
		tableRef(){
			return this.$refs['spreadsheet']
		},
		rangeStyle(){
			if(this.rangeStart.row==-1) return {display:'none'}
			this.updateScroll(this.rangeEnd)
			return {
				...this.getRangeStyle(this.rangeStart,this.rangeEnd),
				border:'2px solid dodgerblue',
				background: this.checkEqualCell(this.rangeStart,this.rangeEnd)?
					'transparent':'rgba(64,128,256,0.1)'
			}
		},
		mapStyle(){
			if(!this.mapping) return {display:'none'}
			return this.getRangeStyle(this.mapStart,this.mapEnd)
		},
		copyStyle(){
			if(!this.copying) return {display:'none'}
			return this.getRangeStyle(this.copyStart,this.copyEnd)
		},
		scrollStyle(){
			return {
				top: this.thead.clientHeight+'px',
				height: `calc( 100% - ${this.thead.clientHeight}px)`,
				cursor: this.mapping?'cell':'auto',
				wordBreak: 'break-all',
			}
		},
		theadStyle(){
			return {
				top: 0,
				left: 0,
				zIndex: 99,
				transform: `translateX(${this.thead.left}px)`,
				// transition: 'transform 0.1s'
			}
		}
	},
	mounted(){
		this.resize()
		this.events = {
			// dblclick: e=>this.handleDblclick(e),
			// mousedown: e=>this.handleMousedown(e),
			mousemove: e=>this.handleMousemove(e),
			mouseup: e=>this.handleMouseup(e),
			keydown: e=>this.handleKeydown(e),
			resize: e=>this.resize(),
		}
		let scrollRef = this.$refs['scroll']
		scrollRef.addEventListener('scroll',()=>{
			this.$set(this.thead,'left',-scrollRef.scrollLeft)
		})
		for(let name in this.events)
			window.addEventListener(name,this.events[name])
	},
	beforeDestroy(){
		for(let name in this.events)
			window.removeEventListener(name,this.events[name])
	}
}
</script>

<style scoped>
/* 試算表 */
.hide-scrollbar{
	-ms-overflow-style: none;  /* IE and Edge */
	scrollbar-width: none;  /* Firefox */
}
.hide-scrollbar::-webkit-scrollbar{
	display: none; /* Hide scrollbar for Chrome, Safari and Opera */
}
.bg-hover:hover{
	background: grey;
}
/* 轉換特效 fade-in */
.fade-in-enter-active {
    animation: fade-in 0.3s ease-out;
}
.fade-in-leave-active {
    position: absolute;
    animation: fade-in 0.3s ease-in reverse;
}
@keyframes fade-in {
    0% {
        opacity: 0;
        transform: translateY(30%);
    }
}
</style>