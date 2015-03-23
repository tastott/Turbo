import Q = require('q')

export function AllInSequence<T>(promises: Array<() => ng.IPromise<T>|Q.Promise<T>>): Q.Promise<T[]> {
    var deferred = Q.defer<T[]>();

    var remainingPromises = promises.map(p => p);
    var results: T[] = [];

    _AllInSequence(remainingPromises, results, deferred);

    return deferred.promise;
} 

function _AllInSequence<T>(remainingPromises: Array<() => ng.IPromise<T>|Q.Promise<T>>,
    results : T[],
    deferred: Q.Deferred<T[]>) {
    
    if (remainingPromises.length) {
        remainingPromises.shift()()
            .then(result => {
                results.push(result);
                _AllInSequence(remainingPromises, results, deferred);
            })
            .catch(error => deferred.reject(error));
    } else {
        deferred.resolve(results);
    }

} 