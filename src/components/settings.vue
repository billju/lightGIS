<template lang="pug">
.w-100(v-if="tab=='設定'")
    input(ref="file" type='file' style='display: none' @change='handleFiles($event.target.files)' multiple='true')
    .btn.btn-outline-primary.w-100(@click="$refs['file'].click()") 選取檔案或拖曳匯入
    .input-group
        .input-group-prepend
            .btn.btn-outline-success(@click="exportFile()") 匯出
        input.form-control.btn.btn-outline-success(type='text' :value="filename" @input="setState({filename:$event.target.value})" placeholder="檔案名稱")
        select.form-control.btn.btn-outline-success(:value="fileExtension" @change="setState({fileExtension:$event.target.value})")
            option(v-for="ext in extensions" :key="ext" :value='ext') {{ext}}
    .d-flex.align-items-center.justify-content-between.px-2.py-2.border-bottom
        span 檔案編碼
        select(:value="encoding" @change="setState({encoding:$event.target.value})")
            option(v-for="enc in encodings" :key="enc" :value="enc") {{enc}}
    .d-flex.align-items-center.justify-content-between.px-2.py-2.border-bottom
        span 背景顏色
        el-color-picker(size="mini" :value="bgColor" @active-change="setState({bgColor:$event})")
    .d-flex.align-items-center.justify-content-between.px-2.py-2.border-bottom
        span 顯示比例尺
        el-switch(:value="showScale" @input="setState({showScale:$event})")
    .d-flex.align-items-center.justify-content-between.px-2.py-2.border-bottom
        span 產生熱點圖
        el-switch(:value="gismap.notRenderPoints" @input="gismap.set('notRenderPoints',$event)")
    .d-flex.align-items-center.justify-content-between.px-2.py-2.border-bottom
        span 動畫插值
        el-switch(:value="allowAnimation" @change="toggleAnimation($event)")
    .d-flex.align-items-center.justify-content-between.px-2.py-2.border-bottom
        span 縮放間距
        el-input-number(size="mini" v-model="gismap.zoomEvent.delta" :min="0.1" :max="1" :step="0.05")
    .px-2.py-2.border-bottom
        span 縮放範圍
        span.float-right {{gismap.view.zoom}} / {{zoomRange}}
        .px-2.py-2
            el-slider(range show-stops :max="20" v-model="zoomRange"
                @input="gismap.view.minZoom=zoomRange[0];gismap.view.maxZoom=zoomRange[1]")
    Draggable(v-model="gismap.imageShapes" :animation="150")
        .d-flex.align-items-center.shadow.px-1.py-1.border.cursor-pointer(v-for="imageShape,i in gismap.imageShapes" :key="i" 
                :class="imageShape.editing?'border-danger':'border-light'" @click="imageShape.editing=!imageShape.editing")
            span.text-truncate.flex-shrink-0(style="width:100px") {{imageShape.filename}}
            .btn( @click="imageShape.editable=!imageShape.editable")
                i(:class="imageShape.editable?'el-icon-unlock text-danger':'el-icon-lock text-success'")
            input.custom-range(type='range' min='0' max='1' step='0.1' value='0.8' style='direction:rtl'
                v-model="imageShape.opacity" draggable='true' ondragstart='event.preventDefault();event.stopPropagation()')
            .btn(@click="gismap.imageShapes=gismap.imageShapes.filter(x=>x!=imageShape)")
                i.el-icon-close
    .text-secondary.text-center(v-if="!(gismap.imageShapes&&gismap.imageShapes.length)").py-1.px-2 拖曳匯入圖片開始
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import utilsMixin from '../mixins/utilsMixin.js'
import importMixin from '../mixins/importMixin.js'
import exportMixin from '../mixins/exportMixin.js'
import Draggable from 'vuedraggable'

export default {
    name: 'Settings',
    mixins: [importMixin,exportMixin,utilsMixin],
    components: {Draggable},
    data: ()=>({
        zoomRange: [0,17],
    }),
    computed: {
        ...mapState(['fileExtension','filename','bgColor','extensions','encoding','encodings','search','showScale','allowAnimation','tmpFeatures']),
    }
}
</script>

<style scoped>

</style>