import { h, defineComponent } from 'vue'

import useSize, { useSizeProps } from '@/composables/use-size.js'

export default defineComponent({
  name: 'HubIcon',
  props: {
    ...useSizeProps,
    tag: {
      type: String,
      default: 'i'
    },
    src: String,
  },

  //setup (props, context)
  //setup (props, { slots })
  setup (props) {
    const sizeStyle = useSize(props)
    let icon = props.src
    let src = icon.substring(4)
    
    if (src.startsWith(`./`) || src.startsWith(`@/`)) {
      src = src.startsWith(`./`) ? src.replace(`./`, `@/`) : src
      src = import(src).then(response => response)
    }

    return () => h('img', {
      src,
      class: 'hub-icon',
      style: sizeStyle.value,
    })
  }
})
