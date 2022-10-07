import { App, createApp, defineComponent, Fragment, h, VNode } from 'vue';
// import {createApp} from 'vue/dist/vue.esm-browser.js';
import { getAttrs, getSlotData } from './html';
import { ClientlibComponent, PluginOptions } from './types/mytypes';

export class ViteClientLib {
    components: Array<ClientlibComponent>;
    componentsTags: Array<String>;

    constructor() {
        this.components = []
        this.componentsTags = []
    }

    loadComponents(componentFiles:Record<string, () => Promise<unknown>>): void {
        for (const key in componentFiles) {
            if (Object.prototype.hasOwnProperty.call(componentFiles, key)) {
                const file = componentFiles[key];
                let fileName = key.split('/').pop()?.replace(/\.\w+$/, '') as string;

                // PascalCase
                const name = fileName.charAt(0).toUpperCase() + fileName.slice(1);

                // kebab-case
                let kebab = name.replace(/[A-Z]/g, "-$&").toLowerCase()
                while(kebab.charAt(0) === '-'){kebab = kebab.substring(1)}

                this.components.push({
                    DOMElements: document.querySelectorAll(`${name}, ${kebab}`),
                    kebab,
                    module: defineComponent(file),
                    name,
                })

                this.componentsTags.push(kebab)
            }
        }
    }

    virtualize(element:Element): any {
        const tagName = element.tagName.toLowerCase();
        const component = this.components.find((c:ClientlibComponent) => c.kebab === tagName);
        const elementToRender = component ? component.module.default : tagName; // HTML or custom elements
        let childs:VNode[] = [];
        let slots:Record<string, Function> = {};

        for (const child of Array.from(element.children)) {
            if (child.tagName === 'TEMPLATE') {
                const slot = getSlotData(child);
                slots[slot.name] = () => slot.hasChildren ? this.virtualize(slot.html) : slot.html;
                continue;
            }
            childs.push(this.virtualize(child));
        }
    
        const hasChildren = childs.length > 0;
        const innerHTML = element.innerHTML;
        slots[`default`] =  () => hasChildren ? [...childs] : innerHTML;
    
        // return h(elementToRender, getAttrs(element), slots);
        // return { render: () => h(elementToRender, getAttrs(element), slots) };
        return component ?
            { render: () => h(elementToRender, getAttrs(element), slots) } :
            h(elementToRender, getAttrs(element));
    }

    filterInstances():Array<Record<any, any>> {
        const instances:Array<Record<any, any>> = [];
        this.components.map(component => {
            for (let element of Array.from(component.DOMElements)) {
                // TODO: Tem que fazer um loop até o body para Evitar CUSTOM->DIV->CUSTOM
                const parentNodeTag = element?.parentElement?.tagName.toLowerCase() as String;
                const isInsideCustomComponent = this.componentsTags.includes(parentNodeTag);

                if (!isInsideCustomComponent) {
                    const VNode = this.virtualize(element);
                    // const instance = createApp(VNode);
                    // instance.mount(element);
                    instances.push({
                        VNode,
                        element
                    })
                }
            }
        })
        return instances
    }

    renderInstances(): void {
        const instances:Array<Record<any, any>> = [];
        
        this.components.map(component => {
            for (let element of Array.from(component.DOMElements)) {
                // TODO: Tem que fazer um loop até o body para Evitar CUSTOM->DIV->CUSTOM
                const parentNodeTag = element?.parentElement?.tagName.toLowerCase() as String;
                const isInsideCustomComponent = this.componentsTags.includes(parentNodeTag);

                if (!isInsideCustomComponent) {
                    const VNode = this.virtualize(element);
                    // console.log(VNode.children.default());
                    // const instance = createApp(VNode);
                    const instance = createApp({
                        render: () => h(VNode)
                    });
                    console.log(instance);

                    this.components.map(co => instance.component(co.name as string, co.module.default) )
                    instance.mount(element);
                }
            }
        })
    }
}

export default {
    install: (app: App, options: PluginOptions) => {
        // for (const name in options.components) {
        //     if (Object.prototype.hasOwnProperty.call(options.components, name)) {
        //         const component = options.components[name];
        //         app.component(name, component)
        //     }
        // }
        const clientlib = new ViteClientLib();
        clientlib.loadComponents(options.components);
        clientlib.renderInstances();
    }
}