import { createApp, defineAsyncComponent, defineComponent, h } from 'vue';

let customComponents = null;
const getComponentsData = () => {
    const componentFiles = import.meta.glob([
        '@/components/**/**/**.vue',
        // '@/components/**/**/**.js'
    ], { eager: true });
    // ]);
    let components = [];

    for (let [location, file] of Object.entries(componentFiles)) {
        const name = location.split('/').pop().replace(/\.\w+$/, '');
        let kebab = name.replace(/[A-Z]/g, "-$&").toLowerCase() // PascalCase to kebab-case
        while(kebab.charAt(0) === '-'){kebab = kebab.substring(1)}

        components.push({
            componentModule: defineComponent(file),
            ElegibleDOMElements: document.querySelectorAll(`${kebab}, ${name}`),
            file,
            name,
            selector: kebab,
        })
    }
    console.log(components);

    return components;
}

const parsedAttributes = (HTMLElement) => {
    return HTMLElement
        .getAttributeNames()
        .reduce((acc, cur) => {
            let prop = cur;
            try {
                acc[prop] = JSON.parse( HTMLElement.getAttribute(cur) );
            } catch (e) {
                acc[prop] = HTMLElement.getAttribute(cur);
            }

            if(prop.charAt(0) === ':') {
                prop = prop.substring(1);
            }

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

const renderVueApp = (element, rootComponent) => {
    const vueApp = createApp(rootComponent);

    // Register All Components Globally inside each Instance
    customComponents.forEach(co => {
        vueApp.component(co.name, co.componentModule.default)
    });

    vueApp.mount(element);

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
    const tagName = element.tagName.toLowerCase();
    const component = customComponents.find(c => c.selector === tagName);
    const elementToRender = component ? component.componentModule.default : tagName; // HTML or custom elements
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
    customComponents = getComponentsData();
    const componentsTags = customComponents.reduce((acc, component) => [...acc, component.selector, component.name], [])
    let choosedToBeInstances = [];

    customComponents.map(component => {
        for (let elegibleDOMElement of component.ElegibleDOMElements) {
            const parentNodeTag = elegibleDOMElement.parentNode.tagName.toLowerCase()
            const isInsideCustomComponent = componentsTags.includes(parentNodeTag);

            if (!isInsideCustomComponent) {
                choosedToBeInstances.push({
                    elegibleDOMElement,
                    rootComponent: mountChildrenNodes(elegibleDOMElement),
                    component
                })
            }
        }
    })

    choosedToBeInstances.map(choosed => {
        renderVueApp(choosed.elegibleDOMElement, choosed.rootComponent)
    })

})
