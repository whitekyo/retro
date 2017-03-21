define(function(require, exports, module) {
    /*ref:fullreplace require("commJSModalB");*/
    require('zepto');
    require('commFunc');
    require('CommonAPI');
    require('underscore');
    require('stepHistory');
    /*endref*/
    var stepArray = [];
    stepArray.getReply = require("./getReply");
    stepArray.commentDetails = require("./commentDetails");
    window.PAS.stepHistory = new PAS.stepHistory({
        fCallback: function(step) {
            if(window.location.hash){
                window.history.go(-1);
            }else{
                if(step.curStepKey.indexOf("__") > 0){
                    stepArray[step.curStepKey.split('__')[0]].init(step.params);
                }else{
                    $('#wrap').load('./' + step.curStepKey + '.html', function(data, status, xhr) {
                        stepArray[step.curStepKey].init(step.params);
                    });
                }
                
            }
        }
    });
   window.fGoPrevious = window.PAS.stepHistory.cmd.fGotoPrevious;
    $(function() {
        var App = {
            initialize: function() {
                var _this = this;
                PAS.CommonAPI.fSetTitle({
                    icontype: 1,
                    callback: "window.fGoPrevious",
                    text: ""
                }, {
                    icontype: 0,
                    callback: "",
                    text: "热评"
                }, {
                    icontype: 0,
                    callback: "",
                    text: ""
                });
                //  $("#wrap").load("./commentDetails.html", function() {
                //              stepArray.commentDetails.init();
                // });
                if (_this.fGetvl("reviewId")) {
                    $("#wrap").load("./commentDetails.html", function() {
                        stepArray.commentDetails.init();
                    });
                } else {
                    $("#wrap").load("./getReply.html", function() {
                        stepArray.getReply.init();
                    });
                }

                $("body").on("error", ".user-img", function(){
                    this.src = "images/defaut_head.jpg";
                }).on("error", ".news-img", function(){
                    this.src = "image/news.png";
                });

                /* 跳转社区首页 */
                $("body").on("click", ".goto_community", function(){
                    var unionId = $(this).data("unionid");
                    PAS.CommFunc.fOpenByLocationHref("../community/index_publish.html?viewUnionId=" + unionId);
                });
            },
            fGetvl: function(name) {
                var reg = new RegExp("(^|\\?|&)" + name + "=([^&]*)(\\s|&|$)", "i");
                if (reg.test(location.href)) return unescape(RegExp.$2.replace(/\+/g, " "));
                return "";
            }
        };
        /*初始化*/
        App.initialize();
    });
});
