"use strict";

class Tokenizer {
    constructor(str){
        this._str = str;
        this._str_index = 0;
        this._stash = [];
    }

    next(){
        if(this._str_index >= this._str.length){
            return null;
        }

        let whitespace = [' ', '\n', '\t'];

        let escape = false;
        let double_quote = false;
        let single_quote = false;
        let token = '';

        for(; this._str_index < this._str.length; this._str_index++){
            if(!escape && this._str[this._str_index] === '"' && single_quote === false){
                double_quote = !double_quote;
                token += this._str[this._str_index];
            }
            else if(!escape && this._str[this._str_index] === '\'' && double_quote === false){
                single_quote = !single_quote;
                token += this._str[this._str_index];
            }
            else if(!escape && !double_quote && !single_quote && whitespace.indexOf(this._str[this._str_index]) !== -1){
                if(token.length !== 0){
                    break;
                }
            }
            else if(!escape && this._str[this._str_index] === '\\'){
                escape = true;
            }
            else{
                token += this._str[this._str_index];
                escape = false;
            }
        }

        return token;
    }

    hasNext(){
        return this._str_index < this._str.length;
    }

    stash(){
        this._stash.unshift(this._str_index);
    }

    pop(){
        this._str_index = this._stash.shift();
    }
}

module.exports = Tokenizer;
