<template lang="pug">
.position-fixed.w-100.h-100.d-flex.flex-column(style="left:0;top:0;")
    .w-100.flex-grow-1.bg-dark(style="max-height:100%;overflow:auto")
        Spreadsheet.text-light(ref="spreadsheet" :rows="pagedRows" :cols="cols" @rename="renameColumnPrompt($event)" @remove="removeColumnPrompt($event)")
    .d-flex.justify-content-center.align-items-center.bg-white.py-1
        el-pagination(:page-size="maxRows" :page-count="10" layout="prev,pager,next" :total="filteredRows.length" @current-change="setState({tablePage:$event});$refs['spreadsheet'].resize()")
        input.btn.btn-sm.btn-outline-primary(type="text" :value="search" @input="setState({search:$event.target.value,tablePage:1})" placeholder="搜尋")
        .btn.btn-sm.btn-outline-success(v-if="isImportable" @click="confirmImport()") 匯入
        .btn.btn-sm.btn-outline-success(v-else-if="!isImporting" @click="confirmSelect()") 選取
        .btn.btn-sm.btn-outline-success(v-else @click="leftJoin()") 合併
        el-popover(placement="top" trigger="click")
            .btn.btn-sm.btn-outline-info(slot="reference") 其他
            InputGroup(label="每頁顯示" :class="'align-items-center'")
                input.custom-range.form-control(type="range" v-model.number="maxRows" min="5" max="100" @change="setState({tablePage:1});$refs['spreadsheet'].resize()")
            .w-100.border-bottom.mb-1.pb-1(v-if="isImporting")
                InputGroup(label="新增群組-名稱")
                    input.form-control(type="text" :value="filename" @input="setState({filename:$event.target.value})")
                InputGroup(label="緯度-欄位")
                    select.form-control(v-model="importParams.lat")
                        option(v-for="col,ci in cols" :key="ci" :value="col.key") {{col.key}}
                InputGroup(label="經度-欄位")
                    select.form-control(v-model="importParams.lng")
                        option(v-for="col,ci in cols" :key="ci" :value="col.key") {{col.key}}
                InputGroup(label="WKT-欄位")
                    select.form-control(v-model="importParams.WKT")
                        option(v-for="col,ci in cols" :key="ci" :value="col.key") {{col.key}}
            .w-100.border-bottom.mb-1.pb-1(v-if="isImporting")
                InputGroup(label="表格合併-欄位")
                    select.form-control(v-model="importParams.rightTableColumn")
                        option(v-for="col,ci in cols" :key="ci" :value="col.key") {{col.key}}
                InputGroup(label="目標群組-名稱")
                    select.form-control(:value="groupIndex" @change="setState({groupIndex:$event.target.value})")
                        option(v-for="group,gi in groups" :key="gi" :value="gi") {{group.name}}
                InputGroup(label="目標群組-欄位")
                    select.form-control(:value="groups[groupIndex].propKey" @change="setArrayOfObject('groups',groupIndex,{propKey:$event.target.value})")
                        option(v-for="key in propKeys" :key="key" :value="key") {{key}}
            .w-100.border-bottom.mb-1.pb-1
                InputGroup(label="新欄位名稱")
                    input.form-control(type="text" v-model="newColParams.name")
                InputGroup(label="新增方式")
                    select.form-control(v-model="newColParams.operator")
                        option(v-for="operator in operators" :key="operator.name" :value="operator.fn") {{operator.name}}
                InputGroup(label="欄位A")
                    select.form-control(v-model="newColParams.colA")
                        option(v-for="col,ci in cols" :key="ci" :value="col.key") {{col.key}}
                InputGroup(label="欄位B")
                    select.form-control(v-model="newColParams.colB")
                        option(v-for="col,ci in cols" :key="ci" :value="col.key") {{col.key}}
                InputGroup(label="常數A")
                    input.form-control(type="text" v-model="newColParams.constA")
                InputGroup(label="常數B")
                    input.form-control(type="text" v-model="newColParams.constB")
            .w-100.btn-group.btn-group-sm
                button.btn.btn-outline-success(@click="createNewColumn()") 新增欄位
                el-popover(placement="right" trigger="click")
                    button.btn.btn-outline-info(slot="reference") 匯出檔案
                    InputGroup(label="檔案名稱")
                        input.form-control(type='text' :value="filename" @input="setState({filename:$event.target.value})" placeholder="檔案名稱")
                    InputGroup(label="編碼格式")
                        select.form-control(:value="encoding" @change="setState({encoding:$event.target.value})")
                            option(v-for="enc in encodings" :key="enc" :value="enc") {{enc}}
                    InputGroup(label="匯出")
                        .btn.btn-outline-success.form-control(@click="exportJSON(pagedRows)") 匯出JSON
                        .btn.btn-outline-success.form-control(@click="exportCSV(pagedRows)") 匯出CSV
        .btn.btn-sm.btn-outline-danger(@click="setState({isImporting:false,showDataTable:false});") 關閉
</template>

<script>
import {mapState, mapGetters} from 'vuex'
import utilsMixin from '../mixins/utilsMixin.js'
import exportMixin from '../mixins/exportMixin.js'
import InputGroup from './inputGroup.vue'
import Spreadsheet from './spreadsheet.vue'

export default {
    name: 'DataTable',
    components: {InputGroup,Spreadsheet},
    data: ()=>({
        maxRows: 20, operators: [
            {name:'產生空白欄位',fn:(a,b)=>''},
            {name:'字串A+字串B',fn:(a,b)=>a.toString()+b.toString()},
            {name:'取出字串A的數字',fn:(a,b)=>(a.match(/[\d.]+/i)||[])[0]},
            {name:'數字A+數字B',fn:(a,b)=>parseFloat(a)+parseFloat(b)},
            {name:'數字A-數字B',fn:(a,b)=>parseFloat(a)-parseFloat(b)},
            {name:'數字A*數字B',fn:(a,b)=>parseFloat(a)*parseFloat(b)},
            {name:'數字A/數字B',fn:(a,b)=>parseFloat(a)/parseFloat(b)},
            {name:'數字A%數字B',fn:(a,b)=>parseFloat(a)%parseInt(b)},
        ],
        newColParams: {name:'',colA:'',colB:'',operator:'產生空白欄位',constA:'',constB:''},
        importParams: {lat:'',lng:'',WKT:'',rightTableColumn:''},
    }),
    mixins: [utilsMixin,exportMixin],
    methods: {
        confirmImport(){
            let features = []
            let {lng,lat,WKT} = this.importParams
            if(this.tmpFeatures.length){
                features = this.tmpFeatures.filter(f=>this.filteredRows.includes(f.properties))
                // add group name
                features.map(f=>{f.properties['群組']=f.properties['群組']??this.filename})
                let groupNames = [...new Set(features.map(f=>f.properties['群組']))].filter(g=>g)
                for(let groupName of groupNames)
                    this.addGroup(groupName)
                // add vector
                this.gismap.geojson({type:'FeatureCollection',features})
                this.interaction.fitExtent(features)
                this.handleSelect(features)
                this.setState({tmpFeatures: []})
            }else if(lng&&lat){
                features = this.filteredRows.filter(row=>!(isNaN(row[lng])||isNaN(row[lat]))).map(row=>{
                    return this.gismap.addVector('Point',[row[lng],row[lat]],{...row,'群組':this.filename})
                })
                this.interaction.fitExtent(features)
                this.handleSelect(features)
                this.addGroup(this.filename)
            }else if(WKT){
                features = this.filteredRows.filter(row=>row[WKT]).map(row=>{
                    let props = {...row,'群組':this.filename}
                    delete props[WKT]
                    return this.gismap.WKT(row[WKT],props)
                })
                this.interaction.fitExtent(features)
                this.handleSelect(features)
                this.addGroup(this.filename)
            }
            this.interaction.fitExtent(features)
            this.handleSelect(features)
            this.setState({showDataTable:false})
        },
        confirmSelect(){
            let features = this.groupFeatures.filter(f=>this.filteredRows.includes(f.properties))
            this.handleSelect(features)
            this.setState({showDataTable:false})
            this.interaction.fitExtent(features)
        },
        createNewColumn(){
            let {name, colA, colB, operator, constA, constB} = this.newColParams
            let rows = this.rows.map(row=>{
                let A = constA===''&&colA?row[colA]:constA
                let B = constB===''&&colB?row[colB]:constB
                row[name] = typeof operator=='function'?operator(A||'',B||''):''
                return row
            })
            this.setState({ rows })
            this.renderTable(rows)
            this.$refs['spreadsheet'].resize()
        },
        renameColumnPrompt(col){
            let newName = prompt('變更欄位名稱',col.key)
            if(this.cols.map(col=>col.key).includes(newName)){
                alert(`${newName} 名稱重複了`)
            }else if(newName){
                this.setState({
                    rows: this.rows.map(oldRow=>{
                        let row = {...oldRow}
                        row[newName] = row[col.key]
                        delete row[col.key]
                        return row
                    })
                })
                col.key = newName
            }
        },
        removeColumnPrompt(col){
            let isConfirm = confirm(`確定刪除欄位${col.key}?`)
            if(!isConfirm) return
            this.setState({
                rows: this.rows.map(row=>{
                    delete row[col.key]
                    return row
                }),
                cols: this.cols.filter(c=>c.key!=col.key)
            })
            this.$refs['spreadsheet'].resize()
        },
        updateColumnList(){
            for(let col of this.cols){
                col.list = [...new Set(this.filteredRows.map(obj=>obj[col.key]))]
                    .sort((a,b)=>this.sortRule(a,b,null,1)).slice(0,100)
            }
        },
        leftJoin(){
            let rtc = this.importParams.rightTableColumn
            let ltc = this.groups[this.groupIndex].propKey
            for(let feature of this.groupFeatures){
                let prop = feature.properties[ltc]
                let idx = this.rows.findIndex(row=>row[rtc]==prop)
                if(idx!=-1){
                    feature.properties = {...feature.properties,...this.rows[idx]}
                }
            }
            this.setState({
                isImporting:false,
                showDataTable:false
            })
        },
    },
    computed: {
        ...mapState(['groups','groupIndex','tmpFeatures']),
        ...mapState(['showDataTable','isImporting', 'rows', 'cols','tablePage','search','filename','encoding','encodings']),
        ...mapGetters(['groupFeatures','groupName','groupRange','selectedFeatures','slicedGroupFeatures','filteredRows','propKeys','sortIcon']),
        isImportable(){
            let {lng,lat,WKT} = this.importParams
            return this.isImporting&&( this.tmpFeatures.length||(lng&&lat)||WKT )
        },
        pageStartIndex(){
            return (this.tablePage-1)*this.maxRows
        },
        pagedRows(){
            let si = (this.tablePage-1)*this.maxRows
            let ei = this.tablePage*this.maxRows
            return this.filteredRows.slice(si,ei)
        }
    },
    mounted(){
        
    },
    beforeDestroy(){
        
    }
}
</script>

<style scoped>

</style>