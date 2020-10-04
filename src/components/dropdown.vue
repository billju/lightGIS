<template lang="pug">
span.position-relative
	i.fa.fa-caret-down(ref="btn" @click="show=!show;$emit(show?'focus':'blur')" :style="caretStyle")
	transition(name="fade-up")
		.position-absolute.bg-light.border.rounded.shadow(ref="lists" v-if="show" style="right:0;min-width:280px;z-index:666")
			.input-group.input-group-sm
				input.form-control(type="text" v-model="search" :placeholder="'搜尋('+filteredLists.length+')'")
				.input-group-append
					button.btn.btn-outline-secondary(v-for="st,i in sortTypes" :key="st.class"
						@click="sortType=sortType==st?defaultType:st;$emit('sort',sortType.sort)" :class="sortType==st?'active':''")
						i.fa(:class="st.class")
					button.btn.btn-outline-info
						i.fa.fa-edit(@click="$emit('rename')")
					button.btn.btn-outline-danger
						i.fa.fa-times(@click="$emit('remove')")
					//- button.btn.btn-outline-success
					//- 	i.fa.fa-caret-square-right(@click="$emit('add-col')")
			div(style="max-height:500px;overflow-y:auto")
				.list-hover.px-2.py-1.d-flex.align-items-center.justify-content-between(v-for="list in filteredLists" 
					:class="checks.includes(list)?'bg-primary text-light':'text-secondary'"
					@click="checks=checks.includes(list)?checks.filter(c=>c!=list):[...checks,list];$emit('set-filter',checks)")
					small {{list}}
					i.fa.fa-filter
</template>
<script>
export default {
	name: 'dropdown',
	data:()=>({
		show:false, events: {}, search: '',
		sortType: {class:'',fn:(a,b)=>0}, checks: [],
		defaultType: {class:'',fn:(a,b)=>0,sort:0},
		sortTypes: [
			{class:'fa-sort-alpha-up',fn:(a,b)=>a.toString().localeCompare(b.toString()),sort:1},
			{class:'fa-sort-alpha-down',fn:(b,a)=>a.toString().localeCompare(b.toString()),sort:-1},
			// {class:'fa-sort-numeric-up',fn:(a,b)=>parseFloat(a)-parseFloat(b),sort:1},
			// {class:'fa-sort-numeric-down',fn:(b,a)=>parseFloat(a)-parseFloat(b),sort:-1},
		]
	}),
	props:{
		lists: {type:Array, default:()=>([])},
		value: {type:Boolean},
	},
	methods:{
		closeIfOutside(point=[]){
			if(!this.show) return
			let shouldEmit = true
			for(let refName of ['lists','btn']){
				let {left,top,right,bottom} = this.$refs[refName].getBoundingClientRect()
				let bbox = [left,top,right,bottom]
				const isInBbox = (p,bbox)=>p[0]>=bbox[0]&&p[0]<=bbox[2]&&p[1]>=bbox[1]&&p[1]<=bbox[3]
				if(isInBbox(point,bbox))
					shouldEmit = false
			}
			if(shouldEmit){
				this.show = false
				this.$emit('blur')
			}
		},
	},
	computed:{
		caretStyle(){
			return {
				transform: `rotate(${this.show?180:0}deg)`,
				transition: '0.2s',
				cursor: 'pointer'
			}
		},
		filteredLists(){
			return this.lists.filter(str=>(str||'').toString().match(this.search))
				.slice().sort((a,b)=>this.sortType.fn(a,b))
		}
	},
	mounted(){
		this.events = {
			mousedown: e=>{this.closeIfOutside([e.clientX,e.clientY])}
		}
		for(let name in this.events)
			window.addEventListener(name,this.events[name])
	},
	beforeDestroy(){
		for(let name in this.events)
			window.removeEventListener(name,this.events[name])
	},
}
</script>

<style scoped>
.list-hover:hover{
	background: lightblue;
	cursor: pointer;
}
</style>