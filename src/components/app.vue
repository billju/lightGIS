<template lang="pug">
.w-100.h-100.bg-dark
    .w-100.h-100(ref="mapContainer")
        canvas.w-100.h-100(ref="gismap" v-show="!showDataTable" @drop="handleDrop($event)" @dragover="$event.preventDefault()" :style="{background:bgColor}")
    .position-fixed.d-flex.align-items-center(v-if="gismap.view&&showScale" style="right:8px;bottom:4px;user-select:none;")
        span.text-shadow {{gismap.view.scaleText}}
        .mx-2.py-1.border(:style="scaleStyle")
    
    Toolbar.position-fixed(style="top:0;left:0")
    .position-fixed.bg-light.px-1.py-3.m-2.rounded.shadow(v-show="tab" style="overflow-y:auto;top:0;left:60px;width:320px;max-height:90vh")
        Rasters
        Vectors
        Settings
        PTX
        ColorSampler(v-if="tab=='調色'")
        Tutorial    
    Styles(v-if="selectedFeatures.length")
    transition(name="fade-up")
        DataTable(v-if="showDataTable")
    transition(name="fade-left")
        Intro(v-if="showDialog")
    transition(name="fade-up")
        LoadingPage(v-if="isLoading")
</template>

<script>
import {mapState, mapGetters} from 'vuex'
// js library
import GisMap from '../js/GisMap.js'
import Interaction from '../js/interaction.js'
import Heatmap from '../js/heatmap.js'
// mixins
import importMixin from '../mixins/importMixin.js'
import exportMixin from '../mixins/exportMixin.js'
import utilsMixin from '../mixins/utilsMixin.js'
// components
import Toolbar from './toolbar.vue'
import Tutorial from './tutorial.vue'
import Rasters from './rasters.vue'
import Vectors from './vectors.vue'
import Styles from './styles.vue'
import PTX from './ptx.vue'
import DataTable from './dataTable.vue'
import ColorSampler from './colorsampler.vue'
import LoadingPage from './loadingPage.vue'
import Intro from './intro.vue'
import Settings from './settings.vue'

export default {
    name: 'app',
    components: {
        Toolbar, Tutorial, Rasters, Vectors, Styles, PTX, 
        LoadingPage, Intro, ColorSampler, DataTable, Settings
    }, 
    mixins: [importMixin, exportMixin, utilsMixin],
    methods: {
        parseURL(){
            let url = new URL(document.URL)
            url.searchParams()
        },
        movePopup(){
            if(this.selectedFeatures.length){
                let features = this.selectedFeatures
                let bbox = features[features.length-1].geometry.bbox
                let bc = this.gismap.getBboxCenter(bbox)
                let popupCoord = this.gismap.coord2client(bc).map(c=>Math.round(c))
                this.setState({popupCoord})
            }
        },
    },
    computed:{
        // global
        ...mapState(['gismap','interaction','heatmap','tab','tabs','isLoading','showDialog','rasters']),
        // vectors
        ...mapState(['groups','groupIndex','tmpFeatures','maxItems','type2icon']),
        // settings
        ...mapState(['fileExtension','filename','bgColor','extensions','encoding','encodings','showScale','allowAnimation']),
        // DataTable
        ...mapState(['showDataTable','isImporting', 'rows', 'cols','tablePage','search','filename']),
        ...mapGetters(['groupFeatures','groupName','groupRange','selectedFeatures','slicedGroupFeatures','filteredRows','propKeys','sortIcon']),
        scaleStyle(){
            let w = this.gismap.view.scaleStripe
            return {
                width: this.gismap.view.scaleWidth,
                background:`repeating-linear-gradient(to right,black,black ${w}px,white ${w}px,white ${2*w}px)`
            }
        }
    },
    created(){
        this.addGroup('群組1')
    },
    mounted(){
        let gismap = new GisMap(this.$refs['gismap'])
        gismap.set('rasters',this.rasters)
        gismap.addEventListener('select',e=>{
            this.handleSelect(e.features)
            this.movePopup()
        })
        gismap.addEventListener('drawend',e=>{
            e.feature.properties['群組'] = this.groupName
        })
        gismap.addEventListener('render',e=>{
            if(this.gismap.notRenderPoints){
                let points = e.features.filter(f=>f.geometry.type=='Point')
                let data = points.map(f=>{
                    let [x,y] = this.gismap.coord2client(f.geometry.coordinates)
                    return {x:Math.round(x),y:Math.round(y),value:f.properties['radius']||10}
                })
                this.heatmap.setData({max:20, data})
            }
        })
        gismap.addEventListener('moving',e=>{
            this.movePopup()
        })
        gismap.addEventListener('moveend',e=>{
            this.handleSelect(this.selectedFeatures)
            let url = `@${e.lnglat[1].toFixed(7)},${e.lnglat[0].toFixed(7)},${e.zoom.toFixed(2)}z`
            let title = url
            // window.history.replaceState({},title,url)
        })
        let interaction = new Interaction(this.$refs['mapContainer'],gismap)
        interaction.addEventListener('paste',e=>{
            e.features.map(f=>{f.properties['群組']=this.groupName})
        })
        
        let heatmap = new Heatmap(this.$refs['gismap'])
        this.setState({ gismap, interaction, heatmap }) 
    }
}
</script>

<style>
*{
    font-family: 微軟正黑體;
}
html, body{
    margin: 0;
    height: 100%;
}
select{
    border: none;
}
/* .custom-control-label:before{
    background: #343a40;
} */
/* input[type=range]::-webkit-slider-runnable-track{
    background: #adb5bd;
}
input[type=range]::-moz-range-track{
    background: #adb5bd;
} */
/* 修正element ui 跑版 */
.el-input-number--mini i{
    padding: 7px;
}

.cursor-pointer{
    cursor: pointer;
}
.text-shadow{
    font-weight: bold;
    color: white;
    text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black;
}
.fade-enter-active, .fade-leave-active {
    transition: opacity .5s;
}
.fade-enter, .fade-leave-to{
    opacity: 0;
}
/* 轉換特效 fade-up */
.fade-up-enter-active {
    animation: fade-up 0.3s ease-out;
}
.fade-up-leave-active {
    animation: fade-up 0.3s reverse ease-in;
}
@keyframes fade-up {
    0% {
        opacity: 0;
        transform: translateY(10px);
    }
}
.fade-right-enter-active, .fade-right-leave-active {
    transition: opacity .5s,transform .5s;
}
.fade-right-enter, .fade-right-leave-to{
    opacity: 0;
    transform: translateX(-50%);
}
.fade-left-enter-active, .fade-left-leave-active {
    transition: opacity .5s,transform .5s;
}
.fade-left-enter, .fade-left-leave-to{
    opacity: 0;
    transform: translateX(50%);
}
</style>