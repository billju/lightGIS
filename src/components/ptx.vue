<template lang="pug">
.px-2(v-if="tab=='PTX'" style="max-height:100%") 
    .input-group
        .input-group-prepend 
            span.input-group-text 所在縣市
        select.form-control(v-model="city")
            option(v-for="(val,key) in cities" :key="key" :value="key") {{val}}
        .btn.btn-outline-secondary.form-control(@click="setState({showDialog:true})") 更多應用
    .btn-group.w-100
        .btn.btn-outline-warning(v-for="(val,key) in tourTypes" :key="key" @click="Tourism(city,key)") {{val}}
    .btn-group.w-100
        .btn.btn-outline-danger(@click="Bike(city)") UBike即時站位
        .btn.btn-outline-success(@click="BusRoutes(city)") 查詢公車路線
    .btn-group.w-100
        .btn.btn-outline-primary(@click="THSR()") 高鐵
        .btn.btn-outline-primary(@click="TRA()") 台鐵
        //- .btn.btn-outline-primary(v-if="TRArows.length" @click="TRALiveBoard()") 動態
        //- input.btn.btn-outline-primary(v-if="TRArows.length" type='text' style='width:50px' v-model="TRAStationName" placeholer="車站名稱")
    .btn-group.w-100
        .btn.btn-outline-secondary(v-for="(val,key) in metroOperators" :key="key" @click="MetroRoute(key)") {{val}}
    div(v-if="(rows.length||busETAs.length)")
        .input-group
            .btn.btn-outline-success.form-control(@click="searchBus()") 搜尋
            input(type="text" v-model="keyword" placeholder="輸入關鍵字" @input="searching=true")
        .flex-grow-1(v-if="searching" style="max-height:600px;overflow-y:auto")
            table.table.table-sm.table-dark.table-striped.table-hover.w-100
                thead
                    tr
                        th(v-for="col in cols" :key="col" :style="colStyle") {{col}}
                tbody
                    tr(v-for="row,i in filteredRows" :key="i")
                        td(v-for="col in cols" :key="col" :style="colStyle") {{row[col]}}
        .flex-grow-1(v-else style="max-height:600px;overflow-y:auto")
            el-tabs(v-model="busTab" stretch :class="'bg-light'")
                el-tab-pane(label="去程" name="去程")
                    ETA(:busETAs="busETAs.filter(x=>x.dir==0)")
                el-tab-pane(label="返程" name="返程")
                    ETA(:busETAs="busETAs.filter(x=>x.dir==1)")
</template>

<script>
import { mapState } from 'vuex'
import utilsMixin from '../mixins/utilsMixin.js'
import ETA from './eta.vue'
import axios from 'axios'

export default {
    name: 'PTX',
    components: {ETA},
    mixins: [utilsMixin],
    data:()=>({
        keyword:'', TRAStationName:'基隆', TRArows: [],
        city:'Taichung', cities: {
            Taipei:'臺北市',NewTaipei:'新北市',Taoyuan:'桃園市',Taichung:'臺中市',Tainan:'臺南市',
            Kaohsiung:'高雄市',Keelung:'基隆市',Hsinchu:'新竹市',HsinchuCounty:'新竹縣',MiaoliCounty:'苗栗縣',
            ChanghuaCounty:'彰化縣',NantouCounty:'南投縣',YunlinCounty:'雲林縣',ChiayiCounty:'嘉義縣',
            Chiayi:'嘉義市',PingtungCounty:'屏東縣',YilanCounty:'宜蘭縣',HualienCounty:'花蓮縣',
            TaitungCounty:'臺東縣',KinmenCounty:'金門縣',PenghuCounty:'澎湖縣',LienchiangCounty:'連江縣'
        }, 
        cols: [], rows:[], busETAs:[], busTab: '去程', searching: true,
        tourTypes:{
            ScenicSpot:'景點',Restaurant:'餐廳',Hotel:'飯店',Activity:'活動'
        },
        metroOperator:'TRTC',metroOperators: {
            TRTC:'台北捷運', KRTC:'高雄捷運', TYMC:'桃園捷運', 
        }
    }),
    methods:{
        createTable(rows){
            this.cols = [...new Set(rows.flatMap(obj=>Object.keys(obj)))]
            let key = this.cols[0]
            this.rows = rows.sort((a,b)=>a[key].toString().localeCompare(b[key]))
        },
        fetchJSON(url){
            return new Promise((resolve,reject)=>{
                axios.get(url).then(res=>{
                    let json = res.data
                    if(Array.isArray(json)&&json.length)
                        resolve(json)
                    else
                        reject(new Error(JSON.stringify(json)))
                })
            })
        },
        renameArray(array,props){
            function nest(obj,key){
                function helper(obj,splitKey,idx=0){
                    if(idx>=splitKey.length-1)
                        return obj[splitKey[idx]]
                    else
                        return helper(obj[splitKey[idx]],splitKey,idx+1)
                }
                return helper(obj,key.split('.'))
            }
            return array.map(obj=>{
                let row = {}
                for(let key in props){
                    row[props[key]] = nest(obj,key)
                }
                return row
            })
        },
        props2select(props){
            return [...new Set(Object.keys(props).map(key=>key.split('.')[0]))].join(',')
        },
        async Tourism(city='Taichung',type='ScenicSpot'){
            const basicInfo = {
                'Name':'名稱',
                'Description':'敘述',
                'Phone':'電話',
                'Address':'地址',
                'Picture.PictureUrl1':'圖片網址',
                'Picture.PictureDescription1':'圖片簡介',
                'Position.PositionLat':'緯度',
                'Position.PositionLon':'經度'
            }
            let props = {
                ScenicSpot: {
                    ...basicInfo,
                    'OpenTime':'開放時間',
                },
                Restaurant: {
                    ...basicInfo,
                    'OpenTime':'開放時間',
                },
                Hotel: {
                    ...basicInfo,
                    'WebsiteUrl':'飯店網址',
                    'ParkingInfo':'停車資訊',
                },
                Activity: {
                    ...basicInfo,
                    'WebsiteUrl':'活動網址',
                    'Organizer':'主辦單位',
                },
            }[type]
            let json = await this.fetchJSON(`https://ptx.transportdata.tw/MOTC/v2/Tourism/${type}/${city}?$select=${this.props2select(props)}&$format=JSON`)
            if(json instanceof Error) return
            let group = this.cities[city]+this.tourTypes[type]
            let features = this.renameArray(json,props).map(row=>{
                return this.gismap.addVector('Point',[row['經度'],row['緯度']],{...row,'群組':group})
            })
            this.interaction.fitExtent(features)
            this.handleSelect(features)
            this.addGroup(group)
        },
        async BikeAvaiable(city='Taichung'){
            let props = {
                'StationUID':'UID',
                'ServiceAvailable':'服務中',
                'AvailableRentBikes':'可借',
                'AvailableReturnBikes':'可還',
            }
            let json = await this.fetchJSON(`https://ptx.transportdata.tw/MOTC/v2/Bike/Availability/${city}?$select=${this.props2select(props)}&$format=JSON`)
            return this.renameArray(json,props)
        },
        async Bike(city='Taichung'){
            let props = {
                'StationUID':'UID',
                'StationPosition.PositionLon':'經度',
                'StationPosition.PositionLat':'緯度',
                'StationName.Zh_tw':'站名',
                'StationAddress.Zh_tw':'地址',
                'BikesCapacity':'容量'
            }
            let json = await this.fetchJSON(`https://ptx.transportdata.tw/MOTC/v2/Bike/Station/${city}?$select=${this.props2select(props)}&$format=JSON`)
            if(json instanceof Error) return
            let avails = await this.BikeAvaiable(city)
            if(avails instanceof Error) return
            let group = 'Bike_'+city
            let features = this.renameArray(json,props).map(row=>{
                let idx = avails.findIndex(x=>x['UID']==row['UID'])
                let extProps = idx==-1?{}:avails[idx]
                return this.gismap.addVector('Point',[row['經度'],row['緯度']],{
                    ...row,...extProps,radius:10,'群組':group
                })
            })
            this.interaction.fitExtent(features)
            this.handleSelect(features)
            this.addGroup(group)
        },
        async searchBus(){
            if(!this.filteredRows.length) return
            let city = this.city
            let UID = this.filteredRows[0]['UID']
            let shape = await this.BusShape(city,UID)
            let stops = await this.BusStops(city,UID)
            this.BusETA(city,UID)
            this.interaction.fitExtent([...shape,...stops])
            this.handleSelect([...shape,...stops])
            this.addGroup(UID)
            this.searching = false
        },
        async BusRoutes(city='Taichung'){
            let props = {
                'RouteName.Zh_tw':'路線',
                'RouteUID':'UID',
                'DepartureStopNameZh':'起點',
                'DestinationStopNameZh':'迄點'
            }
            let json = await this.fetchJSON(`https://ptx.transportdata.tw/MOTC/v2/Bus/Route/City/${city}?$select=${this.props2select(props)}&$format=JSON`)
            if(json instanceof Error) return
            let rows = this.renameArray(json,props)
            this.createTable(rows)
        },
        async BusStops(city='Taichung',UID='TXG9'){
            let props = {
                'StopUID':'UID',
                'StopName.Zh_tw':'站名', 
                'StopSequence':'站序',
                'StopPosition.PositionLon':'經度',
                'StopPosition.PositionLat':'緯度',
            }
            let json = await this.fetchJSON(`https://ptx.transportdata.tw/MOTC/v2/Bus/StopOfRoute/City/${city}?$filter=RouteUID eq '${UID}'&$format=JSON`)
            if(json instanceof Error) return
            let route = json[0]
            let routeName = route['SubRouteName']['Zh_tw']
            let direction = route['Direction']
            return this.renameArray(route['Stops'],props).map(row=>{
                return this.gismap.addVector('Point',[row['經度'],row['緯度']],{
                    ...row,'路線':routeName,'方向':direction,'群組':UID,
                    fontWeight:3,fontFamily:'微軟正黑體',textFill:'rgba(255,255,255,1)',
                    textStroke:'rgba(0,0,0,1)',radius:6,lineWidth:3,text:row['站名']
                })
            })
        },
        async BusShape(city='Taichung',UID='TXG9'){
            let props = {
                'RouteName.Zh_tw':'路線',
                'Direction':'方向',
                'Geometry':'WKT'
            }
            let json = await this.fetchJSON(`https://ptx.transportdata.tw/MOTC/v2/Bus/Shape/City/${city}?$select=${this.props2select(props)}&$filter=RouteUID eq '${UID}'&$format=JSON`)
            if(json instanceof Error) return
            return this.renameArray(json,props).map(row=>{
                return this.gismap.WKT(row['WKT'],{
                    '路線':row['路線'],'方向':row['方向'],'群組':UID, lineWidth: 6, stroke:row['方向']?'dodgerblue':'grey'
                })
            })
        },
        async BusSchedule(city='Taichung',route=9){

        },
        async BusETA(city=this.city,UID='TXG9'){
            let json = await this.fetchJSON(`https://ptx.transportdata.tw/MOTC/v2/Bus/EstimatedTimeOfArrival/City/${city}?$select=PlateNumb,StopName,EstimateTime&$filter=NextBusTime ne null and RouteUID eq '${UID}'&$orderby=Direction,StopSequence&$format=JSON`)
            if(json instanceof Error) return
            this.busETAs = json.map(row=>{
                let date = new Date(row['NextBusTime'])
                let formateTime = ('0'+date.getHours()).substr(-2)+':'+('0'+date.getMinutes()).substr(-2)
                let formateEst = row['EstimateTime']>60?Math.floor(row['EstimateTime']/60):row['EstimateTime']
                return {
                    dir: row['Direction'],
                    time: row['EstimateTime']?formateEst+'分':formateTime,
                    stop: row['StopName']['Zh_tw'],
                    plate: row['PlateNumb']
                }
            })
        },
        async TRA(){
            let shapes = await this.TRAShape()
            let stations = await this.TRAStation()
            this.TRArows = stations.map(f=>f.properties)
            this.interaction.fitExtent([...shapes,...stations])
            this.handleSelect([...shapes,...stations])
            this.addGroup('台鐵')
        },
        async TRAShape(){
            let props = {
                'LineName.Zh_tw':'路線',
                'Geometry':'WKT'
            }
            let json = await this.fetchJSON(`https://ptx.transportdata.tw/MOTC/v2/Rail/TRA/Shape?$select=${this.props2select(props)}&$format=JSON`)
            if(json instanceof Error) return
            return this.renameArray(json,props).map(row=>{
                return this.gismap.WKT(row['WKT'],{'路線':row['路線'],'群組':'台鐵'})
            })
        },
        async TRAStation(){
            let props = {
                'StationID':'UID',
                'StationName.Zh_tw':'站名',
                'StationPosition.PositionLon':'經度',
                'StationPosition.PositionLat':'緯度',
                'StationAddress':'地址',
                'StationPhone':'聯絡電話',
                'StationClass':'車站級別'
            }
            let json = await this.fetchJSON(`https://ptx.transportdata.tw/MOTC/v2/Rail/TRA/Station?$select=${this.props2select(props)}&$format=JSON`)
            if(json instanceof Error) return
            return this.renameArray(json,props).map(row=>{
                return this.gismap.addVector('Point',[row['經度'],row['緯度']],{...row,'群組':'台鐵'})
            })
        },
        async TRALiveBoard(){
            let props = {
                'StationID':'UID',
                'StationName.Zh_tw':'站名',
                'TrainNo':'車次',
                'Direction':'方向',
                'TrainTypeName.Zh_tw':'車種',
                'EndingStationName.Zh_tw':'末站',
                'DelayTime':'延遲(分)',
                'ScheduledArrivalTime':'抵達',
                'ScheduledDepartureTime':'發車'
            }
            let matches = this.TRArows.filter(r=>r['站名'].match(this.TRAStationName))
            if(!matches.length) return 
            let StationID = matches[0]['UID']
            let json = await this.fetchJSON(`https://ptx.transportdata.tw/MOTC/v2/Rail/TRA/LiveBoard?$select=${this.props2select(props)}&$filter=StationID eq '${StationID}'&$format=JSON`)
            if(json instanceof Error) return
            this.createTable(this.renameArray(json,props))
        },
        async THSR(){
            let shapes = await this.THSRShape()
            let stations = await this.THSRStation()
            this.interaction.fitExtent([...shapes,...stations])
            this.handleSelect([...shapes,...stations])
            this.addGroup('高鐵')
        },
        async THSRShape(){
            let props = {
                'LineName.Zh_tw':'路線',
                'Geometry':'WKT'
            }
            let json = await this.fetchJSON(`https://ptx.transportdata.tw/MOTC/v2/Rail/THSR/Shape?$select=${this.props2select(props)}&$format=JSON`)
            if(json instanceof Error) return
            return this.renameArray(json,props).map(row=>{
                return this.gismap.WKT(row['WKT'],{'路線':row['路線'],'群組':'高鐵'})
            })
        },
        async THSRStation(){
            let props = {
                'StationID':'UID',
                'StationName.Zh_tw':'站名',
                'StationPosition.PositionLon':'經度',
                'StationPosition.PositionLat':'緯度',
                'StationAddress':'地址',
                'StationPhone':'聯絡電話',
            }
            let json = await this.fetchJSON(`https://ptx.transportdata.tw/MOTC/v2/Rail/THSR/Station?$select=${this.props2select(props)}&$format=JSON`)
            if(json instanceof Error) return
            return this.renameArray(json,props).map(row=>{
                return this.gismap.addVector('Point',[row['經度'],row['緯度']],{...row,'群組':'高鐵'})
            })
        },
        async MetroRoute(operator='TRTC'){
            let group = this.metroOperators[operator]
            let sol = await this.fetchJSON(`https://ptx.transportdata.tw/MOTC/v2/Rail/Metro/StationOfLine/${operator}?$format=JSON`)
            let shape = await this.MetroShape(operator)
            let station = await this.MetroStation(operator)
            let points = sol.flatMap(line=>{
                return line['Stations'].map(sta=>{
                    let idx = station.findIndex(x=>x['UID']==sta.StationID)
                    if(idx!=-1){
                        let row = station[idx]
                        return this.gismap.addVector('Point',[row['經度'],row['緯度']],{
                            ...row,'群組':group,'代號':line['LineNo']
                        })
                    }
                })
            }).filter(f=>f)
            this.interaction.fitExtent([...shape,...points])
            this.handleSelect([...shape,...points])
            this.addGroup(group)
        },
        async MetroShape(operator='TRTC'){
            let props = {
                'LineID':'代號',
                'LineName.Zh_tw':'路線',
                'Geometry':'WKT'
            }
            let json = await this.fetchJSON(`https://ptx.transportdata.tw/MOTC/v2/Rail/Metro/Shape/${operator}?$select=${this.props2select(props)}&$format=JSON`)
            if(json instanceof Error) return
            let group = this.metroOperators[operator]
            return this.renameArray(json,props).map(row=>{
                return this.gismap.WKT(row['WKT'],{
                    '代號':row['代號'],'路線':row['路線'],'群組':group
                })
            })
        },
        async MetroStation(operator='TRTC'){
            let props = {
                'StationID':'UID',
                'StationName.Zh_tw':'站名',
                'StationPosition.PositionLon':'經度',
                'StationPosition.PositionLat':'緯度',
                'StationAddress':'地址',
                'BikeAllowOnHoliday':'假日放單車',
            }
            let json = await this.fetchJSON(`https://ptx.transportdata.tw/MOTC/v2/Rail/Metro/Station/${operator}?$select=${this.props2select(props)}&$format=JSON`)
            if(json instanceof Error) return
            return this.renameArray(json,props)
        },
    },
    computed:{
        filteredRows(){
            if(!this.keyword) return this.rows
            return this.rows.map(row=>{
                let score = 100
                for(let col in row){
                    let match = row[col].match(this.keyword)
                    if(match){
                        score-= match.index+match.input.length
                        return {score,row}
                    }else{
                        score-= 2*row[col].length
                    }
                }
                return false
            }).filter(m=>m).sort((a,b)=>{
                return b.score-a.score
            }).map(m=>m.row)
        },
        colStyle(){
            return {width: `${100/this.cols.length}%`}
        },
        ...mapState(['gismap','interaction','tab'])
    },
    mounted(){

    }
}
</script>

<style scoped>

</style>