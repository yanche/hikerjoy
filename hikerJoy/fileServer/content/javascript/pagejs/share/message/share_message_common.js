$('#a_message').bind('click', function (e) {
    e.preventDefault();
});

//get the unread msg count.
corsAjax({
    url: getDataServerRequestUrl('user', 'getUserUnreadMsgCount'),
    success: function (data) {
        if (data && data.count > 0) {
            $('#a_message').append($('<i class="fa fa-comment-o" style="position: relative; bottom: 5px;"></i>'));
        }
    }
});

$('#md_message_sendMsg_em').bind('click', function () {
    var obj = $(this);
    var em = obj.data('emphasis');
    if (em == 'true')
        obj.data('emphasis', 'false').css('color', 'black');
    else
        obj.data('emphasis', 'true').css('color', 'red');
});

var md_message_obj_messages = null;

var getMessageFromServer = function(){
    var defer = new Q.defer();
    corsAjax({
        url: getDataServerRequestUrl('user', 'getUserMessages'),
        success: function (data) {
            if (data) 
                md_message_obj_messages = {'send': data.send, 'recv': data.recv, 'recvsys': data.recv_sys};
            else
                md_message_obj_messages = {'send': [], 'recv': [], 'recvsys': []};
            defer.resolve();
        },
        error: function(xhr, desc, err) {
            defer.reject(err);
        }
    });
    return defer.promise;
};

var buildMsgLine = function (subject, body, nickName, createdOn, unread, emphasis, sys) {
    var msgbody = $('<div />').addClass('msgbody').append($('<pre />')).hide();
    if(sys) msgbody.children('pre').html(htmlPostArrayToHtml(body));
    else msgbody.children('pre').text(body);
    var head = $('<div />').addClass('padding5px');
    head.append($('<i />').addClass('fa fa-trash-o pointerCursor marginR5px hoverRed')).append($('<a />').addClass('msgToggle clickable' + (unread ? ' msgLineUnread' : '')).data('msgbody', msgbody).text(subject + (sys ? '' : ('<' + nickName + '>'))));
    if (emphasis)
        head.append($('<i />').addClass('fa fa-exclamation marginL5px').css('color', 'red'));
    head.append($('<span />').addClass('pull-right visible-md visible-lg').text(createdOn.format('yyyy/MM/dd')));
    return $('<div />').addClass('msgLine').append(head).append(msgbody);
};

var buildPaging = function (msgLineArray, container) {
    container.empty();
    var pages = parseInt((msgLineArray.length - 1) / 10) + 1; //round down
    var ret = [];
    //build the pagination divs
    for (var i = 0; i < pages; ++i) {
        var obj = $('<div />');
        obj.appendTo(container);
        ret.push(obj);
    }
    container.children('div').not(':eq(0)').hide();
    for (var i = 0; i < msgLineArray.length; ++i) {
        msgLineArray[i].appendTo(ret[parseInt(i / 10)]);
    }
    //build pagination indicator
    if (pages > 1) {
        var ul = $('<ul />').addClass('pagination pagination-sm pull-right');
        for (var i = 0; i < pages; ++i) {
            ul.append($('<li />').append($('<a />').text(i + 1).data('idx', i)));
        }
        ul.children('li:eq(0)').addClass('active');
        ul.find('a').bind('click', function () {
            container.children('div').hide();
            container.children('div').eq($(this).data('idx')).show();
            ul.children('li').removeClass('active');
            $(this).parent('li').addClass('active');
        });
        ul.appendTo(container);
    }
};

var clearSendMsgDialog = function (){
    clearAll($('#md_message_sendMsg'));
    $('#md_message_sendMsg_em').data('emphasis', 'false').css('color', 'black');
};

var buildEntireMsgBox = function (){
    var unreadRecvMsgCount = md_message_obj_messages.recv.filter(function (v) { return !v.read; }).length;
    var unreadRecvSysMsgCount = md_message_obj_messages.recvsys.filter(function (v) { return !v.read; }).length;
    if(unreadRecvMsgCount > 0) $('#md_message_recvBox_unreadHint').show();
    else $('#md_message_recvBox_unreadHint').hide();
    if(unreadRecvSysMsgCount > 0) $('#md_message_recvSysBox_unreadHint').show();
    else $('#md_message_recvSysBox_unreadHint').hide();

    var msgSendArrayLines = md_message_obj_messages.send.sort(function (v1, v2) {return sortByDateDesc(v1,v2,'createdOn');}).map(function (v){
        var msgLine = buildMsgLine(v.subject, v.body, v.to, new Date(v.createdOn), false, v.emphasis);
        msgLine.data('msgId', v._id);
        return msgLine;
    });
    var msgRecvArrayLines = md_message_obj_messages.recv.sort(function (v1, v2) {return sortByDateDesc(v1,v2,'createdOn');}).map(function (v){
        var msgLine = buildMsgLine(v.subject, v.body, v.from, new Date(v.createdOn), !v.read, v.emphasis);
        msgLine.data('from', v.from);
        msgLine.data('subject', v.subject);
        msgLine.data('msgId', v._id);
        return msgLine;
    });
    var msgRecvSysArrayLines = md_message_obj_messages.recvsys.sort(function (v1, v2) {return sortByDateDesc(v1,v2,'createdOn');}).map(function (v){
        var msgLine = buildMsgLine(v.subject, v.body, v.from, new Date(v.createdOn), !v.read, v.emphasis, true);
        msgLine.data('msgId', v._id);
        return msgLine;
    });
    buildPaging(msgSendArrayLines, $('#md_message_sendBox'));
    buildPaging(msgRecvArrayLines, $('#md_message_recvBox'));
    buildPaging(msgRecvSysArrayLines, $('#md_message_recvsysBox'));
    $('#md_message_recvBox').find('div.msgLine div.msgbody').append($('<button />').addClass('btn btn-xs btn-success').text('回复'));
    $('#md_message_recvBox').find('div.msgLine div.msgbody button').bind('click', function () {
        clearSendMsgDialog();
        var msgLine = $(this).parents('div.msgLine');
        $('#md_message_sendMsg_subject').val('Re:' + msgLine.data('subject'));
        $('#md_message_sendMsg_to').val(msgLine.data('from'));
        $('#md_message_tabItem_sendMsg').trigger('click');
    });
    $('#md_message_recvBox, #md_message_recvsysBox').on('click', 'a.msgLineUnread', function () {
        var obj = $(this);
        var msgLine = obj.parents('div.msgLine');
        obj.removeClass('msgLineUnread');
        corsAjax({
            url: getDataServerRequestUrl('user', 'markUserMessageRead'),
            data: {'msgId': msgLine.data('msgId')}
        });
        var container = obj.parents('#md_message_recvBox, #md_message_recvsysBox');
        if(container.find('a.msgLineUnread').length === 0) {
            if(container.attr('id') === 'md_message_recvBox') $('#md_message_recvBox_unreadHint').hide();
            else $('#md_message_recvSysBox_unreadHint').hide();
        }
    });
    $('#md_message_recvBox, #md_message_sendBox, #md_message_recvsysBox').find('i.fa-trash-o').bind('click', function () {
        var obj = $(this).parents('div.msgLine');
        corsAjax({
            url: getDataServerRequestUrl('user', 'markUserReceivedMessageDelete'),
            data: {'msgId': obj.data('msgId')}
        });
        obj.remove();
    });
    $('#md_message_recvBox, #md_message_sendBox, #md_message_recvsysBox').find('a.msgToggle').bind('click', function () {
        $(this).data('msgbody').slideToggle();
    });
};

var refreshMessage = function(){
    getMessageFromServer()
    .then(buildEntireMsgBox)
    .fail(function (err){
        console.log(err.stack);
    });
};

$('#md_message_refresh').bind('click', refreshMessage);

$('#md_message_sendMsg_btnSend').bind('click', function () {
    var to = $('#md_message_sendMsg_to');
    var sub = $('#md_message_sendMsg_subject');
    var msg = $('#md_message_sendMsg_body');
    if (!isNickName(to)) {
        doAlert({ 'title': '收信人错误', 'msg': '请输入正确的收信人昵称', 'style': 'warning' });
    }
    else if (!validateValuedString(msg.val())) {
        doAlert({ 'title': '没有内容', 'msg': '发送信息为空', 'style': 'warning' });
    }
    else if (!validateValuedString(sub.val())) {
        doAlert({ 'title': '没有标题', 'msg': '发送标题为空', 'style': 'warning' });
    }
    else {
        $(this).attr('disabled', '');
        var postData = {
                'toNickName': to.val(),
                'subject': sub.val(),
                'body': msg.val(),
                'emphasis': $('#md_message_sendMsg_em').data('emphasis'),
            };
        corsAjax({
            url: getDataServerRequestUrl('user', 'sendUserMessage'),
            data: postData,
            success: function (data) {
                $('#md_message_sendMsg_btnSend').removeAttr('disabled');
                doAlert({ 'title': data.returnCode == 0 ? '消息发送成功' : '消息发送失败', 'msg': data.msg, 'style': data.returnCode == 0 ? 'success' : 'warning' });
                if(data.returnCode == 0) {
                    clearSendMsgDialog();
                    refreshMessage(); //refresh
                }
            }
        });
    }
});

$('#md_message').on('show.bs.modal', function(e){
    e.stopPropagation();
    $('#a_message i.fa-comment-o').remove();
    if(!md_message_obj_messages)
        refreshMessage();
});