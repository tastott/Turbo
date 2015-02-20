export enum Unit {
    Kilometres,
    Hours,
    Milliseconds
}

export interface Metric {
    Value: number;
    Unit: Unit;
}