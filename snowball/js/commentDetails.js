define(function(require, exports, module) {
    
    var comment = require("../../js/comment.js");

    var Dialog = require("./dialog.js");

    var pageSize = 10;

    var GlobalState; // 状态值（资讯1，股票2）

    require('commFunc');

    require("promise");

    exports.init = function(sourceid, symbolcode, symboltype, relevantId, simulate, scene) {
        // var title = '热评',
        //     docreader = '',
        //     timer = '',
        //     url_parameter = window.location.search,
        //     useridComment = '',
        //     url_down = 'http://a.app.qq.com/o/simple.jsp?pkgname=com.xueqiu.android',
        //     reviewId = sourceid;
        // if (sourceid) {
        //     url_parameter = '?reviewId=' + sourceid + '&stockCode=' + symbolcode;
        // }
        // window.fShareModule = function() {
        //     var origin = window.location.origin;
        //     PAS.CommonAPI.fShareModule({
        //         "type": '0',
        //         "title": '平安证券' + title,
        //         "description": (docreader || ''),
        //         "link": 'https://stock.pingan.com/huodong/ShowOrder/H5/snowball.html' + url_parameter,
        //         "thumbimage": origin + '/html/aylc/news/images/108.png'
        //     }, null);
        // };

        /* 详情 */
        var page = {
            /**relevantId:资讯id  reviewid：主评论id */
            renderStock: function(isGoNativePage, token_params, user_params, reviewId, relevantId, stockCode, stockType) {
                window.fBack = function(){
                    var queryObj = window.PAS.stepHistory.cmd.fGetUrlQuery(window.location.search);
                    if(queryObj.page){
                        window.PAS.stepHistory.cmd.fGotoCommunityPrevious();
                    }else if(isGoNativePage){
                        window.fGoPrevious();
                    }else{
                        window.history.back();
                    }
                };
                window.fGoPrevious = function() {
                    _this.flag = false;
                    window.PAS.stepHistory.cmd.fGotoPrevious();
                };
                var _this = this;
                var _callback = "window.fBack";
                this.fDestroy();
                PAS.CommonAPI.fSetTitle({
                    icontype: 1,
                    callback: _callback,
                    text: ""
                }, {
                    icontype: 0,
                    callback: "",
                    text: "评论详情"
                }, {
                    icontype: 3,
                    callback: "window.fShareModule",
                    text: ''
                });
                
                var details = new comment();
                this.currentDetails = details;
                var params = $.extend(true, {
                    "body": {
                        "reviewId": reviewId,
                        "stockCode": stockCode
                    }
                }, token_params);
                details.fGetDetail("/restapi/stkcontent/getStockCommentDetails", params)
                    .then(function(data){
                        var defer = $.Deferred();
                        _this.unionId = data.result.unionId;
                        _this.headPortrait = data.result.headPortrait;
                        /* 临时方案 */
                        data.result.isStock = 1;
                        var text = data.result.text;
                        details.fRenderList($(".x-comment-detail-layout ul"), $("#comment-detail-tmpl"), data.result, "html");
                        _this.fShare(reviewId, stockCode, text);
                        $(".x-comment-detail-paragraph").html(text);
                        defer.resolve(data);
                        return defer.promise();
                    }, function(reason){
                        PAS.CommonAPI.fShowTip(reason);
                        new Function(_callback)();
                    }).then(function(data){
                        var userListParams = $.extend(true, {
                            "body": {
                                "commentId": data.result.id,
                                "relevantId": relevantId,
                                "viewUnionId": data.result.unionId
                            }
                        }, token_params);
                        _this.fGetGoodList(details, userListParams);
                        $(".x-fed-comment-person").html(data.result.screenName);
                        if(data.result.source && data.result.source.length){
                            _this.addAdvertisement();
                        }
                    });

                this.fGetRepostList(details, 1, reviewId, params, stockCode);

                $(window).one("scroll", function(e){
                    details.fDoScrollAction(e, function(content){
                        details.pageNumber = details.pageNumber;
                        return _this.fGetRepostList(details, details.pageNumber, reviewId, params, stockCode);
                    });
                });

                $("body").addClass("comment-detail");

                $(".x-words").on("click", ".x-comment-remove", function(){
                    var $line = $(this).closest(".x-comment-line");
                    _this.fRemoveCommentById($(this).closest(".x-comment-line").data("id"), token_params, function(){
                        $line.remove();
                        _this.fUpdateReplyCount().then(function(){}, function(){
                            details.fDealErrorException(1, $(".x-words ul"));
                            details.fReset();
                        });
                    }, "删除回复");
                });
                $(".main_box").on("click", ".x-current-detail", function(){
                    var $line = $(this).closest(".x-comment-line");
                    if($line.data("del") == 1){
                        _this.fRemoveCommentById($line.data("id"), token_params, function(){
                            /* 删除掉当前主评论后返回上一页 */
                            window.fBack();
                        }, "删除评论");
                    }
                });
                

                /* 点赞 */
                $("#wrap").on("click", ".x-comment-perfect", function(e){
                    var $target = $(e.target);
                    var perfect_params = $.extend(true, {
                        "body": {
                            "commentId": $target.data("commentid"),
                            "relevantId": relevantId,
                            "viewUnionId": $target.data("unionid")
                        }
                    }, token_params);
                    if($target.closest(".main_box").length){
                        /* goodSource为03 */
                        _this.stockProfect(e, details, token_params, {
                            "infoCode": stockCode,
                            "goodSource": "03",
                            "symbolType": stockType
                        }, function(str){
                            var count = $(".comment-goodNum span").html();
                            if(str == "plus"){
                                count = parseInt(count) + 1;
                            }else{
                                count = parseInt(count) - 1;
                            }
                            $(".comment-goodNum span").html(count);
                            _this.fRefreshGoodList(details, perfect_params);
                        });
                    }else{
                        /* goodSource为04 */
                        _this.stockProfect(e, details, token_params, {
                            "infoCode": stockCode,
                            "goodSource": "04",
                            "sourceId": reviewId,
                            "symbolType": stockType
                        });
                    }  
                });

                /* 评论主评论 */
                $(".main_box").on("click", ".x-comment-reply", function(){
                    var $line = $(this).closest(".x-comment-line");
                    var id = $line.data("id");
                    var userId = $line.data("userid");
                    var userType = $line.data("usertype");
                    var userName = $line.data("username");
                    _this.comment(stockCode, stockType, id, id, token_params, {
                        "userId": userId,
                        "userType": userType,
                        "userName": userName
                    }, function(){
                        _this.fUpdateReplyCount("plus");
                        details.fReset();
                        details.fResetList($(".x-comment-words .x-error-flag"));
                        _this.fGetRepostList(details, details.pageNumber, id, params, stockCode, true);
                    });

                    //comment: function(infoCode, codeType, sourceId, parentId, token_params, user_params){
                });

                $(".x-fed-comment").on("click", function(){
                    var $line = $(".main_box .x-comment-line");
                    var id = $line.data("id");
                    var userId = $line.data("userid");
                    var userType = $line.data("usertype");
                    var userName = $line.data("username");
                    console.log("调用app键盘");
                    _this.comment(stockCode, stockType, id, id, token_params, {
                        "userId": userId,
                        "userType": userType,
                        "userName": userName
                    }, function(){
                        _this.fUpdateReplyCount("plus");
                        details.fReset();
                        details.fResetList($(".x-comment-words .x-error-flag"));
                        _this.fGetRepostList(details, details.pageNumber, id, params, stockCode, true);
                    });
                });

                /* 回复子评论 */
                $(".x-words").on("click", ".x-comment-paragraph", function(){
                    var $line = $(this).closest(".x-comment-line");
                    var sourceId = $line.data("id");
                    var userId = $line.data("userid");
                    var userType = $line.data("usertype");
                    var userName = $line.data("username");
                    _this.comment(stockCode, stockType, $(".main_box .x-comment-line").data("id"), sourceId, token_params, {
                        "userId": userId,
                        "userType": userType,
                        "userName": userName
                    }, function(){
                        _this.fUpdateReplyCount("plus");
                        details.fReset();
                        details.fResetList($(".x-comment-words .x-error-flag"));
                        _this.fGetRepostList(details, details.pageNumber, id, params, stockCode, true);
                    });
                });

                /* 关注 */
                $(".main_box").on("click", ".x-comment-focus-btn", function(){
                    var $target = $(this);
                    var unionId = $target.data("unionid");
                    var updateFocusStatusParams = {};
                    if($target.hasClass("x-comment-focus")){
                        /* 关注 */
                        updateFocusStatusParams = $.extend(true, {
                            "body": {
                                "viewUnionId": unionId,
                                "followSign": 1
                            }
                        }, token_params);
                        PAS.CommFunc.Query.fQuery("/restapi/stkcontent/updateFocusStatus", updateFocusStatusParams, function(data){
                            if(data.result.followSign == 2){
                                $target.removeClass("x-comment-focus").addClass("x-comment-focused").html("已关注");
                            }else if(data.result.followSign == 3){
                                $target.removeClass("x-comment-focus").addClass("x-comment-focused").html("互相关注");
                            }else {
                                $target.removeClass("x-comment-focused").addClass("x-comment-focus").html("关注");
                            }
                            PAS.CommonAPI.fShowTip("已关注");
                            $target.data("status" , data.result.followSign);
                        }, function(e){});
                    }else{
                        /* 取消关注 */
                        updateFocusStatusParams = $.extend(true, {
                            "body": {
                                "viewUnionId": unionId,
                                "followSign": 2
                            }
                        }, token_params);
                        PAS.CommFunc.Query.fQuery("/restapi/stkcontent/updateFocusStatus", updateFocusStatusParams, function(data){
                            if(data.result.followSign == 2){
                                $target.removeClass("x-comment-focus").addClass("x-comment-focused").html("已关注");
                            }else if(data.result.followSign == 3){
                                $target.removeClass("x-comment-focus").addClass("x-comment-focused").html("互相关注");
                            }else {
                                $target.removeClass("x-comment-focused").addClass("x-comment-focus").html("关注");
                            }
                            PAS.CommonAPI.fShowTip("已取消关注");
                            $target.data("status" , data.result.followSign);
                        }, function(e){});
                        
                    }
                    
                });

                /* 跳转社区首页 */
                $(".goto_community").on("click", function(){
                    var unionId = $(this).data("unionid");
                    PAS.CommFunc.fOpenByLocationHref("../community/index.html");
                });
            },
            renderInformation: function(isGoNativePage, token_params, user_params, reviewId, relevantId) {
                window.fBack = function(){
                    var queryObj = window.PAS.stepHistory.cmd.fGetUrlQuery(window.location.search);
                    if(queryObj.page){
                        window.PAS.stepHistory.cmd.fGotoCommunityPrevious();
                    }else if(isGoNativePage){
                        window.fGoPrevious();
                    }else{
                        window.history.back();
                    }
                };
                
                window.fGoPrevious = function() {
                    _this.flag = false;
                    window.PAS.stepHistory.cmd.fGotoPrevious();
                };
                var _this = this;
                var _callback = "window.fBack";
                this.fDestroy();
                PAS.CommonAPI.fSetTitle({
                    icontype: 1,
                    callback: _callback,
                    text: ""
                }, {
                    icontype: 0,
                    callback: "",
                    text: "评论详情"
                }, {
                    icontype: 3,
                    callback: "window.fShareModule",
                    text: ""
                });
                
                var details = new comment();
                this.currentDetails = details;

                var params = $.extend(true, {
                    "body": {
                        "reviewId": reviewId,
                        "relevantId": relevantId
                    }
                }, token_params);
                details.fGetDetail("/restapi/stkcontent/getStockCommentDetails", params)
                    .then(function(data){
                        _this.unionId = data.result.unionId;
                        _this.headPortrait = data.result.headPortrait;
                        var defer = $.Deferred();
                        var text = data.result.text;
                        data.result.isStock = 0;
                        details.fRenderList($(".x-comment-detail-layout ul"), $("#comment-detail-tmpl"), data.result, "html");
                        _this.fShare(reviewId, relevantId, text);
                        $(".x-comment-detail-paragraph").html(text);
                        defer.resolve(data);
                        return defer.promise();
                    }, function(reason){
                        PAS.CommonAPI.fShowTip(reason);
                        new Function(_callback)();
                    }).then(function(data){
                        var defer = $.Deferred();
                        var userListParams = $.extend(true, {
                            "body": {
                                "commentId": data.result.id,
                                "relevantId": relevantId,
                                "viewUnionId": data.result.unionId
                            }
                        }, token_params);
                        _this.fGetGoodList(details, userListParams);
                        $(".x-fed-comment-person").html(data.result.screenName);
                        if(data.result.source && data.result.source.length){
                            _this.addAdvertisement();
                        }
                        defer.resolve(data);
                        return defer.promise();
                    });
                    

                this.fGetRepostList(details, 1, reviewId, params, relevantId);

                $(window).one("scroll", function(e){
                    details.fDoScrollAction(e, function(content){
                        details.pageNumber = details.pageNumber;
                        return _this.fGetRepostListByRoll(details, details.pageNumber, reviewId, params, relevantId);
                    });
                });

                $("body").addClass("comment-detail");

                $(".x-words").on("click", ".x-comment-remove", function(){
                    var $line = $(this).closest(".x-comment-line");
                    _this.fRemoveCommentById($(this).closest(".x-comment-line").data("id"), token_params, function(){
                        $line.remove();
                        _this.fUpdateReplyCount().then(function(){}, function(){
                            details.fDealErrorException(1, $(".x-words ul"));
                            details.fReset();
                        });
                    }, "删除回复");
                });

                $(".main_box").on("click", ".x-comment-main-remove", function(){
                    var $line = $(this).closest(".x-comment-line");
                    if($line.data("del") == 1){
                        _this.fRemoveCommentById($line.data("id"), token_params, function(){
                            /* 删除掉当前主评论后返回上一页 */
                            window.fBack();
                        }, "删除评论");
                    }
                });

                /* 点赞 */
                $("#wrap").on("click", ".x-comment-perfect", function(e){
                    var $target = $(e.target);
                    var perfect_params = $.extend(true, {
                        "body": {
                            "commentId": $target.data("commentid"),
                            "relevantId": relevantId,
                            "viewUnionId": $target.data("unionid")
                        }
                    }, token_params);
                    if($target.closest(".main_box").length){
                        /* goodSource为03 */
                        _this.informationProfect(e, details, token_params, {
                            "infoCode": relevantId,
                            "goodSource": "03"
                        }, function(str){
                            var count = $(".comment-goodNum span").html();
                            if(str == "plus"){
                                count = parseInt(count) + 1;
                            }else{
                                count = parseInt(count) - 1;
                            }
                            $(".comment-goodNum span").html(count);
                            
                            _this.fRefreshGoodList(details, perfect_params);
                        });
                    }else{
                        /* goodSource为04 */
                        _this.informationProfect(e, details, token_params, {
                            "infoCode": relevantId,
                            "goodSource": "04",
                            "sourceId": reviewId
                        });
                    }
                });

                /* 评论主评论 */
                $(".main_box").on("click", ".x-comment-reply", function(){
                    var $line = $(this).closest(".x-comment-line");
                    var id = $line.data("id");
                    var userId = $line.data("userid");
                    var userType = $line.data("usertype");
                    var userName = $line.data("username");
                    _this.comment(relevantId, "02", id, id, token_params, {
                        "userId": userId,
                        "userType": userType,
                        "userName": userName
                    }, function(){
                        _this.fUpdateReplyCount("plus");
                        details.fReset();
                        details.fResetList($(".x-comment-words .x-error-flag"));
                        _this.fGetRepostList(details, details.pageNumber, id, params, relevantId, true);
                        
                    });
                });

                /* 点击底部评论 */
                $(".x-fed-comment").on("click", function(){
                    var $line = $(".main_box .x-comment-line");
                    var id = $line.data("id");
                    var userId = $line.data("userid");
                    var userType = $line.data("usertype");
                    var userName = $line.data("username");
                    console.log("调用app键盘");
                    _this.comment(relevantId, "02", id, id, token_params, {
                        "userId": userId,
                        "userType": userType,
                        "userName": userName
                    }, function(){
                        _this.fUpdateReplyCount("plus");
                        details.fReset();
                        details.fResetList($(".x-comment-words .x-error-flag"));
                        _this.fGetRepostList(details, details.pageNumber, id, params, relevantId, true);
                        
                    });
                });

                /* 回复子评论 */
                //comment: function(infoCode, codeType, sourceId, parentId, token_params, user_params, callback){
                $(".x-words").on("click", ".x-comment-paragraph", function(){
                    var sourceId = $(".main_box .x-comment-line").data("id");
                    var $line = $(this).closest(".x-comment-line");
                    var id = $line.data("id");
                    var userId = $line.data("userid");
                    var userType = $line.data("usertype");
                    var userName = $line.data("username");
                    // comment: function(infoCode, codeType, sourceId, parentId){
                    _this.comment(relevantId, "02", sourceId, id, token_params, {
                        "userId": userId,
                        "userType": userType,
                        "userName": userName
                    }, function(){
                        _this.fUpdateReplyCount("plus");
                        details.fReset();
                        details.fResetList($(".x-comment-words .x-error-flag"));
                        _this.fGetRepostList(details, details.pageNumber, sourceId, params, relevantId, true);
                    });
                });

                /* 关注 */
                $(".main_box").on("click", ".x-comment-focus-btn", function(){
                    var $target = $(this);
                    var unionId = $target.data("unionid");
                    var updateFocusStatusParams = {};
                    if($target.hasClass("x-comment-focus")){
                        /* 关注 */
                        updateFocusStatusParams = $.extend(true, {
                            "body": {
                                "viewUnionId": unionId,
                                "followSign": 1
                            }
                        }, token_params);
                        PAS.CommFunc.Query.fQuery("/restapi/stkcontent/updateFocusStatus", updateFocusStatusParams, function(data){
                            if(data.result.followSign == 2){
                                $target.removeClass("x-comment-focus").addClass("x-comment-focused").html("已关注");
                            }else if(data.result.followSign == 3){
                                $target.removeClass("x-comment-focus").addClass("x-comment-focused").html("互相关注");
                            }else {
                                $target.removeClass("x-comment-focused").addClass("x-comment-focus").html("关注");
                            }
                            PAS.CommonAPI.fShowTip("已关注");
                            $target.data("status" , data.result.followSign);
                        }, function(e){});
                    }else{
                        /* 取消关注 */
                        updateFocusStatusParams = $.extend(true, {
                            "body": {
                                "viewUnionId": unionId,
                                "followSign": 2
                            }
                        }, token_params);
                        PAS.CommFunc.Query.fQuery("/restapi/stkcontent/updateFocusStatus", updateFocusStatusParams, function(data){
                            if(data.result.followSign == 2){
                                $target.removeClass("x-comment-focus").addClass("x-comment-focused").html("已关注");
                            }else if(data.result.followSign == 3){
                                $target.removeClass("x-comment-focus").addClass("x-comment-focused").html("互相关注");
                            }else {
                                $target.removeClass("x-comment-focused").addClass("x-comment-focus").html("关注");
                            }
                            PAS.CommonAPI.fShowTip("已取消关注");
                            $target.data("status" , data.result.followSign);
                        }, function(e){});
                        
                    }
                    
                });

            },
            renderCard: function(isGoNativePage, token_params, user_params, reviewId, relevantId) {
                window.fBack = function(){
                    var queryObj = window.PAS.stepHistory.cmd.fGetUrlQuery(window.location.search);
                    if(queryObj.page){
                        window.PAS.stepHistory.cmd.fGotoCommunityPrevious();
                    }else if(isGoNativePage){
                        window.fGoPrevious();
                    }else{
                        window.history.back();
                    }
                };
                window.fGoPrevious = function() {
                    _this.flag = false;
                    window.PAS.stepHistory.cmd.fGotoPrevious();
                };
                var _this = this;
                var _callback = "window.fBack";
                this.fDestroy();
                PAS.CommonAPI.fSetTitle({
                    icontype: 1,
                    callback: _callback,
                    text: ""
                }, {
                    icontype: 0,
                    callback: "",
                    text: "评论详情"
                }, {
                    icontype: 3,
                    callback: "window.fShareModule",
                    text: ""
                });
                
                var details = new comment();
                this.currentDetails = details;

                var params = $.extend(true, {
                    "body": {
                        "reviewId": reviewId,
                        "relevantId": relevantId
                    }
                }, token_params);
                details.fGetDetail("/restapi/stkcontent/getStockCommentDetails", params)
                    .then(function(data){
                        _this.unionId = data.result.unionId;
                        _this.headPortrait = data.result.headPortrait;
                        $("#hid-usertype").val(data.result.userType);
                        var defer = $.Deferred();
                        var text = data.result.text;
                        data.result.isStock = 0;
                        details.fRenderList($(".x-comment-detail-layout ul"), $("#comment-detail-tmpl"), data.result, "html");
                        _this.fShare(reviewId, relevantId, text);
                        $(".x-comment-detail-paragraph").html(text);
                        //$(".comment-followers-layout").hide();
                        defer.resolve(data);
                        return defer.promise();
                    }, function(reason){
                        PAS.CommonAPI.fShowTip(reason);
                        new Function(_callback)();
                    }).then(function(data){
                        var defer = $.Deferred();
                        var userListParams = $.extend(true, {
                            "body": {
                                "commentId": data.result.id,
                                "relevantId": relevantId,
                                "viewUnionId": data.result.unionId
                            }
                        }, token_params);
                        _this.fGetGoodList(details, userListParams);
                        $(".x-fed-comment-person").html(data.result.screenName);
                        if(data.result.source && data.result.source.length){
                            _this.addAdvertisement();
                        }
                        defer.resolve(data);
                        return defer.promise();
                    });
                    

                this.fGetRepostList(details, 1, reviewId, params, relevantId);

                $(window).one("scroll", function(e){
                    details.fDoScrollAction(e, function(content){
                        details.pageNumber = details.pageNumber;
                        return _this.fGetRepostListByRoll(details, details.pageNumber, reviewId, params, relevantId);
                    });
                });

                $("body").addClass("comment-detail");

                $(".x-words").on("click", ".x-comment-remove", function(){
                    var $line = $(this).closest(".x-comment-line");
                    _this.fRemoveCommentById($(this).closest(".x-comment-line").data("id"), token_params, function(){
                        $line.remove();
                        _this.fUpdateReplyCount().then(function(){}, function(){
                            details.fDealErrorException(1, $(".x-words ul"));
                            details.fReset();
                        });
                    }, "删除回复");
                });

                $(".main_box").on("click", ".x-comment-main-remove", function(){
                    var $line = $(this).closest(".x-comment-line");
                    if($line.data("del") == 1){
                        _this.fRemoveCommentById($line.data("id"), token_params, function(){
                            /* 删除掉当前主评论后返回上一页 */
                            window.fBack();
                        }, "删除评论");
                    }
                });

                /* 点赞 */
                $("#wrap").on("click", ".x-comment-perfect", function(e){
                    var $target = $(e.target);
                    var perfect_params = $.extend(true, {
                        "body": {
                            "commentId": $target.data("commentid"),
                            "relevantId": relevantId,
                            "viewUnionId": $target.data("unionid")
                        }
                    }, token_params);
                    if($target.closest(".main_box").length){
                        /* goodSource为03 */
                        _this.informationProfect(e, details, token_params, {
                            "infoCode": relevantId,
                            "goodSource": "03"
                        }, function(str){
                            var count = $(".comment-goodNum span").html();
                            if(str == "plus"){
                                count = parseInt(count) + 1;
                            }else{
                                count = parseInt(count) - 1;
                            }
                            $(".comment-goodNum span").html(count);
                            
                            _this.fRefreshGoodList(details, perfect_params);
                        });
                    }else{
                        /* goodSource为04 */
                        _this.informationProfect(e, details, token_params, {
                            "infoCode": relevantId,
                            "goodSource": "04",
                            "sourceId": reviewId
                        });
                    }
                });

                /* 评论主评论 */
                $(".main_box").on("click", ".x-comment-reply", function(){
                    var $line = $(this).closest(".x-comment-line");
                    var id = $line.data("id");
                    var userId = $line.data("userid");
                    var userType = $line.data("usertype");
                    var userName = $line.data("username");
                    _this.comment(relevantId, "03", id, id, token_params, {
                        "userId": userId,
                        "userType": userType,
                        "userName": userName
                    }, function(){
                        _this.fUpdateReplyCount("plus");
                        details.fReset();
                        details.fResetList($(".x-comment-words .x-error-flag"));
                        _this.fGetRepostList(details, details.pageNumber, id, params, relevantId, true);
                        
                    });
                });

                /* 点击底部评论 */
                $(".x-fed-comment").on("click", function(){
                    var $line = $(".main_box .x-comment-line");
                    var id = $line.data("id");
                    var userId = $line.data("userid");
                    var userType = $line.data("usertype");
                    var userName = $line.data("username");
                    console.log("调用app键盘");
                    _this.comment(relevantId, "03", id, id, token_params, {
                        "userId": userId,
                        "userType": userType,
                        "userName": userName
                    }, function(){
                        _this.fUpdateReplyCount("plus");
                        details.fReset();
                        details.fResetList($(".x-comment-words .x-error-flag"));
                        _this.fGetRepostList(details, details.pageNumber, id, params, relevantId, true);
                        
                    });
                });

                /* 回复子评论 */
                //comment: function(infoCode, codeType, sourceId, parentId, token_params, user_params, callback){
                $(".x-words").on("click", ".x-comment-paragraph", function(){
                    var sourceId = $(".main_box .x-comment-line").data("id");
                    var $line = $(this).closest(".x-comment-line");
                    var id = $line.data("id");
                    var userId = $line.data("userid");
                    var userType = $line.data("usertype");
                    var userName = $line.data("username");
                    // comment: function(infoCode, codeType, sourceId, parentId){
                    _this.comment(relevantId, "02", sourceId, id, token_params, {
                        "userId": userId,
                        "userType": userType,
                        "userName": userName
                    }, function(){
                        _this.fUpdateReplyCount("plus");
                        details.fReset();
                        details.fResetList($(".x-comment-words .x-error-flag"));
                        _this.fGetRepostList(details, details.pageNumber, sourceId, params, relevantId, true);
                    });
                });

                /* 关注 */
                $(".main_box").on("click", ".x-comment-focus-btn", function(){
                    var $target = $(this);
                    var unionId = $target.data("unionid");
                    var updateFocusStatusParams = {};
                    if($target.hasClass("x-comment-focus")){
                        /* 关注 */
                        updateFocusStatusParams = $.extend(true, {
                            "body": {
                                "viewUnionId": unionId,
                                "followSign": 1
                            }
                        }, token_params);
                        PAS.CommFunc.Query.fQuery("/restapi/stkcontent/updateFocusStatus", updateFocusStatusParams, function(data){
                            if(data.result.followSign == 2){
                                $target.removeClass("x-comment-focus").addClass("x-comment-focused").html("已关注");
                            }else if(data.result.followSign == 3){
                                $target.removeClass("x-comment-focus").addClass("x-comment-focused").html("互相关注");
                            }else {
                                $target.removeClass("x-comment-focused").addClass("x-comment-focus").html("关注");
                            }
                            PAS.CommonAPI.fShowTip("已关注");
                            $target.data("status" , data.result.followSign);
                        }, function(e){});
                    }else{
                        /* 取消关注 */
                        updateFocusStatusParams = $.extend(true, {
                            "body": {
                                "viewUnionId": unionId,
                                "followSign": 2
                            }
                        }, token_params);
                        PAS.CommFunc.Query.fQuery("/restapi/stkcontent/updateFocusStatus", updateFocusStatusParams, function(data){
                            if(data.result.followSign == 2){
                                $target.removeClass("x-comment-focus").addClass("x-comment-focused").html("已关注");
                            }else if(data.result.followSign == 3){
                                $target.removeClass("x-comment-focus").addClass("x-comment-focused").html("互相关注");
                            }else {
                                $target.removeClass("x-comment-focused").addClass("x-comment-focus").html("关注");
                            }
                            PAS.CommonAPI.fShowTip("已取消关注");
                            $target.data("status" , data.result.followSign);
                        }, function(e){});
                        
                    }
                    
                });

            },
            /* 销毁方法 */
            fDestroy: function(){
                $(window).off("scroll");

                $(".x-words").off("click", ".x-comment-remove");
                
                $(".x-words").off("click", ".x-comment-paragraph");

                $(".main_box").off("click", ".x-current-detail");

                $("#wrap").off("click", ".x-comment-perfect");

                this.fClearRepostList();

                this.currentDetails = null;
            },
            /* 获取分页 */
            fGetRepostList: function(details, pageNumber, reviewId, token_params, relevantId, isRefresh){
                var self = this;
                token_params.body = {
                    "reviewId": reviewId,
                    "pageNumber": pageNumber,
                    "pageSize": pageSize,
                    "relevantId": relevantId
                };
                return details.fGetList("/restapi/stkcontent/queryReplyStockComment", token_params, 1)
                            .then(function(data){
                                if(isRefresh){
                                    $(".x-words .x-comment-line").remove();
                                }
                                data.result.list = self.fFuck(data.result.list);
                                details.fRenderList($(".x-words .x-comment-more"), $("#repost-tmpl"), data.result, "before");
                                $(".x-word-num").html(data.result.replyCount);
                                details.fCheckIsMore(pageNumber, Math.ceil(data.result.replyCount / pageSize), $("#my-reply-tab"));
                                details.flag = true;
                            }, function(reason){
                                $(".x-word-num").html(0);
                                details.fReset();
                                details.fDealErrorException(reason, $(".x-comment-words ul"), function(){
                                    self.fGetRepostList(details, details.pageNumber, reviewId, token_params, relevantId);
                                });
                            });
                
            },
            fGetRepostListByRoll: function(details, pageNumber, reviewId, token_params, relevantId, isRefresh){
                var self = this;
                token_params.body = {
                    "reviewId": reviewId,
                    "pageNumber": pageNumber,
                    "pageSize": pageSize,
                    "relevantId": relevantId
                };
                return details.fGetListByRoll("/restapi/stkcontent/queryReplyStockComment", token_params, 1)
                            .then(function(data){
                                if(isRefresh){
                                    $(".x-words .x-comment-line").remove();
                                }
                                data.result.list = self.fFuck(data.result.list);
                                details.fRenderList($(".x-words .x-comment-more"), $("#repost-tmpl"), data.result, "before");
                                //$(".x-word-num").html($(".x-comment-words .x-comment-line").length);
                                details.fCheckIsMore(pageNumber, Math.ceil(data.result.replyCount / pageSize), $("#my-reply-tab"));
                                details.flag = true;
                            }, function(reason){
                                details.flag = true;
                                details.fBackSpace();
                                if(parseInt(reason) != 1){
                                    PAS.CommonAPI.fShowTip("服务器异常，请稍后再试");
                                }
                            });
                
            },
            fClearRepostList: function(){
                $(".x-comment-line").remove();
            },
            /* 删除评论 */
            fRemoveCommentById: function(commentId, token_params, callback, title){
                PAS.CommFunc.Query.fInitQuery(4);
                token_params.body = {
                    "commentId": commentId
                };
                var dialog = new Dialog({
                    removeHandler: function(){
                        token_params.body.commentId = commentId;
                        PAS.CommFunc.Query.fQuery("/restapi/stkcontent/deleteComment", token_params, function(data){
                            PAS.CommonAPI.fShowTip("已删除");
                            typeof callback == "function" && callback();
                        }, function(e){});
                    },
                    title: title
                });
                dialog.fShow();
            },
            /* 点赞 取消赞 */
            informationProfect: function(e, instance, token_params, obj, success, fail){
                var $target = $(e.target);
                var $line = $(e.target).closest(".x-comment-line");
                var params = $.extend(true, {
                    body: {
                        "commentId": $line.data("id"),
                        "goodToUserId": $line.data("userid"),
                        "goodToUserType": $line.data("usertype"),
                        "relevantId": obj.infoCode,
                        "scene": "02",
                        "goodSource": obj.goodSource
                    }
                }, token_params);
                if(obj.goodSource == "04"){
                    params.body.sourceId = obj.sourceId
                }
                instance.fProfect(e, params, success, fail);
            },
            stockProfect: function(e, instance, token_params, obj, success, fail){
                var $line = $(e.target).closest(".x-comment-line");
                var params = $.extend(true, {
                    body: {
                        "commentId": $line.data("id"),
                        "goodToUserId": $line.data("userid"),
                        "goodToUserType": $line.data("usertype"),
                        "relevantId": obj.infoCode,
                        "scene": "01",
                        "goodSource": obj.goodSource,
                        "symbolType": obj.symbolType
                    }
                }, token_params);
                if(obj.goodSource == "04"){
                    params.body.sourceId = obj.sourceId
                }
                instance.fProfect(e, params, success, fail);
            },
            comment: function(infoCode, codeType, sourceId, parentId, token_params, user_params, callback){
                PAS.CommonAPI.fShowTextView(infoCode /*stockCode*/, codeType /*codeType*/, this.num2str(sourceId) /*sourceId*/, this.num2str(parentId) /*parentId*/, this.num2str(user_params.userId) /*userId*/, user_params.userType /*userType*/, user_params.userName /*userName*/, function(data) {
                    if(data.status == 1){
                        $(document.body).append('<div class="x-comment-dialog x-img-tip"><i class="x-comment-success"></i><span class="x-comment-tip">评论成功</span></div>');
                        typeof callback == "function" && callback();
                    }else{
                        $(document.body).append('<div class="x-comment-dialog x-error-tip"></i><span class="x-comment-tip">' + data.errmsg + '</span></div>');
                    }
                    setTimeout(function(){$(".x-comment-dialog").remove();}, 3000);
                    
                });
            },
            num2str: function(num){
                return num + '';
            },
            addAdvertisement: function(){
                var pasScript = document.createElement('script'),
                    head = document.getElementsByTagName("head")[0];
                pasScript.type = "text/javascript";
                pasScript.src = "https://stock.pingan.com/huodong/ShowOrder/H5/servicefrontcfg/snowball_ad.js";
                pasScript.onload = pasScript.onreadystatechange = function() {
                    if (!pasScript.readyState || pasScript.readyState == 'complete' || pasScript.readyState == 'loaded') {
                        if (PAS.SnowballAd) {
                            $('#snowball_download').append('<img src="images/snowball_banner.png" />');
                        }
                    }
                };
                head.appendChild(pasScript);
            },
            fUpdateReplyCount: function(operation){
                var defer = $.Deferred();
                var $replyNum = $(".x-comment-reply .x-comment-num");
                var count = $replyNum.data("count");
                if(operation == "plus"){
                    count = count + 1;
                }else{
                    count = count - 1;
                }
                $replyNum.data("count", count);
                $replyNum.html(count);
                $(".x-word-num").html(count);
                if(count){
                    defer.resolve();
                }else{
                    defer.reject();
                }
                return defer.promise();
            },
            fFuck: function(list){
                switch (parseInt(GlobalState)){
                    case 1:
                        $.each(list, function(i, v){
                            v.isStock = 0;
                        });
                        return list;
                    case 2:
                        $.each(list, function(i, v){
                            v.isStock = 1;
                        });
                        return list;
                }
            },
            fShare: function(reviewId, code, title){
                var docreader = '',
                    tip = $("<div></div>").html(title).text(),
                    url_parameter = window.location.search,
                    url_down = 'http://a.app.qq.com/o/simple.jsp?pkgname=com.xueqiu.android';
                
                if (reviewId) {
                    url_parameter = '?reviewId=' + reviewId + '&stockCode=' + code;
                }
                window.fShareModule = function() {
                    var origin = window.location.origin;
                    PAS.CommonAPI.fShareModule({
                        "type": '0',
                        "title": '平安证券' + tip,
                        "description": (docreader || ''),
                        "link": 'https://stock.pingan.com/huodong/ShowOrder/H5/snowball.html' + url_parameter,
                        "thumbimage": origin + '/html/aylc/news/images/108.png'
                    }, null);
                };
            },
            fGetGoodList: function(details, token_params){
                var self = this;
                PAS.CommFunc.Query.fQuery("/restapi/stkcontent/getGoodUserList", token_params, function(data){
                    if(data.result && data.result.list && data.result.list.length){
                        $(".comment-goodNum").show();
                        details.fRenderList($(".comment-followers"), $("#good-list-tmpl"), data.result, "prepend");
                        switch(data.result.followSign){
                            case '1':
                                $(".x-comment-focus-btn").data("status", 1);
                                break;
                            case '2':
                                /* 已关注 */
                                $(".x-comment-focus-btn").removeClass("x-comment-focus").addClass("x-comment-focused").show().html("已关注");
                                $(".x-comment-focus-btn").data("status", 2);
                                break;
                            case '3':
                                /* 互相关注 */
                                $(".x-comment-focus-btn").removeClass("x-comment-focus").addClass("x-comment-focused").show().html("互相关注");
                                $(".x-comment-focus-btn").data("status", 3);
                                break;
                            case '4':
                                /* 未关注 */
                                $(".x-comment-focus-btn").removeClass("x-comment-focused").show();
                                $(".x-comment-focus-btn").data("status", 4);
                                break;
                            default:
                                /* 未登录状态或雪球用户 */
                                if($("#hid-usertype").val() == "02" || $("#hid-usertype").val() == ''){
                                    $(".x-comment-focus-btn").removeClass("x-comment-focused").show();
                                }
                                
                                $(".x-comment-focus-btn").data("status", '');
                                break;
                        }
                    }
                }, function(e){});
            },
            fRefreshGoodList: function(details, token_params){
                var self = this;
                details.fGetList("/restapi/stkcontent/getGoodUserList", token_params).then(function(data){
                    if(data.result.list.length){
                        $(".comment-goodNum").show();
                    }
                    $(".comment-followers img").remove();
                    details.fRenderList($(".comment-followers"), $("#good-list-tmpl"), data.result, "prepend");
                    
                }, function(){
                    $(".comment-followers img").remove();
                    $(".comment-goodNum").hide();
                });
            }
        };

        var App = {
                template_equity: _.template($('#commentDetails_temp').html()),
                nt_data: 1,
                flag: true,
                userType: null,
                screenName: null,
                sourceId: null,
                stockCode: null,
                codeType: null,
                pageNumber: 1,
                currentDetails: null,
                initialize: function(reviewId, relevantId, simulate, scene){
                    var self = this;
                    $.when(this.getToken(), this.getUser()).then(function(token, user){
                        self.render(token, user, reviewId, relevantId, simulate, scene);
                    });
                },
                getToken: function(){
                    var defer = $.Deferred();
                    PAS.CommonAPI.fGetToken(function(data){
                        defer.resolve(data);
                    });
                    return defer.promise();
                },
                getUser: function(){
                    var defer = $.Deferred();
                    PAS.CommonAPI.fGetUser(function(data){
                        defer.resolve(data);
                    });
                    return defer.promise();
                },
                render: function(token, user, reviewId, relevantId, simulate, scene){
                    var isGoNativePage = PAS.CommFunc.fGetQuery("reviewId", window.location.href) 
                        || PAS.CommFunc.fGetQuery("relevantId", window.location.href)
                        || PAS.CommFunc.fGetQuery("stockCode", window.location.href)
                        || PAS.CommFunc.fGetQuery("codeType", window.location.href)
                        || simulate;
                    if(PAS.CommFunc.fGetQuery("way", window.location.href)){
                        isGoNativePage = '';
                    }
                    var reviewId = reviewId || PAS.CommFunc.fGetQuery("reviewId", window.location.href);
                    var relevantId = relevantId || PAS.CommFunc.fGetQuery("relevantId", window.location.href);
                    var stockCode =  symbolcode || PAS.CommFunc.fGetQuery("stockCode", window.location.href);
                    var stockType =  symboltype || PAS.CommFunc.fGetQuery("codeType", window.location.href);
                    var scene = scene || PAS.CommFunc.fGetQuery("scene", window.location.href);
                    switch(scene){
                        case "01": 
                            /* 股票评论 */
                            page.renderStock(isGoNativePage, token, user, reviewId, "01", stockCode, stockType);
                            GlobalState = 2;
                            break;
                        case "02":
                            /* 资讯评论 */
                            page.renderInformation(isGoNativePage, token, user, reviewId, relevantId);
                            GlobalState = 1;
                            break;
                        case "03":
                            /* 发帖评论 */
                            /* 与资讯评论类似 */
                            page.renderCard(isGoNativePage, token, user, reviewId, relevantId);
                            GlobalState = 1;
                            break;
                        default:
                            /* 默认app跳入 */
                            page.renderStock(isGoNativePage, token, user, reviewId, "01", stockCode, stockType);
                            GlobalState = 2;
                    }
                    
                }
            };
            App.initialize(sourceid, relevantId, simulate, scene);
            return App;
    };
});
