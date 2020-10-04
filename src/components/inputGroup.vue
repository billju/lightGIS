<template lang="pug">
.input-group.input-group-sm
    .input-group-prepend
        span.input-group-text {{label}}
    slot
</template>

<script>
export default {
    name: 'InputGroup',
    props: {
        label: String,
    }
}
</script>