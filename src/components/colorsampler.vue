<template lang="pug">
.w-100
    canvas.w-100(ref="sampler" style="height:300px")
    input(type="file" ref="ImageFile" accept="image/*" style="display:none" 
        @change="sampler.import($event.target.files[0])")
    .w-100.btn.btn-outline-primary(@click="$refs['ImageFile'].click()") 匯入圖片
    .d-flex
        .px-3.py-3(:style="{background:sample}")
        .flex-grow-1.d-flex.justify-content-around.pt-1
            span RGBA
            el-switch(size="mini" v-model="isHex")
            span HEX
        .btn.btn-outline-success(title="複製全部" @click="copyAll()")
            i.el-icon-document-copy
    Draggable(v-model="rows" :options="{animation:150}")
        .d-flex.border-bottom(v-for="row,i in rows" :key="i")
            .px-3(:style="{background:row.rgba}")
            .flex-grow-1.px-2 {{isHex?row.hex:row.rgba}}
            .btn.btn-sm.btn-outline-success(title="複製至剪貼簿" @click="copy(isHex?row.hex:row.rgba)")
                i.el-icon-document-copy
            .btn.btn-sm.btn-outline-danger(title="刪除一列" @click="$delete(rows,i)")
                i.el-icon-minus
</template>

<script>
import ColorSampler from '../js/colorsampler.js'
import Draggable from 'vuedraggable'
import { mapState } from 'vuex'
export default {
    name:'Colorsampler',
    components: {Draggable},
    data:()=>({
        sampler: {}, sample: 'rgba(255,255,255,1)', rows: [], isHex:false,
    }),
    methods: {
        rgba2hex(rgba){
            return '#'+rgba.match(/\d+/gi).slice(0,3)
                .map(x=>('0'+parseInt(x).toString(16)).substr(-2))
                .join('').toUpperCase()
        },
        copy(text){
            navigator.clipboard.writeText(text)
        },
        copyAll(){
            let text = this.rows.map(row=>this.isHex?row.hex:row.rgba).join('\n')
            this.copy(text)
        }
    },
    computed:{
        ...mapState(['tab']),
    },
    mounted(){
        this.sampler = new ColorSampler(this.$refs['sampler'])
        this.sampler.addEventListener('change',e=>{
            this.sample = e.value
        })
        this.sampler.addEventListener('select',e=>{
            let rgba = e.value
            this.rows.unshift({rgba,hex:this.rgba2hex(rgba)})
        })
    }
}
</script>
<style scoped>
</style>