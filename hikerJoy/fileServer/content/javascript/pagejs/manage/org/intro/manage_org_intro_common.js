$('#org_intro_summernote').summernote(generalSummernoteOption());

corsAjax({
    url: getDataServerRequestUrl('org', 'getOrgIntro'),
    data: { 'orgAlias': getCurrentPageOrg() },
    success: function (data) {
        var introData = data.intro, shortIntroData = data.shortIntro;
        $('#org_intro_summernote').code(htmlPostArrayToHtml(introData));
        $('#org_intro_shortIntro').val(shortIntroData || '');
    }
});

$('#org_intro_submit').bind('click', function () {
    var btn = $(this).attr('disabled', '');
    var intro = $('<div />').html($('#org_intro_summernote').code()).toHtmlPostModel();
    var shortIntro = $('#org_intro_shortIntro').val();
    corsAjax({
        url: getDataServerRequestUrl('org', 'updateOrgIntro'),
        data: { 'orgAlias': getCurrentPageOrg(), 'intro': intro, 'shortIntro': shortIntro },
        success: function (data) {
            console.log(data);
            if (data)
                doAlert({ 'title': data.returnCode === 0 ? '保存成功' : '保存失败', 'msg': data.msg, 'style': data.returnCode === 0 ? 'success' : 'warning' });
            if(data.returnCode === 0 && validateNonEmptyArray(data.picUrls)) {
                replaceHtmlPostArrayImageSrc(intro, data.picUrls);
                $('#org_intro_summernote').code(htmlPostArrayToHtml(intro));
            }
            btn.removeAttr('disabled');
        }
    });
});
