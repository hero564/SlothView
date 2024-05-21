export type Unsubscribe = () => void;

export class BindableValue<Type>{
    private _value: Type;
    private _subscribers: Map<string, (value: Type) => void>
    constructor(value: Type) {
        this._value = value;
        this._subscribers = new Map();
    }

    getValue(): Type {
        return this._value;
    }

    setValue(value: Type): void {
        this._value = value;
        this._subscribers.forEach(setSubsriber => setSubsriber(this._value));
    }

    bindTransform<TransformToType>(
        aToB: (a: Type) => TransformToType, 
        bToA: (b: TransformToType) => Type
    ): [BindableValue<TransformToType>, Unsubscribe] 
    {
        const b = new BindableValue<TransformToType>(aToB(this._value));
        const aUnsubscibe = this.onSet(val => {
            b._value = aToB(val);
        });
        const bUnsubscribe = b.onSet(val => {
            this._value = bToA(val);
        });
        const removeBound = () => {
            aUnsubscibe();
            bUnsubscribe();
        }
        return [b, removeBound];
    } 

    onSet(onset: (value: Type) => void): Unsubscribe {
        console.log(this);
        const id = crypto.randomUUID();
        this._subscribers.set(id, onset);
        return () => {
            this._subscribers.delete(id);
        }
    }
}

export type RecordWrapppedOrPureValues<Fields> = {
    [Key in keyof Fields]: Fields[Key] | BindableValue<Fields[Key]>
}

export type RecordWrappedValues<Fields> = {
    [Key in keyof Fields]: BindableValue<Fields[Key]>
}

export type AToB<Type, TransformType> = (a: Type) => TransformType;
export type BToA<Type, TransformType> = (b: TransformType) => Type;

export type Setters<Fields> = {[Property in keyof Fields] : (value: Fields[Property]) => Setters<Fields>};
export type Getters<Fields> = {[Property in keyof Fields] : Fields[Property]};
export type Subscribers<Fields> = {[Property in keyof Fields] : (cb: (value: Fields[Property]) => void) => Unsubscribe};
export type Transformers<Fields> = {[Property in keyof Fields]: <TransformType>(aToB: (a: Fields[Property]) => TransformType, bToA: (b: TransformType) => Fields[Property]) => [BindableValue<TransformType>, Unsubscribe]}

export class Storage<Fields extends Record<string, any>> {
    private _bindableFields: RecordWrappedValues<Fields>;
    constructor(fields: RecordWrapppedOrPureValues<Fields>) {
        this._bindableFields = this._wrapToBindables(fields);
    }

    private _wrapToBindables(fields: RecordWrapppedOrPureValues<Fields>): RecordWrappedValues<Fields> {
        const bindableFields = {} as RecordWrappedValues<Fields>;
        Object.keys(fields).forEach((key: keyof Fields) => {
            if(typeof fields[key] !== 'object') {
                bindableFields[key] = new BindableValue(fields[key] as Fields[typeof key]);
                return;
            }
            if((fields[key] as Object) instanceof BindableValue) {
                bindableFields[key] = fields[key];
            } else {
                bindableFields[key] = new BindableValue(fields[key] as Fields[typeof key]);
            }
        });
        return bindableFields;
    }

    setValue(): Setters<Fields> {
        const setters: Setters<Fields> = {} as Setters<Fields>;
         Object.keys(this._bindableFields).forEach((key: keyof RecordWrappedValues<Fields>) => {
            setters[key] = (value) => {
                if(!this._bindableFields[key]) {
                    this._bindableFields[key] = new BindableValue(value);
                } else {
                    this._bindableFields[key].setValue(value);
                }
                return setters;
            }
         });
         return setters;
    }

    getValue(): Getters<Fields> {
        const getters: Getters<Fields> = {} as Getters<Fields>;
        Object.keys(this._bindableFields).forEach((key: keyof RecordWrappedValues<Fields>) => {
            getters[key] = this._bindableFields[key].getValue();
         });
        return getters;
    }

    bindField(): RecordWrappedValues<Fields> {
        return {
            ...this._bindableFields
        }
    }

    bindTransform() {
        const transformer = {} as Transformers<Fields>;
        Object.keys(this._bindableFields).forEach((key: keyof RecordWrappedValues<Fields>) => {
            transformer[key] = <TransformType>(
                aToB: AToB<Fields[keyof Fields], TransformType>, 
                bToA: BToA<Fields[keyof Fields], TransformType>
            ) => this._bindableFields[key].bindTransform(aToB, bToA);
         });
        return transformer;
    }

    onSet(): Subscribers<Fields>{
        const subscribers: Subscribers<Fields> = {} as Subscribers<Fields>;
        console.log(this);
        Object.keys(this._bindableFields).forEach((key: keyof Fields) => {
            console.log(key);
            subscribers[key] = (cb) => this._bindableFields[key].onSet(cb);
         });
        console.log(subscribers)
        return subscribers;
    }
}