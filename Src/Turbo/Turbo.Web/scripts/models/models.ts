export interface PowerCurve {
    Coefficient: number;
    Exponent: number;
    Fit: number;
}

export interface Config {
    PowerCurve: PowerCurve;
    TyreCircumference: number;
}