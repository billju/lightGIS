<template lang="pug">
.px-2.py-2(v-if="tab=='提示'")
    h5.border-bottom.px-2.py-1 網格切換
    ul
        li 點擊文字或開關打開網格底圖
        li 拉動滑桿可調整透明度
        li 按住文字拖曳可排序圖層先後順序
        li 可新增自定義WMS伺服器
    h5.border-bottom.px-2.py-1 向量繪製
    ul
        li 點擊右鍵開始繪製
        li 連點兩下左鍵結束
        li 點：如果滑鼠待在原點
        li 線：如果連線沒有閉合
        li 面：如果最後一點與第一點重疊
        li 點擊或框選(ctrl+左鍵)進行向量選取
        li ctrl+左鍵+移動：框選
        li ctrl+左鍵單點：切換選取
        li ctrl+x：剪下(複製並刪除)
        li ctrl+z：復原刪除
        li ctrl+c：複製
        li ctrl+v：貼上
        li ctrl+b：原地複製貼上
        li 方向鍵：微調位置
    h5.border-bottom.px-2.py-1 向量管理
    ul
        li 左上方為群組名稱(不重複)
        li 右上方為顯示欄位
        li 只有選取該群組才會顯示工具列
        li 工具列第一項為透明度調整
        li 若透明度調為零便可隱藏該群組
    h5.border-bottom.px-2.py-1 設定
    ul
        li 檔案匯入支援圖片(jpeg,png等)、向量(geojson,kml)、文字檔(csv,json)
        li 圖片：可拖曳、鎖定或調整透明度
        li geojson：匯出所有向量檔案
        li png：網頁大小為尺寸的圖片檔
        li svg：可匯入繪圖軟體進行加工
        li 熱點圖：將所有資料點轉為熱點圖，調高半徑會有不一樣的效果
    h5.border-bottom.px-2.py-1 PTX
    ul
        li 交通部大眾運輸資料平台
        li 所在縣市：以下資料將依此搜尋
        li 觀光-點位資料
            ul
                li 景點
                li 餐廳
                li 旅館
                li 活動
        li 公共自行車：即時租借狀況查詢
        li 公車：查詢各路線、站點及預估抵達時間
        li 火車：全台路線站點及班表
        li 高鐵：全台路線站點
        li 捷運：車站與路網
</template>

<script>
import utilsMixin from '../mixins/utilsMixin.js'

export default {
    name: 'Tutorial',
    mixins: [utilsMixin],
}
</script>

<style scoped>
.el-carousel__item{
    background: #99a9bf;
}
</style>