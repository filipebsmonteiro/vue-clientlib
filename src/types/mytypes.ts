import { DefineComponent } from "vue";

// export declare type Component<T> = (props:T) => T | null | undefined
export declare type HTMLNullableElement<T> = (props:T|null) => T | null;

export declare type ClientlibComponent = {
    DOMElements: NodeListOf<Element>,
    kebab: String | string,
    module: DefineComponent,
    name: String | string
};

export declare type PluginOptions = {
    components: Record<string, () => Promise<unknown>>
}
