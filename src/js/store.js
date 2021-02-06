// scp -r lightGIS root@172.105.120.225:/home/admin/dist/
import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)
const state = {
    // global
    isLoading: true, showDialog: true, 
    tab:'', tabs: ['網格','向量','設定','PTX','調色','提示'],
    gismap: {
        getSelectedFeatures:()=>([]),
        zoomEvent:{delta:0.5},
        view: {zoom:0,minZoom:0,maxZoom:20},
        notRenderPoints:false
    }, 
    interaction: {}, 
    heatmap: {},

    // styles
    popupCoord: [0,0],

    // settings
    fileExtension: '.geojson', filename: 'lightGIS', bgColor:'#333333', 
    extensions:['.geojson','.png','.svg','.csv','.json'], encoding:'utf-8', encodings: ['utf-8','big5','gb2312'],
    search: '', showScale:true, allowAnimation: true, 

    // data table
    showDataTable: false, isImporting:false, 
    rows: [], cols:[], 
    tablePage: 1, maxItems:20, zoomRange: [0,20],

    // vector
    groupIndex:0, groups:[], tmpFeatures:[], 
    type2icon: {
        Point:'點',MultiPoint:'點(多重)',
        LineString:'線',MultiLineString:'線(多重)',
        Polygon:'面',MultiPolygon:'面(多重)'
    },

    // raster
    rasters: [
        {url:'https://lohas.taichung.gov.tw/arcgis/rest/services/Tiled3857/URBAN3857/MapServer/tile/{z}/{y}/{x}?blankTile=false&token={token}',name:'臺中都市計畫',opacity:0.8,active:false},
        {url:'https://lohas.taichung.gov.tw/arcgis/rest/services/Tiled3857/Land3857/MapServer/tile/{z}/{y}/{x}?blankTile=false&token={token}',name:'地段及地籍圖',opacity:0.8,active:false},
        // {url:'https://lohas.taichung.gov.tw/arcgis/rest/services/Tiled3857/LandPriceMapAA163857/MapServer/tile/{z}/{y}/{x}?blankTile=false&token={token}',name:'公告現值',opacity:0.8,active:false},
        // {url:'https://lohas.taichung.gov.tw/arcgis/rest/services/Tiled3857/LandPriceMapAA173857/MapServer/tile/{z}/{y}/{x}?blankTile=false&token={token}',name:'公告地價',opacity:0.8,active:false},
        {url:'https://eghouse.hccg.gov.tw/arcgis/rest/services/Tiled3857/Nature_policy/MapServer/tile/{z}/{y}/{x}?blankTile=false',name:'特殊管制',opacity:0.8,active:false},
        {url:'https://eghouse.hccg.gov.tw/arcgis/rest/services/Tiled3857/Nature_water/MapServer/tile/{z}/{y}/{x}?blankTile=false',name:'水源水質',opacity:0.8,active:false},
        {url:'https://eghouse.hccg.gov.tw/arcgis/rest/services/Tiled3857/Nature_geo/MapServer/tile/{z}/{y}/{x}?blankTile=false',name:'地質敏感',opacity:0.8,active:false},
        {url:'https://eghouse.hccg.gov.tw/arcgis/rest/services/Tiled3857/Nature_environment/MapServer/tile/{z}/{y}/{x}?blankTile=false',name:'環保與汙染',opacity:0.8,active:false},
        {url:'https://eghouse.hccg.gov.tw/arcgis/rest/services/Tiled3857/SlopeTW3857_fix/MapServer/tile/{z}/{y}/{x}?blankTile=false',name:'坡度示意圖',opacity:0.8,active:false},
        {url:'https://wmts.nlsc.gov.tw/wmts/LUIMAP/default/EPSG:3857/{z}/{y}/{x}',name:'國土利用',opacity:0.8,active:false},
        {url:'https://wmts.nlsc.gov.tw/wmts/LAND_OPENDATA/default/EPSG:3857/{z}/{y}/{x}',name:'公有土地',opacity:0.8,active:false},
        {url:'https://wmts.nlsc.gov.tw/wmts/SCHOOL/default/EPSG:3857/{z}/{y}/{x}',name:'學校',opacity:0.8,active:false},
        {url:'https://wmts.nlsc.gov.tw/wmts/Village/default/EPSG:3857/{z}/{y}/{x}',name:'村里界',opacity:0.8,active:false},
        {url:'https://wmts.nlsc.gov.tw/wmts/TOWN/default/EPSG:3857/{z}/{y}/{x}',name:'鄉市鎮界',opacity:0.8,active:false},
        {url:'https://wmts.nlsc.gov.tw/wmts/CITY/default/EPSG:3857/{z}/{y}/{x}',name:'縣市界',opacity:0.8,active:false},
        {url:'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',name:'OSM',opacity:1,active:true,max:18},
        {url:'https://wmts.nlsc.gov.tw/wmts/EMAP5/default/EPSG:3857/{z}/{y}/{x}',name:'通用',opacity:1,active:false},
        {url:'https://wmts.nlsc.gov.tw/wmts/EMAP01/default/EPSG:3857/{z}/{y}/{x}',name:'灰階',opacity:1,active:false},
        {url:'https://wmts.nlsc.gov.tw/wmts/PHOTO2/default/EPSG:3857/{z}/{y}/{x}',name:'航照',opacity:1,active:false},
        {url:'https://mts1.google.com/vt/lyrs=s@186112443&hl=x-local&src=app&x={x}&y={y}&z={z}&s=Galile',name:'Google衛星',opacity:1,active:false},
        {url:'https://mts1.google.com/vt/lyrs=p@186112443&hl=x-local&src=app&x={x}&y={y}&z={z}&s=Galile',name:'Google地形',opacity:1,active:false},
        {url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',name:'ESRI衛星',opacity:1,active:false},
        {url:'https://wmts.nlsc.gov.tw/wmts/EMAPX99/default/EPSG:3857/{z}/{y}/{x}',name:'交通路網',opacity:1,active:false},
    ].map(raster=>{
        const token = "UZMPyXsuwgyREeneNi2o3mp6SSYCht9zGRUDfXbTKTa6iKGWKil43fWhCLLBvg5hlY7PTjQOMvMveuxhe1vYCg.."
        raster.url = raster.url.replace('{token}',token)
        return raster
    }),
}
const mutations = {
    setState(state, payload){
        if(typeof payload=='object'){
            Object.assign(state, payload)
        }else if(typeof payload=='function'){
            Object.assign(state, payload(state))
        }
    }
}
const getters = {
    groupFeatures(state,getters){
        let vectors = state.gismap.vectors
        return vectors?vectors.filter(v=>v.properties['群組']==getters.groupName):[]
    },
    groupName(state,getters){
        return state.groups[state.groupIndex].name
    },
    groupRange(state,getters){
        let group = state.groups[state.groupIndex]
        let length = getters.groupFeatures.length
        let start = group.start>=length?0:group.start+1
        let end = group.start+state.maxItems>length?length:group.start+state.maxItems
        return {start,end,length}
    },
    selectedFeatures(state,getters){
        return state.gismap.getSelectedFeatures()
    },
    slicedGroupFeatures(state,getters){
        let start = state.groups[state.groupIndex].start
        return getters.groupFeatures.slice(start,start+state.maxItems)
    },
    filteredRows(state,getters){
        const sortRule = (a,b,key,direction=1)=>{
            let A = key?a[key]:a
            let B = key?b[key]:b
            if(A==undefined||B==undefined) return 0
            return isNaN(A)?A.toString().localeCompare(B.toString())*direction:(A-B)*direction
        }
        let rows = state.rows.slice()
        for(let col of state.cols)
            if(col.filter.length)
                rows = rows.filter(row=>col.filter.includes(row[col.key]))
        if(state.search){
            let cols = state.cols.filter(col=>!col.filter)
            rows = rows.filter(row=>{
                return cols.some(col=>{
                    if(row[col.key]==undefined) return false
                    else return row[col.key].toString().match(state.search)
                })
            })
        }
        for(let col of state.cols)
            if(col.sort!=0)
                rows.sort((a,b)=>sortRule(a,b,col.key,col.sort))
        return rows
    },
    propKeys(state,getters){
        return [...new Set(getters.groupFeatures.flatMap(f=>Object.keys(f.properties)))]
    },
    sortIcon(state,getters){
        if(!state.groups[state.groupIndex]) return 'el-icon-d-caret'
        let dir = state.groups[state.groupIndex].sort
        switch(dir){
            case 0: return 'el-icon-d-caret'
            case 1: return 'el-icon-top'
            case -1: return 'el-icon-bottom'
        }
    },
}
const actions = {

}
export default new Vuex.Store({ state, mutations, getters, actions })