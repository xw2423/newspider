const fs = require('fs');
const moment = require('moment');

var Q = function(file){
    this._queue = [];
    // var _file = file || __dirname + '/.nsqueue';
    this._file = file || './.nsqueue';
    this._lastUpdate = {};
}

Q.prototype.load = function(file){
    file = file || this._file;
    try{
        if(fs.existsSync(file)){
            var data = JSON.parse(fs.readFileSync(file));
            if(data.lastUpdate && typeof data.lastUpdate === 'object' && !Array.isArray(data.lastUpdate))
                this._lastUpdate = data.lastUpdate;
            if(data.news && Array.isArray(data.news))
                this._queue = data.news;
        }
    }catch(e){
        this._queue = [];
        this._lastUpdate = {};
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
    if(news.time <= this._lastUpdate[news.uid])
        return false;
    for(var i = 0;i < this._queue.length;i++){
        if(this._queue[i].url == news.url){
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

Q.prototype.getLastUpdate = function(uid){
    return this._lastUpdate[uid] || 0;
}

Q.prototype.setLastUpdate = function(uid, time){
    if(uid === false){
        this._lastUpdate = {};
        return this;
    }
    if(!isNaN(parseInt(time)))
        this._lastUpdate[uid] = parseInt(time);
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
