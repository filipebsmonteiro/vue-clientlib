<template>
    <slot name="before" />
    <h1>{{ title }}</h1>
    <pre>{{ title }}</pre>
    <slot />
    <slot name="after" />
</template>

<script>
export default {
    props: {
        title: {
            default: `CHECKBOX-DEFAULT`
        }
    }
}
</script>