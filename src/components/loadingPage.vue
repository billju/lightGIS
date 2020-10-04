<template lang="pug">
.position-fixed.w-100.h-100(ref="loadingPage" style="top:0;left:0").bg-dark
</template>

<script>
import utilsMixin from '../mixins/utilsMixin.js'

export default {
    name: 'loadingPage',
    mixins: [utilsMixin],
    methods: {
        svgAnimation(
            container,url,callback,style={
                strokeDasharray: 1000,
                strokeDashoffset: 1000,
                transition: 'stroke-dashoffset 3s ease-out',
                width:'100%',
                height:'100%',
            }){
            const xhr = new XMLHttpRequest();
            xhr.open("GET",url,false);
            xhr.overrideMimeType("image/svg+xml");
            xhr.onload = function() {
                xhr.responseText
                let svg = xhr.responseXML.documentElement
                Object.assign(svg.style,style)
                container.appendChild(svg);
                setTimeout(()=>{
                    svg.style.strokeDashoffset = 0
                    setTimeout(()=>{ callback() },2000)
                },100)
            }
            xhr.send();
        }
    },
    mounted(){
        this.svgAnimation(this.$refs.loadingPage,'light.svg',()=>{
            this.setState({isLoading:false})
        })
    }
}
</script>

<style scoped>

</style>