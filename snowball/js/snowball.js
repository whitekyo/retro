//define(function(require, exports, module) {
$(function() {
    var title = "热评",
        description = "",
        callbackname = 'xq_json_callback';
    paramStr = window.location.search.substr(1),
    url = ("https://stock.stg.pingan.com/restapi/stkcontent/getStockReviewDetails/" + fGetvl('reviewId') + '/' + fGetvl('stockCode'));
    PAS.CommFunc.Query.fZeptoJSONP(url, function(response) {
        if (response.status == 1) {
            $('#com_time').html(response.result.commentDate);
            $('#username').html(response.result.screenName);
            $('#comment').html(response.result.text);
            description = $('#comment').text();
            title = $('#username').text();
            if (Math.random()<=0) {
                $('#snowball_download').append('<a href="http://a.app.qq.com/o/simple.jsp?pkgname=com.xueqiu.android"><img src="images/snowball_banner.png"</a>');
                $('#formwhere').html(response.result.source);
            }
            $('#head_img').attr('src', response.result.headPortrait);
            window.WXSDK.init({
                title: '平安证券' + title,
                desc: description,
                link: location.href
            });
        } else {
            noData();
        }
    }, function(a, b, c) {
        noData();
    }, '', callbackname);

    function fConvertDate(num) {
        var d = new Date(Number(num));
        return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
    }

    function noData() {
        $('#mind').height($(window).height()).css('background', '#fff').show();
        $('#wrap').hide();
    }
    $('#againLoad').on('click', function() {
        $(this).attr('href', window.location.href);
    });

    function fGetvl(name) {
        var reg = new RegExp("(^|\\?|&)" + name + "=([^&]*)(\\s|&|$)", "i");
        if (reg.test(location.href)) return unescape(RegExp.$2.replace(/\+/g, " "));
        return "";
    }
});
//});