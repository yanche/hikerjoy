var query = getQueryString();
if(query && query.ticketId) {
    var ticketId = query.ticketId;
    corsAjax({
        url: getDataServerRequestUrl('security', 'claimPwdReset'),
        data: {'ticketId': ticketId},
        success: function(data){
            console.log(data);
            if(data) {
                doAlert({ 'title': data.returnCode == 0 ? '重置密码成功' : '重置密码失败', 'msg': data.msg, 'style': data.returnCode == 0 ? 'success' : 'warning', 'done': function () {window.location = '/';} });
            }
        }
    });
}