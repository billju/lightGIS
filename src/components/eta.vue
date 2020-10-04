<template lang="pug">
    ul.list-group
        li.list-group-item.list-group-item-dark.d-flex.justify-content-between.align-items-center(v-for="eta,i in busETAs" :key="i")
            span.badge.badge-secondary.badge-pill.text-center(style="font-size: 16px;width:60px") {{eta.time}}
            span.px-2(style="flex:1" v-html="eta.stop.replace('(','<br>(')")
            span.badge.badge-secondary {{eta.plate}}
</template>

<script>
export default {
    name:'ETA',
    props: ['busETAs']
}
</script>