define(function(require, exports, module){
    /* 删除评论控件 */
    var Dialog = function(opt){
        this.content = $('<div class="popup" style="height: 1919px; display: block;"><ul class="delete-ul"><li class="pop-remove">' + opt.title + '</li><li class="pop-cancel">取消</li></ul></div>');
        this.cssRule = {
            "height": $(window).height() > $(document.body).height() ? ($(window).height() - $('#sec_title').height()) : $(document.body).height()
        };
        this.opt = {};
        this.opt = $.extend(this.opt, opt);
    };

    Dialog.prototype = {
        constructor: Dialog,
        fRender: function(){
            $("body").append(this.content);
        },
        fShow: function(){
            this.fRender();
            this.fBindEvent();
        },
        fHide: function(){
            this.fDestroy();
        },
        fBindEvent: function(){
            var self = this;
            $(".pop-remove").click(function(){
                typeof self.opt.removeHandler == "function" && self.opt.removeHandler();
                self.fHide();
            });

            $(".pop-cancel").click(function(){
                self.fHide();
            });
            /* 安卓兼容 */
            $(".popup").on("click", function(e){
                var target = e.target;
                if($.trim(target.className) == "popup"){
                    self.fHide();
                }
            });
        },
        fDestroy: function(){
            $(".pop-cancel").off("click");
            $(".pop-remove").off("click");
            this.content.remove();
        }
    };

    return Dialog;
});