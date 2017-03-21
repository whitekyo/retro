(function () {
    function fCheckChannel() {
        var _webChannelEnum = {
            APP: "APP",
            H5: "H5",
            WECHAT: "wechat"
        };
        var _CONST_CHANNEL = "PAS.AYLC.channel";
        var _channel = window.localStorage.getItem(_CONST_CHANNEL);

        if (!_channel) {
            /*若没有从localstorage中拿到channel信息，则判断useragent
             * 兼容以前的版本
             */
            /*平安证券APP*/
            if (navigator.userAgent.indexOf("AYLCAPP") > -1) {
                return _webChannelEnum.APP;
            }
            /*微信公众号*/
            else if (navigator.userAgent.indexOf("MicroMessenger") > -1) {
                return _webChannelEnum.WECHAT;
            }
            /*其他H5渠道*/
            else {
                return _webChannelEnum.H5;
            }
        }
        else {
            if (_channel == "app") {
                /*平安证券APP*/
                return _webChannelEnum.APP;
            }
            else if (_channel == "wechat") {
                /*微信公众号*/
                return _webChannelEnum.WECHAT;
            }
            else {
                /*其他H5渠道*/
                return _webChannelEnum.H5;
            }
        }
    }
    var _CONST_DEVS = "PAS.AYLC.devs";
    var _devs = window.localStorage.getItem(_CONST_DEVS)||"";
    var _channel = fCheckChannel();

    var _config = {
        plugins: ['shim'],
        map: [
            /*ref:fullreplace [ /^(.*\/loyaltyProgram\/.*\.(?:css|js))(?:.*)$/i, '$1?<%= buildNumber %>' ],*/
            [/^(.*\/loyaltyProgram\/.*\.(?:css|js))(?:.*)$/i, '$1?20160708'],
            /*endref*/
            /*ref:fullreplace [ /^(.*\/js\/.*\.(?:css|js))(?:.*)$/i, '$1?<%= buildNumber %>' ]*/
            [/^(.*\/js\/.*\.(?:css|js))(?:.*)$/i, '$1?20160708']
            /*endref*/
        ],

        alias: {
            /*ref:fullreplace "console":{src:"https://cdn.stock.pingan.com.cn/html/aylc/js/build/console.min"},*/
              "console":{
                  src:"rootjs/build/console.min"
              },
              /*endref*/
            /*ref:fullreplace "commJSModalB":{src:"rootjs/build/CommJSModalB_APP"},*/
            "zepto": {
                src: "rootjs/zepto/zepto-1.1.6",
                exports: '$'
            },
            "logger": {
                src: "rootjs/build/logger.min",
                deps: ["zepto"]
            },
            "commFunc": {
                src: "rootjs/CommFunc",
                deps: ["logger", "zepto"]
            },
            "stepHistory": {
                src: "rootjs/PAS.stephistory/stepHistory",
                deps: ['zepto', 'CommonAPI']
            },
            "underscore": {
                src: "rootjs/underscore1.8.2/underscore-min",
                exports: "_"
            },

            "NativeAPI": {
                src: "rootjs/NativeAPI",
                deps: ['zepto', 'logger']
            },
            /*endref*/
            /*ref:fullreplace "share":{src:"rootjs/PAS.Share/share",deps:['commJSModalB']}*/
            "share": {
                src: "rootjs/PAS.Share/share",
                deps: ['zepto', 'logger']
            },
            /*endref*/
            "callbacks": {
                src: "rootjs/zepto/callbacks",
                deps: ["zepto"]
            },
            "promise": {
                src: "rootjs/zepto/deferred",
                deps: ["zepto", "callbacks"]
            }
        },
        paths: {
            rootjs: "../js/",
            seajsroot: "./../js/"
        }
    };

    if (_channel != "APP") {
        /*ref:fullreplace _config.alias.commJSModalB = {src:"../js/build/commJSModalB_H5"};*/
        _config.alias.CommonAPI = {
            src: "rootjs/CommonAPI",
            deps: ['zepto', 'Token', 'dialog', 'relogin']
        };
        _config.alias.dialog = {
            src: "rootjs/artDialog/dist/dialog.js",
            deps: ['zepto'],
            exports: "dialog"
        };
        _config.alias.Token = {
            src: "rootjs/token"
        };
        _config.alias.relogin = {
            //src: "rootjs/relogin",
            src:"https://stock.stg.pingan.com/ssologin2/js/relogin.js",
            deps: ['zepto', 'Token']
        };
        /*endref*/


    }
    else {
        /*ref:fullreplace _config.alias.commJSModalB = {src:"../js/build/commJSModalB_APP"};*/
        _config.alias.CommonAPI = {
            src: "rootjs/CommonAPI",
            deps: ['zepto', 'NativeAPI']
        };
        /*endref*/
    }

    /*ref:fullreplace if(_devs=="FEDV587"){_config.alias.commJSModalB.deps=["console"]}*/
      if(_devs=="FEDV587")
      {
          _config.alias.logger.deps=["zepto","console"];
      }
      /*endref*/
    seajs.config(_config);
})();