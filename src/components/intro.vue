<template lang="pug">
.position-fixed.bg-dark.text-light.w-100.h-100.d-flex.justify-content-center.align-items-center(style="left:0;top:0")
    el-carousel.w-100.mx-5(:interval="4000", type="card" trigger="click" @change="pageIndex=$event")
        el-carousel-item(v-for="img,i in imgs" :key="img.src")
            el-image.w-100.h-100(:src="img.src" fit="cover" @click="createTemplate(img.title)")
                .image-slot(slot="placeholder") 載入中
                    span.dot ...
                .image-slot(slot="error")
                    i.el-icon-picture-outline
            h3 {{ img.title }}
            p {{ img.text }}
    .btn.position-absolute.text-light(style="right:0;top:0" @click="setState({showDialog:false})")
        i.el-icon-close
</template>

<script>
import utilsMixin from '../mixins/utilsMixin.js'

export default {
    name: "Intro",
    mixins: [utilsMixin],
    data: () => ({
        pageIndex: 0,
        imgs: [
            { 
                src: "png/shortcut-metro.png", 
                title: "繪製路網圖", 
                text: "PTX>台北捷運>填滿>指定欄位>代號>捷運代號" ,
                tab: '隱藏',
            },
            {
                src: "png/shortcut-choropleth.png",
                title: "分層設色圖",
                text: "加入多邊形>選取>填滿>指定欄位",
                tab: '向量',
            },
            {
                src: "png/shortcut-bus.png",
                title: "公車即時動態",
                text: "PTX>公車>搜尋路線",
                tab: 'PTX',
            },
            { 
                src: "png/shortcut-heatmap.png", 
                title: "熱點圖", 
                text: "加入點位資料>設定>熱點圖",
                tab: '設定',
            },
            {
                src: "png/shortcut-ibike.png",
                title: "公共自行車即時佔位",
                text: "PTX>即時站位",
                tab: 'PTX',
            },
            {
                src: "png/shortcut-measure.png",
                title: "長度與面積測量",
                text: "點擊右鍵>連點左鍵兩下結束繪製",
                tab: '向量',
            },
            {
                src: "png/shortcut-raster.png",
                title: "網格疊圖分析",
                text: "網格>開關切換、推桿調整透明度、拖曳進行排序",
                tab: '網格',
            },
            { 
                src: "png/shortcut-table.png", 
                title: "資料表格檢索", 
                text: "向量>群組工具列>資料表格",
                tab: '向量',
            },
        ],
    }),
    methods:{
        createTemplate(title){
            let idx = this.imgs.findIndex(x=>x.title==title)
            if(idx!=this.pageIndex) return
            this.setState({
                showDialog: false,
                tab: this.imgs[idx].tab
            })
            switch(title){
                case '分層設色圖':
                    fetch('templates/B_population.geojson').then(res=>res.json()).then(json=>{
                        let features = this.gismap.geojson(json)
                        features.map(f=>{f.properties['opacity']=f.properties['區域別']=='西屯區'?1:0})
                        features = features.filter(f=>f.properties['區域別']=='西屯區')
                        this.interaction.fitExtent(features)
                        this.addGroup('村里界')
                    });break;
                case '繪製路網圖':
                    fetch('templates/TaipeiMetro.geojson').then(res=>res.json()).then(json=>{
                        let features = this.gismap.geojson(json)
                        this.interaction.fitExtent(features)
                        this.addGroup('台北捷運')
                    });break;
                default: break;
            }
        }
    },
};
</script>

<style>
.el-carousel__container {
    height: 500px !important;
}
</style>
<style scoped>
h3 {
    position: absolute;
    top: 10px;
    left: 10px;
    padding: 10px;
    background: rgba(0, 0, 0, 0.8);
}
p {
    position: absolute;
    bottom: 0;
    right: 10px;
    padding: 10px;
    max-width: 80%;
    background: rgba(0, 0, 0, 0.8);
}
</style>