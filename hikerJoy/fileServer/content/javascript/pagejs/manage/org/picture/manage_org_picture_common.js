bindEvent2ImageBtnAndReviewer($('#org_picture_orgBanner_upload'), $('#org_picture_orgBanner_review'), 250, 1500);

bindEvent2ImageBtnAndReviewer($('#org_picture_orgLogo_upload'), $('#org_picture_orgLogo_review'), 225, 400);

$('#org_picture_orgLogo_submit, #org_picture_orgBanner_submit').bind('click', function(){
    var btn = $(this);
    var type = btn.data('type'), bannerLoad = $('#org_picture_orgBanner_review').attr('src').indexOf('data:image') === 0, logoLoad = $('#org_picture_orgLogo_review').attr('src').indexOf('data:image') === 0;
    if((type === 'banner' && !bannerLoad) || (type === 'logo' && !logoLoad)) {
        doAlert({ 'title': '上传失败', 'msg': (type === 'banner' ? '站点横幅':'站点Logo') + '上传失败，请先从本地加载图片', 'style': 'warning' });
        return;
    }

    var imgData = type === 'banner' ? $('#org_picture_orgBanner_review').attr('src') : $('#org_picture_orgLogo_review').attr('src');
    btn.parent('div').find('button, input[type=file]').attr('disabled', '');
    corsAjax({
        url: getDataServerRequestUrl('org', 'uploadOrgPic'),
        data: { 'orgAlias': getCurrentPageOrg(), 'pic64': imgData, 'type': type },
        success: function (data) {
            console.log(data);
            btn.parent('div').find('button, input[type=file]').removeAttr('disabled', '');
            if(data && data.returnCode == 0) {
                doAlert({ 'title': '上传成功', 'msg': (type === 'banner' ? '站点横幅':'站点Logo') + '上传成功', 'style': 'success' });
                if(type === 'banner')
                    $('#siteBanner img, #org_picture_orgBanner_review').attr('src', data.url);
                else
                    $('#org_picture_orgLogo_review').attr('src', data.url);
            }
            else {
                doAlert({ 'title': '上传失败', 'msg': data.msg, 'style': 'warning' });
            }
        }
    });
});

//load current banner and logo for org
hikerJoy_context.getOrgContext()
.then(function (orgs) {
    var myorg = searchOrgByAlias(orgs, getCurrentPageOrg());
    if(myorg) {
        $('#org_picture_orgBanner_review').attr('src', myorg.bannerUrl);
        $('#org_picture_orgLogo_review').attr('src', myorg.logoUrl);
    }
});