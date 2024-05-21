import { AToB, BToA, BindableValue, RecordWrapppedOrPureValues, Storage, Unsubscribe } from '../core/Storage';
import {Parameters, ElementFunction, createElement, ElementChildren, Properties} from './SlothViewElement';

type ControlStorageTransformer<FieldType> = <TransformType>(aToB: (a: FieldType) => TransformType, bToA: (b: TransformType) => FieldType) => BindableValue<TransformType>
type ControlStorageTransformers<Fields> = {[Property in keyof Fields]: ControlStorageTransformer<Fields[Property]>}
export abstract class SlothViewComponentStorage<ElementType extends HTMLElement, Props extends Record<string, any>> {
    private _element!: ElementType;
    private _tag: string;
    private _renderProps: Record<keyof Props, boolean> = {} as Record<keyof Props, boolean>;
    private _disableSubscribes: Array<() => void> = [];
    private _disableChildSubscribers: Array<Unsubscribe> = []

    private _savedRenderContentData!: {
        children: ElementChildren
    };

    private _storage!: Storage<Props>;

    get props() {
        return {
            setValue: () => this._storage.setValue(),
            getValue: () => this._storage.getValue(),
            onSet: () => this._storage.onSet(),
            bindField: () => this._storage.bindField(),
            bindTransform: () => {
                const transformers = this._storage.bindTransform();
                const newTransfromers = {} as ControlStorageTransformers<Props>;
                Object.keys(transformers).forEach((key: keyof Props) => {
                    const beforeF = transformers[key];
                    const afterF = <ResultType>(aToB: AToB<Props[keyof Props], ResultType>, bToA: BToA<Props[keyof Props], ResultType>) => {
                        const result = beforeF(aToB, bToA);
                        this._disableSubscribes.push(result[1]);
                        this._disableChildSubscribers.push(result[1]);
                        return result[0];
                    }
                    newTransfromers[key] = afterF;
                });
                return newTransfromers;
            }
        };
    }

    private _setProps(newProps: RecordWrapppedOrPureValues<Props>) {
        this._storage = new Storage<Props>(newProps);
        this.handlePropertiesSet();
    }

    constructor(tag: string) {
        this._tag = tag;
    }

    getRoot(): ElementType {
        return this._element;
    }


    protected onPropSet(prop: keyof Props, cb: (value: Props[typeof prop]) => void): void {
        this._disableSubscribes.push(this.props.onSet()[prop](cb));
    }

    protected abstract handlePropertiesSet(): void;

    // TODO: implement this
    protected renderContentOnPropChange(propName: keyof Props, doRender: boolean = true): void {
        this._renderProps[propName] = doRender;
    }

    protected updateInnerContent(): void {
        if(!this._savedRenderContentData) throw new Error('Component was not rendered before.');
        this._element.innerHTML = '';
        this._removeChildrenBindindgs();
        this.renderComponentContent(
            this._savedRenderContentData.children
        ).forEach(child => {
            if(typeof child === 'string') {
                this._element.appendChild(document.createTextNode(child))
            } else {
                child(this._element)
            }
        });
    }

    private _removeChildrenBindindgs(): void {
        this._disableChildSubscribers.forEach(unsub => unsub());
    }

    public render(
        params: Parameters = {}, 
        props: RecordWrapppedOrPureValues<Props>,
        children: ElementChildren = [],
        onMount?: (that: ElementType) => void): ElementFunction<ElementType> {
        this._disableSubscribes.forEach(disable => disable());
        this._disableSubscribes = [];
        this._setProps(props);
        this._handleRenderOnSetProps();
        this._savedRenderContentData = {
            children
        }
        this._removeChildrenBindindgs();
        return this.renderRoot(params, this.renderComponentContent(children), onMount);
    }

    private _handleRenderOnSetProps(): void {
        Object.keys(this._renderProps).forEach((propName) => {
            if(!this.props.getValue()[propName as keyof Props]) return;
            this.onPropSet(propName, () => {
                this.updateInnerContent();
            })
        });
    }

    protected abstract renderComponentContent(
        children: ElementChildren
    ): ElementChildren;

    protected renderRoot(
        params: Parameters = {}, 
        children: ElementChildren = [],
        onMount?: (that: ElementType) => void): ElementFunction<ElementType> {
        return createElement(this._tag, params, children, (that: ElementType) => {
            if(onMount) onMount(that);
            this._mount(that);
        })
    }

    private _mount(that: ElementType): void {
        this._element = that;
        this.onMount(this._element);
    }

    onMount(that: ElementType): void {};
}