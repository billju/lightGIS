<template lang="pug">
.w-100(v-if="tab=='向量'")
    .w-100.px-2.py-1(v-for="group,i in groups" :key="i" :class="groupIndex==i?`border border-${group.theme}`:'border-bottom'" @click="setState({groupIndex:i})")
        .py-1
            span(:class="group.opacity==0?'text-secondary':'text-dark'") {{group.name}}
                el-tooltip(v-if="groupIndex==i" content="重新命名" placement="bottom")
                    i.el-icon-edit-outline.ml-2(@click="renameGroupPrompt()").cursor-pointer
            select.float-right(v-model="group.propKey" :disabled="groupIndex!=i")
                option(v-if="groupIndex!=i") {{group.propKey}}
                option(v-else v-for="key in propKeys" :key="key" :value="key") {{key}}
        div(v-if="groupIndex==i")
            .btn-group.btn-group-sm.float-right
                el-popover(placement="right" trigger="click")
                    .btn.btn-sm.btn-outline-info(slot="reference")
                        i.el-icon-magic-stick
                    span 透明度
                    input.custom-range(type='range' min='0' max='1' step='0.1' value='0.8' style='direction:rtl' 
                        v-model.number="group.opacity" @input="setGroupProps(groupName,'opacity',$event.target.value)")
                el-tooltip(content="SOLO" placement="bottom")
                    .btn.btn-sm(:class="group.solo?'btn-warning':'btn-outline-info'" @click="toggleSolo()")
                        i.el-icon-switch-button
                el-tooltip(content="排序" placement="bottom")
                    .btn.btn-sm.btn-outline-info(@click="sortGroupFeature()")
                        i(:class="sortIcon")
                el-tooltip(content="資料表格" placement="bottom")
                    .btn.btn-outline-info(@click="renderTable(groupFeatures.map(f=>f.properties));setState({showDataTable:true})")
                        i.el-icon-menu
                el-tooltip(content="選取全部" placement="bottom")
                    .btn.btn-outline-info(@click="handleSelect(groupFeatures)")
                        i.el-icon-finished
                el-tooltip(content="移除群組" placement="bottom")
                    .btn.btn-outline-info(@click="removeGroupPrompt()")
                        i.el-icon-close
            ol.pr-3.my-1(style="clear:both;user-select:none")
                li.cursor-pointer.border-bottom(v-for="feature,i in slicedGroupFeatures" :key="i" 
                    :value="group.start+i+1"
                    :class="selectedFeatures.includes(feature)?'text-danger':feature.properties['opacity']==0?'text-secondary':'text-dark'"
                    @click="handleClickSelect(feature)"
                    @contextmenu="$event.preventDefault();handleClickSelect(feature);interaction.fitExtent([feature])") 
                        span {{type2icon[feature.geometry.type]}}
                        span.float-right {{feature.properties[group.propKey]}}
            el-pagination(small hide-on-single-page :page-size="maxItems" layout="prev,pager,next"
                :total="groupFeatures.length" @current-change="group.start=($event-1)*maxItems")
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import utilsMixin from '../mixins/utilsMixin.js'

export default {
    name: 'Vectors',
    mixins: [utilsMixin],
    methods: {
        toggleSolo(){
            let solo = !this.groups[this.groupIndex].solo
            this.setArrayOfObject('groups',this.groupIndex,{solo})
            for(let i=0;i<this.groups.length;i++){
                if(i!=this.groupIndex){
                    this.setArrayOfObject('groups',i,{
                        opacity: solo?0:this.groups[i].lastOpa,
                        lastOpa: this.groups[i].opacity
                    })
                }
            }
            this.gismap.vectors.filter(f=>f.properties['群組']!=this.groupName).map(f=>{
                if(solo){
                    f.properties['lastOpa'] = f.properties['opacity']??1
                    f.properties['opacity'] = 0
                }else if(f.properties['lastOpa']){
                    f.properties['opacity'] = f.properties['lastOpa']
                    delete f.properties['lastOpa']
                }
            })
        },
        sortGroupFeature(){
            let propKey = this.groups[this.groupIndex].propKey
            let dir = this.groups[this.groupIndex].sort
            dir = dir==0?1:dir==1?-1:0
            this.setArrayOfObject('groups',this.groupIndex,{sort: dir})
            this.gismap.vectors.sort((a,b)=>{
                if(a.properties['群組']==this.groupName&&b.properties['群組']==this.groupName)
                    return this.sortRule(a.properties,b.properties,propKey,dir)
                else
                    return 0
            })
        },
        handleClickSelect(feature){
            if(this.gismap.selectEvent.ctrlKey){
                if(this.selectedFeatures.includes(feature))
                    this.handleSelect(this.selectedFeatures.filter(f=>f!=feature))
                else
                    this.handleSelect([...this.selectedFeatures,feature])
            }else if(this.gismap.selectEvent.shiftKey&&
                this.selectedFeatures.some(f=>this.groupFeatures.includes(f))){
                let features = this.selectedFeatures.map(sf=>this.groupFeatures.findIndex(gf=>gf==sf)).filter(i=>i!=-1)
                let startIdx = Math.min(...features)
                let endIdx = this.groupFeatures.findIndex(f=>f==feature)
                if(startIdx>endIdx) [startIdx,endIdx] = [endIdx,startIdx]
                this.handleSelect(this.groupFeatures.slice(startIdx,endIdx+1))
            }else{
                this.handleSelect([feature])  
            }
        },
        handleGroupScroll(e){
            e.preventDefault()
            let offset = Math.sign(e.deltaY)*this.maxItems
            let group = this.groups[this.groupIndex]
            group.start = 
                group.start+offset<0?0:
                group.start+offset>=this.groupFeatures.length?group.start:group.start+offset
        },
        renameGroupPrompt(){
            let oldName = this.groupName
            let newName = prompt('變更群組名稱',oldName)
            if(this.groups.map(g=>g.name).includes(newName)&&oldName!=newName){
                alert(`${newName} 名稱重複了`)
            }else if(newName){
                this.setState(state=>{
                    state.groups
                })
                this.setArrayOfObject('groups',this.groupIndex,{name:newName})
                this.gismap.vectors.filter(f=>f.properties['群組']==oldName).map(f=>{f.properties['群組']=newName})
            }
        },
        setGroupProps(groupName,key,value){
            this.gismap.vectors.filter(f=>f.properties['群組']==groupName).map(f=>{f.properties[key]=value})
        },
        removeGroupPrompt(){
            if(this.groups.length==1){
                alert('至少要留一個群組')
            }else if(confirm('確定要移除群組？移除後資料將無法復原')){
                this.gismap.vectors = this.gismap.vectors.filter(f=>f.properties['群組']!=this.groupName)
                this.setState({
                    groups: this.groups.filter((_,i)=>i!=this.groupIndex),
                    groupIndex: this.groupIndex>0?this.groupIndex-1:0
                })
            }
        },
    },
    computed: {
        ...mapState(['groups','groupIndex','tmpFeatures','maxItems','type2icon']),
        ...mapGetters(['groupFeatures','groupName','groupRange','selectedFeatures','slicedGroupFeatures','filteredRows','propKeys','sortIcon']),
    },
}
</script>

<style scoped>

</style>