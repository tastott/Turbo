export enum Unit {
    Kilometres,
    Hours,
    Milliseconds,
    RevolutionsPerSecond
}

export interface Metric {
    Value: number;
    Unit: Unit;
}