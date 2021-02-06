<template lang="pug">
.px-2(v-if="tab=='網格'")
    Draggable(v-model="gismap.rasters" :animation="150")
        .d-flex.align-items-center.border-bottom(v-for="raster,i in gismap.rasters" :key="i")
            label.cursor-pointer.text-truncate(:for="raster.name" style="margin-bottom:0").flex-grow-1 {{raster.name}}
            .custom-control.custom-switch.mx-1.cursor-pointer
                input.custom-control-input(type="checkbox" v-model="raster.active" :id="raster.name")
                label.custom-control-label(:for="raster.name")
            .input-text(draggable="true" ondragstart="event.preventDefault();event.stopPropagation()")
                input.custom-range(type="range" min="0" max="1" step="0.1" value="0.8" style="direction:rtl;margin-top:6px;width:100px"
                    v-model.number="raster.opacity")
    .input-group.mt-1
        .input-group-prepend(@click="addWMS()")
            .btn.btn-outline-success 新增
        input.form-control.btn.btn-outline-success(type="text" v-model="name" placeholder="名稱")
        input.form-control.btn.btn-outline-success(type="text" style="flex:3" v-model="url" placeholder="https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png")
</template>

<script>
import { mapState } from 'vuex'
import Draggable from 'vuedraggable'
export default {
    name: 'Rasters',
    components: {Draggable},
    data:()=>({
        rasters:[],
        url: '', name:''
    }),
    methods: {
        addWMS(){
            if(this.url&&this.name){
                let newRaster = {url:this.url,name:this.name,opacity:1,active:false}
                this.gismap.set('rasters',[this.gismap.rasters,, newRaster])
            }
        }
    },
    computed: {
        ...mapState(['gismap','tab'])
    },
}
</script>

<style scoped>

</style>