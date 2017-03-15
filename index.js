const $ = require('cheerio');
const async  = require('async');
const request = require('superagent-charset')(require('superagent'));
const exec = require('child_process').execSync;
const moment = require('moment');

var NS = function(config){
    var _this = this;

    this.queue = require('./lib/queue')().load();

    if(Array.isArray(config.newsList)){
        if(typeof config.newsMeta !== 'object' || Array.isArray(config.newsMeta))
            config.newsMeta = {};
        if(typeof config.newsExclude != 'object' || Array.isArray(config.newsExclude))
            config.newsExclude = {};
    }else{
        console.log('newspider config error');
    }

    this.newsConfig = config;

    this.run = function(cb){
        var _this = this;
        cb = cb || function(){}
        async.concat(_this.newsConfig.newsList, parse_list, function(err, res){
            async.map(res.filter(function(e){
                return e.url;
            }), parse_news, function(err, res){
                _this.save();
                cb.call(_this, _this.queue);
            });
        });
        return this;
    }

    this.save = function(file){
        var q = this.queue;
        q.sort(function(a, b){
            if(a.priority == b.priority)
                return a.time - b.time;
            return b.priority - a.priority;
        });
        if(q.get(0) && q.getLastUpdate() < q.get(0).time)
            q.setLastUpdate(q.get(0).time);
        q.save(file);
        return this;
    }

    this.add = function(obj){
        var _this = this;
        if(Object.keys(this.newsConfig.newsMeta).every(function(k){
            return !_this.newsConfig.newsMeta[k] || !!obj[k];
        }) && !isNaN(obj.time) && valid_news(obj)){
            return this.queue.push(obj);
        }
        return false;
    }

    this.delete = function(mixed){
        if(this.queue.get(parseInt(mixed))){
            return this.queue.delete(parseInt(mixed))
        }else{
            var pos = false;
            if(this.queueu.get().some(function(e, i){
                if(e.url == mixed){
                    pos = i;
                    return true;
                }
                return false;
            })){
                return this.queue.delete(pos);
            }else{
                return false;
            }
        }
    }

    this.truncate = function(){
        this.queue.setLastUpdate(0).get().splice(0, this.queue.get().length);
        return this;
    }

    function parse_list(e, cb){
        if(e.url){
            _ua(request.get(e.url)).end(function(err, res){
                if(!err && res.ok){
                    var links;
                    if(typeof e.link === 'function')
                        links = e.link.call(_this, _$(res.text));
                    else
                        links = _$(res.text)(e.link);
                    cb(null, links.map(function(i, el){
                        // console.log((e.domain || '') + $(el).attr('href'));
                        if($(el).attr('href')){
                            return {url:(e.domain || '') + $(el).attr('href'),config:e};
                        }else{
                            _log('WARNING', $(el).html() + ' haven\'t href');
                            return {url:false,config:e};
                        }
                    }).get());
                }else{
                    _log('WARNING', e.url + ' parse failed');
                    cb(null, []);
                }
            });
        }else{
            cb(null, []);
        }
    }

    function parse_news(ar, cb){
        var r = _ua(request.get(ar.url));
        if(ar.config.charset) r = r.charset(ar.config.charset);
        r.end(function(err, res){
            if(!err && res.ok){
                var obj = {
                    url:ar.url,
                    time:moment(_$(res.text)(ar.config.time).html()).unix(),
                    priority:0
                };
                if(typeof ar.config.time === 'function')
                    obj.time = ar.config.time.call(_this, _$(res.text))
                else
                    obj.time = _$(res.text)(ar.config.time).html();
                obj.time = moment(obj.time).unix();
                if(ar.config.priority) obj.priority = ar.config.priority;
                Object.keys(_this.newsConfig.newsMeta).forEach(function(k){
                    if(ar.config[k]){
                        if(typeof ar.config[k] === 'function')
                            obj[k] = ar.config[k].call(_this, _$(res.text));
                        else
                            obj[k] = _$(res.text)(ar.config[k]).html();
                    }
                });
                _this.add(obj);
            }else{
                _log('WARNING', ar.url + ' parse failed');
            }
            cb();
        });
    }

    function valid_news(obj){
        return Object.keys(_this.newsConfig.newsMeta).concat('url').every(function(k){
            return !_this.newsConfig.newsExclude[k]
                || !_this.newsConfig.newsExclude[k].some(function(e){
                    return obj[k] && obj[k].match(e);
                });
        });
    }

    function _ua(req){
        return req.set('User-Agent','Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36');
    }

    function _$(t){
        return $.load(t, {decodeEntities: false});
    }

    function _log(type, content){
        console.log([
            moment().format("Y-MM-DD HH:mm:ss"),
            type,
            content
        ].join('|'));
    }
}
module.exports = function(config){
    return new NS(config);
}
