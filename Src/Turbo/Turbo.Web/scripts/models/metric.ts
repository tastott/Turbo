export enum Unit {
    Kilometres,
    Hours,
    Milliseconds,
    RevolutionsPerSecond,
    KilometresPerHour,
}

export interface Metric {
    Value: number;
    Unit: Unit;
}

export interface TargetedMetric extends Metric {
    Name: string;
    Target: Metric
}

interface Conversions {
    [index: number]: {
        [index: number]: (value: number) => number
    }
}
var conversions: Conversions = {};
conversions[Unit.RevolutionsPerSecond] = {};
conversions[Unit.RevolutionsPerSecond][Unit.KilometresPerHour] = value => value * 3.6;

export function Convert(metric: Metric, targetUnit: Unit) {
    var conversion = conversions[metric.Unit][targetUnit];

    if (!conversion) throw `Cannot convert from unit ${Unit[metric.Unit]} to ${Unit[targetUnit]}`;

    return conversion(metric.Value);
}