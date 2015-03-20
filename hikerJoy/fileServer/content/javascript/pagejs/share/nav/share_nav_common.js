$('.ctrl_adminShow, .ctrl_authShow, .ctrl_oneAdminShow').hide();
isCurrentUserLogin()
.then(function (login) {
    if(login) {
        $('.ctrl_noAuthShow').hide();
        $('.ctrl_authShow').show();
        return Q.all([isCurrentUserGodOrObOrAdmin(), isCurrentUserGodOrObOrAdminOfAnyOrg() ]);
    }
    else {
        $('.ctrl_noAuthShow').show();
        $('.ctrl_authShow').hide();
        return [false, false];
    }
})
.then(function (data) {
    if(data[0])
        $('.ctrl_adminShow').show();
    else
        $('.ctrl_adminShow').hide();
    if(data[1])
        $('.ctrl_oneAdminShow').show();
    else
        $('.ctrl_oneAdminShow').hide();
});