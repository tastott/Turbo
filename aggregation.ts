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
}