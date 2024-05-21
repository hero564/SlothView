export type Parameters = Record<string, any>;

export type Properties = {};

export type ElementFunction<ElementType extends HTMLElement = HTMLElement> = (root: HTMLElement) => ElementType;
export type ElementChild = ElementFunction | string;
export type ElementChildren = Array<ElementChild>;

export function createElement<ElementType extends HTMLElement>(
    tag: string, 
    params: Parameters = {}, 
    children: ElementChildren = [],
    onMount?: (that: ElementType) => void
): ElementFunction<ElementType> {
    return (root: HTMLElement) => {
        const el: ElementType = document.createElement(tag) as ElementType;
        Object.keys(params).forEach((param: string) => {
            el[param as keyof typeof el] = params[param]; 
        });
        const mountEl = root.appendChild(el);
        children.forEach(child => {
            if(typeof child === 'string') {
                el.appendChild(document.createTextNode(child))
            } else {
                el.appendChild(child(mountEl));
            };
        });
        onMount ? onMount(mountEl) : null;
        return mountEl as ElementType;
    }
}

export function div(params: Parameters = {}, children: ElementChildren = [],
    onMount?: (that: HTMLDivElement) => void): ElementFunction<HTMLDivElement> {
    return createElement<HTMLDivElement>('div', params, children, onMount) as ElementFunction<HTMLDivElement>;
}

export function button(params: Parameters = {}, children: ElementChildren = [],
    onMount?: (that: HTMLButtonElement) => void): ElementFunction {
    return createElement<HTMLButtonElement>('button', params, children, onMount);
}

export function img(params: Parameters = {}, children: ElementChildren = [],
    onMount?: (that: HTMLImageElement) => void): ElementFunction {
    return createElement<HTMLImageElement>('img', params, children, onMount);
}

export function input(params: Parameters = {}, children: ElementChildren = [],
    onMount?: (that: HTMLInputElement) => void): ElementFunction {
    return createElement<HTMLInputElement>('input', params, children, onMount);
}