const fs = require('fs');
const moment = require('moment');

var Q = function(file){
    this._queue = [];
    // var _file = file || __dirname + '/.nsqueue';
    this._file = file || './.nsqueue';
    this._lastUpdate = 0;
}

Q.prototype.load = function(file){
    file = file || this._file;
    try{
        if(fs.existsSync(file)){
            var data = JSON.parse(fs.readFileSync(file));
            if(data.lastUpdate)
                this._lastUpdate = data.lastUpdate;
            if(data.news)
                this._queue = data.news;
        }
    }catch(e){
        this._queue = [];
    }
    return this;
}

Q.prototype.save = function(file){
    file = file || this._file;
    fs.writeFileSync(file, JSON.stringify({
        lastUpdate:this._lastUpdate,
        news:this._queue
    }));
    return this;
}

Q.prototype.get = function(mixed){
    if(typeof mixed === 'number'){
        if(this._queue[mixed])
            return this._queue[mixed];
        return undefined;
    }
    return this._queue;
}

Q.prototype.push = function(news){
    // console.log(news);
    if(news.time <= this._lastUpdate)
        return false;
    for(var i = 0;i < this._queue.length;i++){
        if(this._queue[i].url == news.url || this._queue[i].subject == news.subject){
            return false;
        }
    }
    this._queue.push(news);
    return true;
}

Q.prototype.shift = function(){
    return this._queue.shift();
}

Q.prototype.delete = function(index){
    return this._queue.splice(index, 1).pop();
}

Q.prototype.sort = function(compare){
    this._queue.sort(compare || function(){});
    return this;
}

Q.prototype.getLastUpdate = function(){
    return this._lastUpdate;
}

Q.prototype.setLastUpdate = function(time){
    if(!isNaN(parseInt(time)))
        this._lastUpdate = parseInt(time);
    return this;
}

Q.prototype.print = function(n){
    if(this._queue[n]){
        console.log([this._queue[n].time
            ,moment(this._queue[n].time * 1000).format("Y-MM-DD HH:mm:ss")
            ,this._queue[n].subject
            ,this._queue[n].url
        ].join('|'));
    }else{
        console.log(this._queue.map(function(e, i){
            return [i ,e.time
                ,moment(e.time * 1000).format("Y-MM-DD HH:mm:ss")
                ,e.subject
                ,e.url
            ].join('|');
        }));
    }
    return this;
}
module.exports = function(file){
    return new Q(file);
}
