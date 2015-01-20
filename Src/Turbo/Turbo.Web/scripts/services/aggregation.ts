///<reference path="../typings/node.d.ts" />
import fs= require('fs');
    
export interface Aggregator {
    Put(time : number) : void;
    Value() : any;
    Dispose? : () => void;
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
    
export class RollingSpeedometer implements Aggregator {
    private _times : number[];
        
    constructor(private windowLength : number, private unitDistance : number){
        this._times = [];
    }
        
    Put(time : number){
        var now = new Date().getTime();
        while(this._times.length && now - this._times[0] > this.windowLength){
            this._times.shift();
        }
        this._times.push(time);
    }
        
    Value(){
        var now = new Date().getTime();
        while(this._times.length && now - this._times[0] > this.windowLength){
            this._times.shift();
        }
            
        if(!this._times.length) return 0;
        else {
            var distanceKm = this._times.length * this.unitDistance / 1000;
            var hours = (now - this._times[0]) / 3600000;
                
            if(!hours) return 0;
            else return distanceKm/hours;
        }
    } 
}

export class LogFile implements Aggregator{
        
    private _buffer : number[];
        
    constructor(private filePath : string, private bufferSize : number){
        this._buffer = [];
    }
        
    private Flush(){
        var data= this._buffer.map(d => '\r\n' + d).join('');
        fs.appendFile(this.filePath, data);
        this._buffer = [];
    }
        
    Put(time : number){
        this._buffer.push(time);
            
        if(this._buffer.length > this.bufferSize) this.Flush();
    }
        
    Value(){
        return this.filePath;
    }
        
    Dispose(){
        if(this._buffer.length) this.Flush();
    }
}