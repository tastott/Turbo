import _ = require('underscore')

export interface Dictionary<T> {
    [index: string]: T;
}

export function Values<T>(dict: Dictionary<T>): T[] {
    return _.values(dict);
}

export function Map<T, U>(dict: Dictionary<T>, func: (value: T) => U): Dictionary<U> {
    return <any>_.object(_.keys(dict).map(key => {
        return [key, func(dict[key])];
    }));
} 