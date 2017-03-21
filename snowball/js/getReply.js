define(function(require, exports, module) {
    var commentDetails = require("./commentDetails");
    var comment = require("../../js/comment.js");
    require('commFunc');
    require("CommonAPI");
    require("promise");

    /* 收到的回复列表对象实例 */
    var replyComment = new comment();
    /* 点赞列表对象实例 */
    var profectComment = new comment();
    /* 我的评论列表对象实例 */
    var myComment = new comment();
    /* 其他实例 */
    var details = new comment();
    /* 一页显示条数 */
    var pageSize = 10;
    /* 状态机 */
    var state = [
        {
            "comment": replyComment,
            "tabPageFn": function(params){
                /* 渲染收到的回复列表 */
                return replyComment.fGetReplyList("/restapi/stkcontent/getReply", params, -1).then(function(data){
                    replyComment.fRenderList($("#my-reply-tab .x-comment-more"), $("#repost-tmpl"), data.result, "before");
                    replyComment.fCheckIsMore(replyComment.pageNumber, Math.ceil(data.result.replyCount / pageSize), $("#my-reply-tab"));
                    replyComment.flag = true;
                }, function(reason){
                    replyComment.fDealErrorException(reason, $("#my-reply-tab ul"), function(){
                        replyComment.fReset();
                        params.body.pageNumber = replyComment.pageNumber;
                        state[0].tabPageFn(params);
                    });
                });
            },
            "tabPageByRollFn": function(params){
                return replyComment.fGetReplyListByRoll("/restapi/stkcontent/getReply", params, -1).then(function(data){
                    replyComment.fRenderList($("#my-reply-tab .x-comment-more"), $("#repost-tmpl"), data.result, "before");
                    replyComment.fCheckIsMore(replyComment.pageNumber, Math.ceil(data.result.replyCount / pageSize), $("#my-reply-tab"));
                    replyComment.flag = true;
                }, function(reason){
                    replyComment.flag = true;
                    replyComment.fBackSpace();
                    if(parseInt(reason) != 1){
                        PAS.CommonAPI.fShowTip("服务器异常，请稍后再试");
                    }
                });
            },
            "asyncUI": "fShowReplyTab",
            "id": 0,
            "moreElement": "#my-reply-tab .x-comment-more"
        },
        {
            "comment": profectComment,
            "tabPageFn": function(params){
                /* 渲染赞列表 */
                return profectComment.fGetList("/restapi/stkcontent/getZan", params, -2).then(function(data){
                    profectComment.fRenderList($("#profect-tab .x-comment-more"), $("#profect-tmpl"), data.result, "before");
                    profectComment.fCheckIsMore(profectComment.pageNumber, Math.ceil(data.result.count / pageSize), $("#profect-tab"));
                    profectComment.flag = true;
                }, function(reason){
                    profectComment.fDealErrorException(reason, $("#profect-tab ul"), function(){
                        profectComment.fReset();
                        params.body.pageNumber = profectComment.pageNumber;
                        state[1].tabPageFn(params);
                    });
                });
            },
            "tabPageByRollFn": function(params){
                return profectComment.fGetListByRoll("/restapi/stkcontent/getZan", params, -2).then(function(data){
                    profectComment.fRenderList($("#profect-tab .x-comment-more"), $("#profect-tmpl"), data.result, "before");
                    profectComment.fCheckIsMore(profectComment.pageNumber, Math.ceil(data.result.count / pageSize), $("#profect-tab"));
                    profectComment.flag = true;
                }, function(reason){
                    profectComment.fDealErrorException(reason, $("#profect-tab ul"), function(){
                        profectComment.flag = true;
                        profectComment.fBackSpace();
                        if(parseInt(reason) != 1){
                            PAS.CommonAPI.fShowTip("服务器异常，请稍后再试");
                        }
                    });
                });
            },
            "asyncUI": "fShowReplyTab",
            "id": 1,
            "moreElement": "#profect-tab .x-comment-more"
        },
        {
            "comment": myComment,
            "tabPageFn": function(params){
                /* 渲染我的发言列表 */
                return myComment.fGetList("/restapi/stkcontent/getMyComment", params, -3).then(function(data){
                    myComment.fRenderList($("#my-comment-tab .x-comment-more"), $("#my-tmpl"), data.result, "before");
                    myComment.fCheckIsMore(myComment.pageNumber, Math.ceil(data.result.count / pageSize), $("#my-comment-tab"));
                    myComment.flag = true;
                }, function(reason){
                    myComment.fDealErrorException(reason, $("#my-comment-tab ul"), function(){
                        myComment.fReset();
                        params.body.pageNumber = myComment.pageNumber;
                        state[2].tabPageFn(params);
                    });
                });
            },
            "tabPageByRollFn": function(params){
                return myComment.fGetListByRoll("/restapi/stkcontent/getMyComment", params, -3).then(function(data){
                    myComment.fRenderList($("#my-comment-tab .x-comment-more"), $("#my-tmpl"), data.result, "before");
                    myComment.fCheckIsMore(myComment.pageNumber, Math.ceil(data.result.count / pageSize), $("#my-comment-tab"));
                    myComment.flag = true;
                }, function(reason){
                    myComment.fDealErrorException(reason, $("#my-comment-tab ul"), function(){
                        myComment.flag = true;
                        myComment.fBackSpace();
                        if(parseInt(reason) != 1){
                            PAS.CommonAPI.fShowTip("服务器异常，请稍后再试");
                        }
                    });
                });
            },
            "asyncUI": "fShowReplyTab",
            "id": 2,
            "moreElement": "#my-comment-tab .x-comment-more"
        }
    ];

    window.replyDateTime = function(replytime) {
        var end_time = new Date(),
            sta_date = new Date(parseInt(replytime)),
            num = (end_time.getTime() - replytime) / (1000 * 3600);
        if (num < 1) {
            if (num * 60 < 1) {
                return '刚刚';
            } else {
                return parseInt(num * 60) + '分钟前';
            }
        } else if (num < 24) {
            return parseInt(num) + '小时前';
        } else if (num < 168) {
            return parseInt(num / 24) + '天前';
        } else {
            return (sta_date.getFullYear() + '-' + (sta_date.getMonth() + 1) + '-' + sta_date.getDate());
        }
    };

    


    exports.init = function() {
        var App = {
            GlobalIndex: 0,
            initialize: function(){
                var self = this;
                this.getToken().then(function(data){
                    self.render(data);
                });
            },
            getToken: function(){
                var defer = $.Deferred();
                PAS.CommonAPI.fGetToken(function(data){
                    defer.resolve(data);
                });
                return defer.promise();
            },
            render: function(token_params) {
                var _this = this;
                $("body").removeClass("comment-detail");
                PAS.CommonAPI.fSetTitle({
                    icontype: 1,
                    callback: "window.fGoPrevious",
                    text: ""
                }, {
                    icontype: 0,
                    callback: "",
                    text: "我的评论"
                }, {
                    icontype: 0,
                    callback: "",
                    text: ""
                });
                _this.flag = false;

                var queryHashList = this.fQueryHash();

                /* 顶部tab页切换 */
                $('.my-reply li').on('click', function() {
                    /* 如果已经阅读过，则不会重新初始化 */
                    if(!$(this).find(".my-reply-new").hasClass("readed")){
                        var index = $(this).index();
                        _this[state[index].asyncUI](index, token_params);
                        _this.fScrollAction(token_params, state);
                    }else{
                        _this.fShowUiTab($(this).index());
                        _this.fScrollAction(token_params, state);
                    }
                });

                /* 跳评论详情 */
                $(".my-reply-div").on('click', '.x-comment-article', function(e) {
                    var _target = $(this);
                    var content = _target.closest(".x-comment-line");
                    var scene = _target.next().find(".x-comment-img").data("scene");
                    var symbolcode = content.find(".x-comment-general-title").data('symbolcode');
                    var symboltype = content.find(".x-comment-general-title").data('symboltype');
                    var $commentDetail = content.find(".x-comment-detail");
                    switch(scene){
                        case "01":
                            /* 股票评论 */
                            _this.fLoadComment($commentDetail.data("id"), "01", symbolcode, symboltype, true, scene);
                            break;
                        case "02":
                            /* 资讯评论 */
                            _this.fLoadComment($commentDetail.data("id"), $commentDetail.find(".x-comment-general-title").data("infoid"), symbolcode, symboltype, true, scene);
                            break;
                        case "03":
                            /* 帖子评论 */
                            _this.fLoadComment($commentDetail.data("id"), $commentDetail.find(".x-comment-general-title").data("postid"), symbolcode, symboltype, true, scene);
                            break;
                    }
                    //_this.myflag = false;
                    if(symbolcode && symboltype){
                        //PAS.CommonAPI.fShowStockDetail(symbolcode, 0, symboltype);
                        
                    }else{
                        
                    }
                });

                /* 跳转资讯或股票详情 */
                $(".my-reply-div").on('click', '.x-comment-img', function(e) {
                    var _target = $(this);
                    var scene = _target.data("scene");
                    var content = _target.closest(".x-comment-line");
                    var symbolcode = content.find(".x-comment-general-title").data('symbolcode');
                    var symboltype = content.find(".x-comment-general-title").data('symboltype');
                    //_this.myflag = false;
                    switch(scene){
                        case "01": 
                            /* 股票评论 */
                            PAS.CommonAPI.fShowStockDetail(symbolcode, 0, symboltype);
                            break;
                        case "02":
                            /* 资讯评论 */
                            var id = _target.find(".x-comment-general-title").data("infoid");
                            var nginxReg = /\/html\/aylc/,
                                _url = "../news/article.html?infocode=" + id + "&way=h5";
                            window.PAS.CommFunc.fOpenByLocationHref(_url);
                            break;
                        case "03":
                            /* 帖子评论 */
                            var postId = _target.find(".x-comment-general-title").data("postid");
                            var _url = "../socialcircle/index.html?postid=" + postId;
                            window.PAS.CommFunc.fOpenByLocationHref(_url);
                            break;
                    }
                });

                /* 滚动 */
                /* 切换的时候，要保证instance是不一样的 */
                $(window).one("scroll", function(e){
                    var comment = state[_this.GlobalIndex];
                    var commentInstance = comment.comment;
                    console.log(commentInstance);
                    commentInstance.fDoScrollAction(e, function(content){
                        token_params.body.pageNumber = commentInstance.pageNumber;
                        token_params.body.pageSize = pageSize;
                        return state[_this.GlobalIndex].tabPageFn(token_params);
                    }, $(state[_this.GlobalIndex].moreElement), commentInstance);
                });

                /* 初始化，看是否未读 */
                PAS.CommFunc.Query.fInitQuery(4);
                PAS.CommFunc.Query.fQuery("/restapi/stkcontent/checkNew", token_params, function(data){
                    details.fCheckStatus(data).then(function(data){
                        if(data.result.goodSign){
                            $("#good-tab .my-reply-new").addClass("active");
                        }
                        if(data.result.replySign){
                            $("#reply-tab .my-reply-new").addClass("active");
                        }
                    });
                });

                /* 渲染tab */
                this[state[queryHashList[0] || 0].asyncUI](queryHashList[0] || 0, token_params);
            },
            /* tab页的渲染初始化 */
            fShowTab: function(index, token_params){
                $('.my-reply span').eq(index).addClass("readed");
                token_params.body.pageNumber = 1;
                token_params.body.pageSize = pageSize;
                state[index].tabPageFn(token_params);
            },
            fQueryHash: function(){
                var hash = window.location.hash;
                var arr = hash.match(/\/([^\/])*/g);
                var source = [];
                if(arr && arr.length){
                    source = $.map(arr, function(v, i){
                        return v.slice(1);
                    });
                }
                return source;
            },
            fShowReplyTab: function(index, token_params){
                this.fShowUiTab(index);
                this.fShowTab(this.GlobalIndex, token_params);
            },
            fLoadComment: function(id, commentId, symbolcode, symboltype, simulate, scene){
                var _this = this;
                $("#wrap").load("./commentDetails.html", function() {
                    PAS.stepHistory.cmd.fAddStep("getReply");
                    commentDetails.init(id, symbolcode, symboltype, commentId, simulate, scene);
                });
            },
            /* tab页的UI展示 */
            fShowUiTab: function(index){
                var _this = this;
                var content = $('.my-reply li').eq(index);
                content.addClass('selected').siblings().removeClass('selected');
                _this.GlobalIndex = index;
                $('.reply_div').eq(_this.GlobalIndex).show().siblings().hide();
                // if ($('.reply_div').eq(0).css("display") == "block") {
                //     _this.flag = false;
                //     if ((_this.mycomment) > $('.userInfo').length + 1) {
                //         _this.myflag = true;
                //     }
                // }
                // if ($('.reply_div').eq(1).css("display") == "block") {
                //     _this.myflag = false;
                //     if ((_this.replycount) > $('.getReply-list li').length + 1) {
                //         _this.flag = true;
                //     }
                // }
            },
            fScrollAction: function(token_params, state){
                var _this = this;
                var comment = state[_this.GlobalIndex];
                var commentInstance = comment.comment;
                /* 滚动 */
                /* 切换的时候，要保证instance是不一样的 */
                $(window).off("scroll").one("scroll", function(e){
                    commentInstance.fDoScrollAction(e, function(content){
                        token_params.body.pageNumber = commentInstance.pageNumber;
                        token_params.body.pageSize = pageSize;
                        return state[_this.GlobalIndex].tabPageFn(token_params);
                    }, $(state[_this.GlobalIndex].moreElement), commentInstance);
                });
            }

        };
        App.initialize();
        return App;
    };
});
