
export function getAttrs(element:Element): Object {
    return element.getAttributeNames()
        .reduce((acc:Record<string, any>, cur:string) => {
            let prop:string = cur;
            // TODO: Identify why not objcts and array of objects cant be attribute of :attribute
            if(prop.charAt(0) === ':') {
                prop = prop.substring(1);
            }

            try {
                // TODO: Parse based on componentModule.props
                acc[prop] = JSON.parse( element.getAttribute(cur) || `` );
            } catch (e) {
                acc[prop] = element.getAttribute(cur);
            }

            return acc
        }, {});
}

export function parse(text:String): Element {
    const parser = new DOMParser();
    const textToParse = `<div id="localizer">${text}</div>`; 
    const htmlDoc = parser.parseFromString(textToParse, 'text/html');
    const element = htmlDoc.getElementById('localizer') as Element;
    element.removeAttribute('id');
    return element;
}

export function getSlotName(element:Element): string {
    const props = getAttrs(element);
    const keys = Object.keys(props);
    let name:string = ``;

    if (keys.some(k => k.startsWith('v-slot:'))) {
        name = keys.find(k => k.startsWith('v-slot:')) as string;
        name = name.replace('v-slot:', '');
        element.removeAttribute(`v-slot:${name}`)
    }
    
    if (keys.some(k => k.startsWith('#'))) {
        name = keys.find(k => k.startsWith('#')) as string;
        name = name.substring(1);
        element.removeAttribute(`#${name}`)
    }

    return name;
}

export function getSlotData(element:Element) {
    const html:Element = parse(element.innerHTML);
    const hasChildren = html.children.length > 0;

    return {
        name: getSlotName(element),
        hasChildren,
        html
    }
}