module Aggregation{
    export interface Aggregator {
        Put(time : number) : void;
        Value() : any;
    }
    
    export class Counter implements Aggregator{
        private _count : number;
        
        constructor(){
            this._count = 0;
        }
        
        Put(time : number) {
            this._count +=1;
        }
        
        Value() {
            return this._count;
        }
    }
    
    export class Odometer implements Aggregator{
        private _count : number;
        
        constructor(private unitDistance : number){
            this._count = 0;
        }
        
        Put(time : number) {
            this._count +=1;
        }
        
        Value() {
            return this._count * this.unitDistance;
        }
    }
    
    export class Timer implements Aggregator {
        private _start : number;
        private _latest: number;
        
        constructor(){
            this._start = 0;
            this._latest = 0;
        }
        
        Put(time : number) {
            if(!this._start) this._start = time;
            this._latest = time;
        }
        
        Value() {
            return this._latest - this._start;
        }
        
    }
    
    export class Speedometer implements Aggregator {
        constructor(private odometer : Odometer, private timer : Timer){
            
        }
        
        Put(time: number){
            
        }
        
        Value(){
            var distanceKm = this.odometer.Value() / 1000;
            var hours = this.timer.Value() / 3600000;
            
            if(!hours) return 0;
            else return distanceKm/hours;
        }
    }

}