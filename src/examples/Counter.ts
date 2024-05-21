
/**
 * Example of working with framework.
 * It can be done simpler for that case, 
 * but it done this way to show how to work with component storage.
 */

import { Attributes, SlothViewComponentStorage } from "../core/SlothViewComponentStorage";
import { ElementChildren, div, ElementFunction, button } from "../core/SlothViewElement";
import { BindableValue } from "../core/Storage";

export const mountCounter = (root: HTMLElement) => {
    new Counter().render({}, {})(root);
}

class Counter extends SlothViewComponentStorage<HTMLDivElement, {}> {
    private _count: BindableValue<number>;

    constructor() {
        super('div');
        // create bindable value wrapper
        this._count = new BindableValue(0);
    }
    protected handlePropertiesSet(): void {
    }
    protected renderComponentContent(children: ElementChildren): ElementChildren {
        return [
            div({className: 'counter-title'}, ['Counter']),
            new CounterDisplay().render({}, {
                // pass bindable value wrapper as child component property
                count: this._count
            }),
        ]
    }

    protected renderRoot(params?: Attributes, children?: ElementChildren, onMount?: ((that: HTMLDivElement) => void) | undefined): ElementFunction<HTMLDivElement> {
        return super.renderRoot({className: 'counter'}, children, onMount);
    }
}

type CounterProps = {
    count: number
}

export class CounterDisplay extends SlothViewComponentStorage<HTMLDivElement, CounterProps> {
    constructor() {
        super('div');
        // set component to render content on each count value change to display new value.
        this.renderContentOnPropChange('count');
    }

    protected handlePropertiesSet(): void {
        // add callback on binded property was set
        this.onPropSet('count', val => {
            console.log(`New value has gotten: ${val}. Re-rendering component!`);
        })
    }
    protected renderComponentContent(children: ElementChildren): ElementChildren {
        return [
            div({className: 'counter-value'}, [String(this.props.getValue().count)]),
            button({
                className: 'counter-button dec', 
                onclick: () => this.props.setValue().count(this.props.getValue().count -1)
            }, ['-']), 
            button({
                className: 'counter-button inc', 
                onclick: () => this.props.setValue().count(this.props.getValue().count + 1)
            }, ['+']),
        ]
    }

}
