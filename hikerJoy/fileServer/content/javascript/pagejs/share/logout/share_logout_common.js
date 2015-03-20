$('#a_logout').bind('click', function(e){
    e.preventDefault();
	corsAjax({
		url: getDataServerRequestUrl('security', 'logout'),
		success: function (data) {
			if (data && data.logout) {
				location.reload();
			}
			else {
				doAlert({ 'title': '注销失败', 'msg': '注销失败，请尝试刷新页面', 'style': 'warning' });
			}
		}
	});
});