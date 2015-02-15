//Node webkit and Typescript don't play nicely together
//This is a dirty workaround to allow app module to use relative paths in a way that suits Typescript 
require('./scripts/app') 