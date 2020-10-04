<template lang="pug">
.position-fixed.bg-light.rounded.shadow(:style="popupStyle")
    el-tabs(v-if="selectedFeatures.length" type="card" v-model="tabName")
        el-tab-pane.px-2.pb-2(label="屬性" name="屬性")
            table.table.table-sm.table-striped.mb-0
                tbody           
                    tr(v-for="val,key in attributes")
                        td {{key}}
                        td(v-html="val")
        el-tab-pane.px-2.pb-2(label="文字" name="文字")
            .d-flex.align-items-center.justify-content-between
                span.px-2.py-1 內容
                input.flex-grow-1(ref="text-input" type="text" style="width:100px" :value="style['text']" @keydown.stop="" @input="setSFP('text',$event.target.value)")
            .d-flex.align-items-center.justify-content-between 
                span.px-2.py-1 內容指定欄位
                select(@change="mapSFP('text',$event.target.value)")
                    option(value="")
                    option(v-for="prop in properties" :value="prop") {{prop}}                    
            .d-flex.justify-content-around
                div
                    span.px-2.py-1 位置
                    br
                    .btn.btn-sm.btn-outline-info(v-for="anchor in anchors.slice(0,3)" :key="anchor.name" :class="style['textAnchor']==anchor.value?'active':''" @click="setSFP('textAnchor',anchor.value)") {{anchor.symbol}}
                    br
                    .btn.btn-sm.btn-outline-info(v-for="anchor in anchors.slice(3,6)" :key="anchor.name" :class="style['textAnchor']==anchor.value?'active':''" @click="setSFP('textAnchor',anchor.value)") {{anchor.symbol}}
                    br
                    .btn.btn-sm.btn-outline-info(v-for="anchor in anchors.slice(6,9)" :key="anchor.name" :class="style['textAnchor']==anchor.value?'active':''" @click="setSFP('textAnchor',anchor.value)") {{anchor.symbol}}
                div
                    .d-flex.justify-content-between
                        span.px-2.py-1 填滿
                        span.px-2.py-1 陰影
                    .d-flex.justify-content-between
                        el-color-picker(show-alpha :value="style['textFill']" @active-change="setSFP('textFill',$event)")
                        .btn(@click="swapStyle('textFill','textStroke')")
                            i.el-icon-sort(style="transform:rotate(90deg);transform-origin:center")
                        el-color-picker(show-alpha :value="style['textStroke']" @active-change="setSFP('textStroke',$event)")
                    .d-flex.justify-content-between
                        input(type='number' :value="style['fontSize']" min='6' max='72' @input="setSFP('fontSize',$event.target.value*1)")
                        input(type='number' :value="style['fontWeight']" min='0' max='5' @input="setSFP('fontWeight',$event.target.value*1)")
            .px-2.py-1
                span 旋轉 {{style['textRotate']||0}}°
                input.custom-range.float-right(type="range" style="width:150px" min="-180" max="180" step="5" :value="style['textRotate']"
                    @dblclick="setSFP('textRotate',0)" @input="setSFP('textRotate',$event.target.value*1)")
            .px-2.py-1
                span 字型
                select.float-right(:value="style['fontFamily']" @input="setSFP('fontFamily',$event.target.value)")
                    option(v-for="fontFamily in fontFamilies" :value="fontFamily") {{fontFamily}}
        el-tab-pane.px-2.pb-2(label="框線" name="框線")
            .d-flex.align-items-center.justify-content-between.px-2.py-1
                span 透明度
                input.custom-range.float-right(type="range" :value="style['opacity']" min='0.1' max='1' step='0.1' style="width:150px;direction:rtl" @input="setSFP('opacity',$event.target.value*1)")
            .d-flex.align-items-center.justify-content-between.px-2.py-1
                span 半徑
                el-input-number(size="mini" :value="style['radius']" :min="0" @change="setSFP('radius',$event)")
            .d-flex.align-items-center.justify-content-between.px-2.py-1
                span 色彩
                el-color-picker(show-alpha :value="style['stroke']" @active-change="setSFP('stroke',$event)")
            .d-flex.align-items-center.justify-content-between.px-2.py-1
                span 寬度
                el-input-number(size="mini" :value="style['lineWidth']" :min="0" @change="setSFP('lineWidth',$event)")
            .d-flex.align-items-center.justify-content-between.px-2.py-1
                span 虛線
                span
                    input(type='number' :value="style['lineDash'][0]" min="0" @input="setSFP('lineDash',[$event.target.value*1,$event.target.value*1])")
                    input(type='number' :value="style['lineDashOffset']" min="0" @input="setSFP('lineDashOffset',$event.target.value*1)")
        el-tab-pane.px-2.pb-2(:label="rule.col==''?'填滿':rule.isGradient?'漸層設色':'分層設色'" name="填滿")
            .px-1.py-1
                .d-flex.align-items-center.justify-content-between
                    span.px-2.py-1 色彩
                    el-color-picker(show-alpha :value="style['fill']" @active-change="setSFP('fill',$event)")
                    span.px-2.py-1 指定欄位
                    select(v-model="rule.col" @change="updateRule()")
                        option(value="")
                        option(v-for="prop in properties" :value="prop") {{prop}}
                .w-100(v-if="rule.isGradient&&rule.col")
                    .d-flex.align-items-center(v-for="gd,i in rule.gradients" :key="i")
                        el-tooltip(:content="(rule.min+(rule.max-rule.min)*gd.pct).toFixed(2)" placement="left")
                            el-color-picker(show-alpha size="mini" v-model="gd.rgba" 
                                @change="updateRule();mapSFP('fill',rule.col,gradientColor)")
                        input.custom-range.mt-1(type="range" v-model.number="gd.pct" min="0" max="1" step="0.1" 
                            @input="updateRule();mapSFP('fill',rule.col,gradientColor)")
                        button.close(@click="rule.gradients.splice(i,1)")
                            span &times;
                    .btn-group.btn-group-sm
                        .btn.btn-outline-success(@click="rule.gradients.push({pct:1,rgba:'rgba(0,0,0,1)',arr:[0,0,0,1]})") 新色彩
                        .btn.btn-success(@click="fav.gradients.push([...rule.gradients.map(g=>({...g}))])") 新設定
                        .btn.btn-warning(v-for="fg,i in fav.gradients" :key="`gd${i}`" 
                            @click="rule.gradients=[...fg.map(g=>({...g}))];updateRule()"
                            @contextmenu.prevent="$delete(fav.gradients,i)") 設定{{i+1}}
                .w-100(v-else-if="!rule.isGradient&&rule.col")
                    .d-flex.align-items-center(v-for="(val,key) in rule.categories" :key="key")
                        span.flex-grow-1 {{key}}
                        el-color-picker(show-alpha size="mini" v-model="rule.categories[key]" 
                            @change="mapSFP('fill',rule.col,categoryColor);mapSFP('stroke',rule.col,categoryColor)")
                        button.close(@click="$delete(rule.categories,key)")
                            span &times;
                    .btn-group.btn-group-sm
                        .btn.btn-outline-success(@click="fav.categories.push({...rule.categories})") 新設定
                        .btn.btn-warning(v-for="fc,i in fav.categories" :key="`cat${i}`" 
                            @click="rule.categories={...fc.dict};updateRule(fc)"
                            @contextmenu.prevent="$delete(fc,i)") {{fc.name||`設定${i+1}`}}
        el-tab-pane.px-2.pb-2(label="常用樣式" name="常用樣式")            
            el-tooltip(content="新增常用樣式(右鍵刪除該樣式)")
                .btn(@click="$event.stopPropagation();addFavorite()") 
                    i.el-icon-plus
            .btn(v-for="favStyle,i in fav.styles" :key="`fav${i}`" @click="setFavorite(favStyle)" :style="getFavorite(favStyle)"
                @contextmenu.prevent="$delete(fav.styles,i)") {{i+1}}
</template>

<script>
import { mapState, mapGetters } from 'vuex'
export default {
    name: 'Styles',
    data:  ()=>({
        tabName: '屬性',
        defaultStyle: {
            stroke:'rgba(3,169,244,1)', fill:'rgba(0,0,255,0.3)', 
            textStroke:'rgba(255,255,255,1)',fontWeight:3,textFill:'rgba(0,0,0,1)'
        }, 
        anchors: [
            {name:'左上',symbol:'↖',value:'[-1,-1]'},
            {name:'上方',symbol:'↑',value:'[0,-1.2]'},
            {name:'右上',symbol:'↗',value:'[1,-1]'},
            {name:'左方',symbol:'←',value:'[-1.2,0]'},
            {name:'中間',symbol:'○',value:'[0,0]'},
            {name:'右方',symbol:'→',value:'[1.2,0]'},
            {name:'左下',symbol:'↙',value:'[-1,1]'},
            {name:'下方',symbol:'↓',value:'[0,1.2]'},
            {name:'右下',symbol:'↘',value:'[1,1]'},
        ],
        featureIndex:0, fav: {
            styles: [],
            gradients: [
                [
                    {pct:0,rgba:'rgba(244,67,54,1)'},
                    {pct:0.3,rgba:'rgba(255,152,0,1)'},
                    {pct:0.6,rgba:'rgba(255,235,59,1)'},
                    {pct:1,rgba:'rgba(76,175,80,1)'}
                ],
            ],
            categories: [
                {
                    name: '土地權屬',
                    dict:{
                        '公':'rgba(254,255,191,1)',
                        '私':'rgba(188,233,252,1)',
                        '公私共有':'rgba(202,214,159,1)',
                        '公法人':'rgba(215,177,158,1)',
                        '糖':'rgba(239,177,208,1)',
                        '(預設)':'rgba(204,204,204,1)'
                    }
                },{
                    name: '捷運代號',
                    dict:{
                        'O':'rgba(249,203,95,1)',
                        'G':'rgba(0,134,89,1)',
                        'BR':'rgba(196,140,49,1)',
                        'R':'rgba(227,0,44,1)',
                        'Y':'rgba(253,219,0,1)',
                        'BL':'rgba(0,112,189,1)',
                        'A':'rgba(122,68,153,1)'
                    }
                }
            ]
        },
        fontFamilies: ['微軟正黑體','serif','sans-serif','fantasy','monospace','標楷體'],
        rule:{min:0,max:100,col:'',categories:{},isGradient:true,gradients:[
            {pct:0,rgba:'rgba(244,67,54,1)'},
            {pct:0.3,rgba:'rgba(255,152,0,1)'},
            {pct:0.6,rgba:'rgba(255,235,59,1)'},
            {pct:1,rgba:'rgba(76,175,80,1)'},
        ]}, 
        colors:[
            'rgba(244,67,54,1)','rgba(233,30,99,1)','rgba(156,39,176,1)','rgba(103,58,183,1)',
            'rgba(63,81,181,1)','rgba(33,150,243,1)','rgba(3,169,244,1)','rgba(0,188,212,1)',
            'rgba(0,150,136,1)','rgba(76,175,80,1)','rgba(139,195,74,1)','rgba(205,220,57,1)',
            'rgba(255,235,59,1)','rgba(255,193,7,1)','rgba(255,152,0,1)','rgba(255,87,34,1)',
            'rgba(121,85,72,1)','rgba(158,158,158,1)','rgba(96,125,139,1)','rgba(255,255,255,0)'
        ],
        autoFocus: null,
    }),
    methods: {
        gradientColor(input){
            if(isNaN(input)||!this.rule.gradients.length) return this.style.fill
            const mapRange = (num,min,max,MIN,MAX)=>(num-min)/(max-min)*(MAX-MIN)+MIN
            let pct = mapRange(input,this.rule.min,this.rule.max,0,1)
            let gd1, gd2, gradients = this.rule.gradients.slice().sort((a,b)=>a.pct-b.pct)
            for(let i=0;i<gradients.length;i++){
                if(gradients[i].pct>pct){
                    gd1=i>0?gradients[i-1]:gradients[i]
                    gd2=gradients[i]
                    break
                }else if((i==0&&pct<gradients[i].pct)||i==gradients.length-1){
                    return gradients[i].rgba
                }
            }
            let arr = gd1.arr.map((min,i)=>mapRange(pct,gd1.pct,gd2.pct,min,gd2.arr[i])).map((x,i)=>i<3?parseInt(x):x)
            return `rgba(${arr[0]},${arr[1]},${arr[2]},${arr[3]})`
        },
        categoryColor(input){
            return this.rule.categories[input]||this.rule.categories['(預設)']
        },
        setSFP(key,value){
            this.interaction.setSelectedFeaturesProp(key,value)
            this.featureIndex=1;this.featureIndex=0 // force update
        },
        updateRule(preset){
            let props = this.selectedFeatures.map(f=>f.properties[this.rule.col])
            let values = props.filter(v=>!isNaN(v))
            this.rule.isGradient = values.length>this.selectedFeatures.length/2
            if(this.rule.isGradient){
                this.rule.max = Math.max(...values)
                this.rule.min = Math.min(...values)
                this.rule.gradients.map(gd=>{
                    gd.arr=gd.rgba.replace(/\s/g,'').match(/(\d+),(\d+),(\d+),(\d+)/i).slice(1,5).map((x,i)=>i<3?parseInt(x):x)
                })
                this.mapSFP('fill',this.rule.col,this.gradientColor)
            }else{
                if(preset){
                    this.categories = preset
                }else{
                    let entries = [...new Set(props)].slice(0,this.colors.length).map((key,i)=>([key,this.colors[i%this.colors.length]]))
                    this.rule.categories = Object.fromEntries(entries)
                    this.rule.categories['(預設)'] = ''
                }
                this.mapSFP('fill',this.rule.col,this.categoryColor)
                this.mapSFP('stroke',this.rule.col,this.categoryColor)
            }
        },
        mapSFP(fKey,tKey,rule=undefined){
            this.interaction.mapSelectedFeaturesProp(fKey,tKey,rule)
            this.featureIndex=1;this.featureIndex=0 // force update
        },
        swapStyle(s1,s2){
            let tmp = this.style[s1]
            this.setSFP(s1,this.style[s2])
            this.setSFP(s2,tmp)
        },
        addFavorite(){
            this.featureIndex=1;this.featureIndex=0 // force update
            let newStyle = Object.assign({},this.style)
            delete newStyle.text
            this.fav.styles.push(newStyle)
        },
        setFavorite(style){
            this.defaultStyle = style
            for(let key in style)
                this.setSFP(key,style[key])
        },
        getFavorite(style){
            let tS = style.textStroke, fW = style.fontWeight?1:0
            return {
                border:`solid ${style.lineWidth}px ${style.stroke}`,
                background:style.fill,
                color:style.textFill,
                textShadow:`-${fW}px 0 ${tS}, ${fW}px 0 ${tS}, 0 -${fW}px ${tS}, 0 ${fW}px ${tS}`
            }
        }
    },
    computed:{
        style(){
            if(this.selectedFeatures.length>this.featureIndex){
                let feature = this.selectedFeatures[this.featureIndex]
                return this.gismap.getDefaultStyle(feature)
            }else{return this.defaultStyle}
        },
        attributes(){
            return this.interaction.getFeaturesProp(this.selectedFeatures)
        },
        properties(){
            if(this.selectedFeatures.length){
                let feature = this.selectedFeatures[this.featureIndex]
                return Object.keys(feature.properties).filter(key=>!(key in this.style))
            }else{
                return []
            }
        },
        colorRule(){
            return this.rule.isGradient?this.gradientColor:this.categoryColor
        },
        popupStyle(){
            return {
                left: this.popupCoord[0]+'px',
                top: this.popupCoord[1]-20+'px',
                transform: 'translate(-50%,-100%)',
            }
        },
        ...mapState(['gismap','interaction','tab','popupCoord']),
        ...mapGetters(['selectedFeatures'])
    },
    created(){
        this.fav.styles = this.colors.map(color=>{
            return Object.assign({...this.defaultStyle},{stroke:color,fill:color.replace('1)','0.6)')})
        })
    },
    mounted(){
        this.autoFocus = window.addEventListener('keydown',e=>{
            if(!e.ctrlKey&&this.show){
                if(document.activeElement==document.body)
                    this.$refs['text-input'].focus()
            }
        })
    },
    beforeDestroy(){
        window.removeEventListener('keydown',this.autoFocus)
    }
}
</script>

<style scoped>
input[type="number"]{
    width: 50px;
    border: none;
    box-shadow: 0 0 3px 1px inset #cccccc;
    border-radius: 3px;
    margin-left: 4px;
}
input[type="text"]{
    border: none;
    box-shadow: 0 0 3px 1px inset #cccccc;
    border-radius: 3px;
}
select{
    box-shadow: 0 0 3px 1px inset #cccccc;
}
.bg-lightblue{
    background: lightblue;
}
.bg-lightyellow{
    background: lightyellow;
}
</style>