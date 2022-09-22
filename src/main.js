import { createApp, defineAsyncComponent, h } from 'vue';
import './css/index.sass'

const getComponentsData = () => {
    const files = import.meta.glob([
        '@/components/**/**/**.vue',
        '@/components/**/**/**.js'
    ]);
    let components = [];

    for (const [location, component] of Object.entries(files)) {
        const name = location.split('/').pop().replace(/\.\w+$/, '')

        let kebab = name.replace(/[A-Z]/g, "-$&").toLowerCase() // String to kebab-case
        while(kebab.charAt(0) === '-'){kebab = kebab.substring(1)}

        components.push({
            name,
            selector: kebab,
            asyncComponent: defineAsyncComponent(component),
            ElegibleDOMElements: document.querySelectorAll(`${kebab}, ${name}`)
        })
    }

    return components;
}

const parsedAttributes = (HTMLElement) => {
    return HTMLElement
        .getAttributeNames()
        .reduce((acc, cur) => {
            let prop = cur;
            if(prop.charAt(0) === ':'){
                prop = prop.substring(1)
                try {
                    acc[prop] = JSON.parse( HTMLElement.getAttribute(cur) );
                } catch (e) {
                    acc[prop] = HTMLElement.getAttribute(cur);
                }
                return acc
            }

            acc[prop] = HTMLElement.getAttribute(cur);
            return acc
        }, {});
}

const getSlotName = (HTMLElement) => {
    const props = parsedAttributes(HTMLElement);
    const keys = Object.keys(props);
    let name = null;

    if (keys.some(k => k.startsWith('v-slot:'))) {
        name = keys.find(k => k.startsWith('v-slot:'));
        name = name.replace('v-slot:', '');
        HTMLElement.removeAttribute(`v-slot:${name}`)
    }
    
    if (keys.some(k => k.startsWith('#'))) {
        name = keys.find(k => k.startsWith('#'));
        name = name.substring(1);
        HTMLElement.removeAttribute(`#${name}`)
    }

    return name;
}

let Wisdom = window.Wisdom || {};
Wisdom.Base = Wisdom.Base || {};
Wisdom.Base.VueApps = Wisdom.Base.VueApps || [];
window.Wisdom = Wisdom;

const renderVueApp = (element, component) => {
    const vueApp = createApp(component);

    vueApp.mount(element);

    Wisdom.Base.VueApps.push(vueApp);

    const customComponents = getComponentsData();

    // Register All Components inside each Instance
    customComponents.forEach(co => {
        vueApp.component(co.selector, co.asyncComponent) // component-kebab-case
    });

    return vueApp;
}

const createHTML = text => {
    const parser = new DOMParser();
    const textToParse = `<div id="localizer">${text}</div>`; 
    const htmlDoc = parser.parseFromString(textToParse, 'text/html');
    const element = htmlDoc.getElementById('localizer');
    element.removeAttribute('id');
    return element;
}

const mountChildrenNodes = (element) => {
    const customComponents = getComponentsData();
    const tagName = element.tagName.toLowerCase();
    const component = customComponents.find(c => c.selector === tagName);
    const elementToRender = component ? component.asyncComponent : tagName; // HTML or custom elements
    let childs = [];
    let slots = {};

    for (const child of element.children) {
        if (child.tagName === 'TEMPLATE') {
            const slotName = getSlotName(child);
            const html = createHTML(child.innerHTML);
            const hasChildren = html.children.length > 0;
            slots[slotName] = () => hasChildren ? mountChildrenNodes(html) : html;
            continue;
        }
        childs.push(mountChildrenNodes(child));
    }

    const hasChildren = childs.length > 0;
    const innerHTML = element.innerHTML;
    slots[`default`] =  () => hasChildren ? [...childs] : innerHTML;

    return h(elementToRender, parsedAttributes(element), slots);
}

/**
 * Renders On Page Load
 */
window.addEventListener('load', () => {
    const customComponents = getComponentsData()
    const componentsTags = customComponents.reduce((acc, component) => [...acc, component.selector], [])
    let choosedToBeInstances = [];

    customComponents.map(component => {
        for (let elegibleDOMElement of component.ElegibleDOMElements) {
            const parentNodeTag = elegibleDOMElement.parentNode.tagName.toLowerCase()
            const isInsideCustomComponent = componentsTags.includes(parentNodeTag);

            if (!isInsideCustomComponent) {

                choosedToBeInstances.push({
                    elegibleDOMElement,
                    component: mountChildrenNodes(elegibleDOMElement)
                })
            }
        }
    })

    choosedToBeInstances.map(choosed => renderVueApp(choosed.elegibleDOMElement, choosed.component))

})
