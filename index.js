"use strict";

const Tokenizer = require('./tokenizer.js');

function _isString(x){
    return x.toLowerCase !== undefined;
}

function _isNumber(x){
    return !Number.isNaN(parseFloat(x));
}

function _isBool(x){
    return x === true || x === false;
}

function _isQuoted(x){
    return x.startsWith('"') && x.endsWith('"') || x.startsWith('\'') && x.endsWith('\'');
}


const ops = {
    'contains': (x, y) => {
        x = x();
        y = y();

        if(!_isString(x) || !_isString(y)){
            throw new Error('args not string');
        }

        return x.toLowerCase().includes(y.toLowerCase());
    },
    'is': (x, y) => {
        x = x();
        y = y();

        if(x == y){
            return true;
        }

        if(_isNumber(x) && _isNumber(y)){
            // above should have passed.
            return false;
        }

        if(_isNumber(x) && !_isNumber(y)){
            return false;
        }

        if(!_isNumber(x) && _isNumber(y)){
            return false;
        }

        if(x.equals){
            return x.equals(y);
        }

        if(y.equals){
            return y.equals(x);
        }

        // Consider regular objects.
        let xp = Object.getOwnPropertyNames(x);
        let yp = Object.getOwnPropertyNames(y);

        if(xp.length !== yp.length){
            return false;
        }

        for(let i = 0; i < xp.length; i++){
            let p = xp[i];

            if(x[xp] !== y[xp]){
                return false;
            }
        }

        return true;
    },
    'is not': (x, y) => {
        return !ops.is(x, y);
    },
    '>': (x, y) => {
        x = x();
        y = y();

        if(!_isNumber(x) || !_isNumber(y)){
            throw new Error('args not number');
        }

        return x > y;
    },
    '>=': (x, y) => {
        x = x();
        y = y();

        if(!_isNumber(x) || !_isNumber(y)){
            throw new Error('args not number');
        }

        return x >= y;
    },
    '<': (x, y) => {
        x = x();
        y = y();

        if(!_isNumber(x) || !_isNumber(y)){
            throw new Error('args not number');
        }

        return x < y;
    },
    '<=': (x, y) => {
        x = x();
        y = y();

        if(!_isNumber(x) || !_isNumber(y)){
            throw new Error('args not number');
        }

        return x <= y;
    },
    'mod': (x, y) => {
        x = x();
        y = y();

        if(!_isNumber(x) || !_isNumber(y)){
            throw new Error('args not number');
        }

        return x % y;
    },
    'and': (x, y) => {
        x = x();
        y = y();

        if(!_isBool(x) || !_isBool(y)){
            throw new Error('args not bool');
        }

        return x && y;
    },
    'or': (x, y) => {
        x = x();
        y = y();

        if(!_isBool(x) || !_isBool(y)){
            throw new Error('args not bool');
        }

        return x || y;
    }
};

// Note to self, check for "is not"
// when "is" encountered

function makeFilter(str){
    let variables = {};

    let tokens = new Tokenizer(str);

    let operators = [];
    let operands = [];

    function parseStr(tokens, paren){
        while(tokens.hasNext()){
            let token = tokens.next();

            if(_isNumber(token) || _isQuoted(token)){
                if(_isNumber(token)){
                    token = parseFloat(token);
                }
                else if(_isQuoted(token)){
                    token = token.substring(1, token.length - 1);
                }

                operands.unshift(() => {return token;});
            }
            else if(ops[token]){
                if(token === 'and'){
                    while(operators.length && operands.length >= 2 && operators[0] !== 'and'){
                        let y = operands.shift();
                        let x = operands.shift();
                        operands.unshift(ops[operators.shift()].bind(null, x, y));
                    }

                    operators.unshift('and');
                }
                else if(token === 'or'){
                    while(operators.length && operands.length >= 2 && operators[0] !== 'and' && operators[0] !== 'or'){
                        let y = operands.shift();
                        let x = operands.shift();
                        operands.unshift(ops[operators.shift()].bind(null, x, y));
                    }

                    operators.unshift('or');
                }
                else if(token === 'is'){
                    while(operators.length && operands.length >= 2 && operators[0] !== 'and' && operators[0] !== 'or' && operators[0] !== 'is'){
                        let y = operands.shift();
                        let x = operands.shift();
                        operands.unshift(ops[operators.shift()].bind(null, x, y));
                    }

                    tokens.stash();
                    let next = tokens.next();
                    
                    if(token === 'is' && next === 'not'){
                        operators.unshift('is not');
                    }
                    else{
                        tokens.pop();
                        operators.unshift('is');
                    }
                }
                else if(token === 'mod'){                    
                    while(operators.length && operands.length >= 2 && operators[0] === 'mod'){
                        let y = operands.shift();
                        let x = operands.shift();
                        operands.unshift(ops[operators.shift()].bind(null, x, y));
                    }

                    operators.unshift('mod');
                }
                /*
                else if(token === 'mod'){
                    let temp = tokens.next();
                    let y = null;

                    if(!_isNumber(temp) && _isQuoted(temp)){
                        throw new Error('invalid mod operand');
                    }
                    if(!_isNumber(temp)){
                        y = () => {return variables[temp];};
                    }
                    else{
                        y = () => {return temp;};
                    }

                    let x = operands.shift();
                    operands.unshift(ops.mod.bind(null, x, y));
                }
                */
                else{
                    operators.unshift(token);
                }
            }
            else{
                if(token === '('){
                    return parseStr(tokens, true);
                }
                else if(token === ')'){
                    if(paren){
                        break;
                    }
                    else{
                        throw new Error('unmatched closing paren');
                    }
                }                

                operands.unshift(() => {
                    return variables[token];
                });
            }
        }

        while(operators.length && operands.length >= 2){
            let y = operands.shift();
            let x = operands.shift();
            operands.unshift(ops[operators.shift()].bind(null, x, y));
        }
    }

    parseStr(tokens, false);

    if(operands.length !== 1 || operators.length !== 0){
        throw new Error('invalid filter');
    }

    let f = (vars) => {
        variables = vars;
        return operands[0]();
    };

    return f;
}

module.exports = makeFilter;