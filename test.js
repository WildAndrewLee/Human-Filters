"use strict";

const filter = require('./index.js');

f = filter('x mod 2 is 0');
console.log(f({
    x: 6
}));

console.log('---');

f = filter('6 mod 2 mod 2 is 1');
console.log(f({
    x: 0,
    y: 0
}));