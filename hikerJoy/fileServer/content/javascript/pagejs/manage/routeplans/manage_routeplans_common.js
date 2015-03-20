var userLeaderCache = new _hikerJoy_cache();

var getUserLeaderFromCache = function (term) {
    term = term.trim();
    if (term.length === 0)
        return null;

    return userLeaderCache.customSearch(term, function (tm, map) {
        for (var idx in map) {
            if (tm.indexOf(idx) === 0) {
                var ret = map[idx].filter(function (v) {
                    return v.email.indexOf(tm) === 0 || (validateValuedString(v.name) && v.name.indexOf(tm) === 0) || (validateValuedString(v.nickName) && v.nickName.indexOf(tm) === 0);
                });
                return ret;
            }
        };
        return null;
    });
};

var activityTagCache = new _hikerJoy_cache();

var getActivityTagFromCache = function (term) {
    term = term.trim();
    if (term.length === 0)
        return null;

    return activityTagCache.customSearch(term, function (tm, map) {
        for (var idx in map) {
            if (tm.indexOf(idx) >= 0) {
                var ret = map[idx].filter(function (v) {
                    return v === '其它' || v.indexOf(tm) >= 0;
                });
                return ret;
            }
        };
        return null;
    });
};

$('#md_act_basicInfo_leaders').autocomplete({
    source: function (req, res) {
        var term = req.term.trim();
        if (term.length === 0) { res([]); }
        else {
            var fromCache = getUserLeaderFromCache(term);
            if (fromCache) { res(fromCache); }
            else {
                corsAjax({
                    url: getDataServerRequestUrl('user', 'queryUserByNickNameOrNameOrEmail'),
                    data: { 'query': term },
                    success: function (data) {
                        if (validateNonEmptyArray(data)) {
                            var data = data.map(function (v, k) {
                                v.label = generateLabelForUserAutoComplete(v);
                                return v;
                            });
                        }
                        else { data = []; }
                        res(data);
                        userLeaderCache.setValue(term, data);
                    }
                });
            }
        }
    },
    minLength: 1,
    select: function (e, option) {
        if (option.item) {
            userInfoCache.setValue(option.item._id, option.item);
            appendOneOrganizerToEditor(option.item._id);
            $('#md_act_basicInfo_leaders').val('');
            return false;
        }
    }
});

var appendOneOrganizerToEditor = function (id) {
    var idDup =  false;
    $('#md_act_basicInfo_selectedLeaders .activityLeader').each(function () {
        if(!idDup && $(this).data('id') == id)
            idDup = true;
    });
    if(!idDup) {
        var span = $('<span />').addClass('activityLeader').data('id', id).append($('<span />').text(userInfoCache.getValue(id).label))
                                .append($('<i />').addClass('fa fa-times hoverRed pointerCursor removeLeader marginL2px').bind('click', function () { $(this).parents('.activityLeader').remove(); }));
        $('#md_act_basicInfo_selectedLeaders').append(span);
    }
};

$('#md_act_basicInfo_tags').autocomplete({
    source: function (req, res) {
        var term = req.term.trim();
        if (term.length === 0) { res([]); }
        else {
            var fromCache = getActivityTagFromCache(term);
            if (fromCache) { res(fromCache); }
            else {
                corsAjax({
                    url: getDataServerRequestUrl('activity', 'queryActivityTags'),
                    data: { 'query': term },
                    success: function (data) {
                        if (!(Array.isArray(data) && data.length > 0)) { data = ['其它']; }
                        res(data);
                        activityTagCache.setValue(term, data);
                    }
                });
            }
        }
    },
    minLength: 1,
    select: function (e, option) {
        if (option.item) {
            if (option.item.value === '其它') { var tag = { 'name': '' }; }
            else { var tag = option.item.value; }
            appendOneTagToEditor(tag);
            $('#md_act_basicInfo_tags').val('');
            return false;
        }
    }
});

var appendOneTagToEditor = function (tag) {
    //tag: string or {'name': }
    var span = $('<span />').addClass('activityTag').data('tag', tag)
                .append(
                    (typeof tag) === 'string' ?
                    $('<span />').text(tag) :
                    $('<input />').addClass('form-control md_act_basicInfo_selfDefineTag').css('width', '100px').css('display', 'inline-block').css('margin-right', '5px').val(tag.name).bind('focusout', function () { $(this).parents('.activityTag').data('tag', { 'name': $(this).val() }); })
                )
                .append($('<i />').addClass('fa fa-times hoverRed pointerCursor removeActTag marginL2px').bind('click', function () { $(this).parents('.activityTag').remove(); }));
    $('#md_act_basicInfo_selectedTags').append(span);
};

var userInfoCache = new _hikerJoy_cache();

var pageActivities = new (function () {
    var currentActivity = null;
    var activitiesData = null;

    this.init = function () {
        var loadingActs = genereateLoadingDiv('正在加载社团的当前活动 ^^ ...');
        $('#activityReviews').append(loadingActs);
        var defer = new Q.defer();
        corsAjax({
            url: getDataServerRequestUrl('activity', 'getAllActiveActs'),
            data: { 'orgAlias': getCurrentPageOrg() },
            success: function (data) {
                loadingActs.remove();
                if (validateNonEmptyArray(data))
                    data = data.sort(function (v1, v2) { return sortByDateAsc(v1, v2, 'createdOn'); });
                else
                    data = [];
                activitiesData = data;
                defer.resolve();
            }
        });
        return defer.promise;
    };

    this.getActsLeadersFromServer = function () {
        var defer = new Q.defer();
        if (validateNonEmptyArray(activitiesData)) {
            var userIdList = [];
            activitiesData.forEach(function (v) {
                if (validateNonEmptyArray(v.organizer)) { userIdList = userIdList.concat(v.organizer); }
            });
            corsAjax({
                url: getDataServerRequestUrl('user', 'queryUserById'),
                data: { 'userIdList': userIdList },
                success: function (data) {
                    if (validateNonEmptyArray(data)) {
                        data.forEach(function (v) {
                            v.label = generateLabelForUserAutoComplete(v);
                            userInfoCache.setValue(v._id, v);
                        });
                    }
                    defer.resolve();
                }
            });
        }
        else defer.resolve();
        return defer.promise;
    };

    this.getActsRecruitmentsFromServer = function () {
        if (validateNonEmptyArray(activitiesData)) {
            return Q.all(activitiesData.map(function (v) {
                var defer = new Q.defer();
                var stored = hikerJoy_storage.getStoredRecruitment(v._id);
                if (stored && dateEquals(stored.recruitmentUpdatedOn, v.recruitmentUpdatedOn)) {
                    v.recruitment = stored.recruitment;
                    defer.resolve();
                }
                else {
                    console.log('from server');
                    corsAjax({
                        url: getDataServerRequestUrl('activity', 'getActRecruitment'),
                        data: { 'actId': v._id, 'recruitmentUpdatedOn': null },
                        success: function (data) {
                            if (data.recruitment) {
                                v.recruitment = data.recruitment;
                                hikerJoy_storage.storeRecruitment(v._id, data.recruitment, data.recruitmentUpdatedOn);
                            }
                            else v.recruitment = [];
                            defer.resolve();
                        }
                    });
                }
                return defer.promise;
            }));
        }
        else
            return;
    };

    this.addNewActivity = function () {
        var defaultStartsOn = new Date();
        defaultStartsOn.setDate(defaultStartsOn.getDate() + 30);
        var defaultEndsOn = new Date();
        defaultEndsOn.setDate(defaultEndsOn.getDate() + 31);
        var newAct = {
            'name': '新线路',
            'statusId': 110, //preparing
            'picUrl': '/content/image/route_default.jpg',
            'startsOn': defaultStartsOn.format('yyyy/MM/dd'),
            'endsOn': defaultEndsOn.format('yyyy/MM/dd'),
            'organizer': [],
            'tags': []
        };
        activitiesData.push(newAct);
        _appendOneActReview(newAct);
    };

    var _flushDataToEditor = function () {
        var data = currentActivity = $(this).data('act');
        $('#md_act_basicInfo_name').val(data.name || '');
        $('#md_act_basicInfo_status').val(data.statusId || 110);
        $('#md_act_basicInfo_startsOn').datepicker('setDate', new Date(data.startsOn || ''));
        $('#md_act_basicInfo_endsOn').datepicker('setDate', new Date(data.endsOn || ''));
        $('#md_act_basicInfo_intro').val(data.intro || '');
        //$('#md_act_basicInfo_leaders').val(data.organizer);
        $('#md_act_basicInfo_picReview').attr('src', data.picUrl || '');
        _flushLeadersToEditor();
        _flushTagsToEditor();
        $('#md_act_recruitment_rpost .summernote').code(htmlPostArrayToHtml(data.recruitment));
        //signup sheet & template page
        _flushSheetLinesToEditor();
        $('#md_act').modal({ 'backdrop': 'static', 'keyboard': false });
    };

    var _flushLeadersToEditor = function () {
        $('#md_act_basicInfo_selectedLeaders').empty();
        if (currentActivity) {
            currentActivity.organizer.forEach(appendOneOrganizerToEditor);
            return true;
        }
        else return false;
    };

    var _flushTagsToEditor = function () {
        $('#md_act_basicInfo_selectedTags').empty();
        if (currentActivity) {
            currentActivity.tags.forEach(appendOneTagToEditor);
            return true;
        }
        else return false;
    };

    var _flushSheetLinesToEditor = function () {
        if (currentActivity) {
            renderSheetLinesToEditor(currentActivity.sheet);
        }
    };

    var _refreshActivitiesFromReviews = function () {
        activitiesData = [];
        $('.actEditorTrigger').each(function () {
            activitiesData.push($(this).data('act'));
        });
    };

    this.saveBackFromEditor = function () {
        if (currentActivity) {
            currentActivity.name = $('#md_act_basicInfo_name').val().trim();
            currentActivity.statusId = $('#md_act_basicInfo_status').val();
            currentActivity.startsOn = $('#md_act_basicInfo_startsOn').val();
            currentActivity.endsOn = $('#md_act_basicInfo_endsOn').val();
            currentActivity.picUrl = $('#md_act_basicInfo_picReview').attr('src');
            currentActivity.intro = $('#md_act_basicInfo_intro').val();
            currentActivity.recruitment = $('<div />').html($('#md_act_recruitment_rpost .summernote').code()).toHtmlPostModel();
            currentActivity.organizer = [];
            $('#md_act_basicInfo_selectedLeaders .activityLeader').each(function () {
                currentActivity.organizer.push($(this).data('id'));
            });
            currentActivity.tags = [];
            $('#md_act_basicInfo_selectedTags .activityTag').each(function () {
                currentActivity.tags.push($(this).data('tag'));
            });
            currentActivity.sheet = [];
            $('#md_act_signUpSheet .signUpSheet_additionalItem').each(function () {
                currentActivity.sheet.push($(this).data('sheetline'));
            });
            return true;
        }
        else return false;
    };

    this.removeActContext = function () { currentActivity = null; };

    this.buildActReview = function () {
        $('#activityReviews').empty();
        activitiesData.forEach(_appendOneActReview);
    };

    var _appendOneActReview = function (act) {
        var review = $('<a />').addClass('col-xs-6 col-sm-4 col-md-3 anchorNoneDeco actEditorTrigger').css('margin-bottom', '15px').data('act', act).bind('click', _flushDataToEditor);
        var img = $('<img />').attr('src', act.picUrl).addClass('img-responsive').css('border-radius', '5px');
        var remover = $('<i />').addClass('fa fa-times pull-left actRemover hoverRed').css('margin-top', '3px').bind('click', _removeActivity);
        var archive = $('<i />').addClass('fa fa-database pull-left actArchive hoverRed').css('margin-top', '3px').bind('click', _archiveActivity);
        var name = $('<span />').addClass('pointerCursor displayViewDesc').text(act.name);
        review.append(img).append(remover).append(archive).append(name);
        $('#activityReviews').append(review);
    };

    this.submitCurrentActivity = function () {
        var defer = new Q.defer();
        if (!currentActivity) {
            doAlert({ 'title': '提交活动失败', 'msg': '未能找到待提交活动，请重试，如仍不可用，请联系系统管理员', 'style': 'warning' });
            defer.resolve();
        }
        else if (!validateValuedString(currentActivity.name)) {
            doAlert({ 'title': '提交活动失败', 'msg': '无效的活动名，请重试，如仍不可用，请联系系统管理员', 'style': 'warning' });
            defer.resolve();
        }
        else if (!validateDate(currentActivity.startsOn) || !validateDate(currentActivity.endsOn) || (new Date(currentActivity.startsOn)).getTime() > (new Date(currentActivity.endsOn)).getTime()) {
            doAlert({ 'title': '提交活动失败', 'msg': '无效的开始或结束时间，结束时间不能小于开始时间哟', 'style': 'warning' });
            defer.resolve();
        }
        else if (!validateNonEmptyArray(currentActivity.organizer)) {
            doAlert({ 'title': '提交活动失败', 'msg': '请至少选择一个组织者', 'style': 'warning' });
            defer.resolve();
        }
        else {
            var btns = $('#md_act_save, #md_act_submit').attr('disabled', '');
            var originalTags = currentActivity.tags;
            var index = activitiesData.indexOf(currentActivity);
            currentActivity.tags = _processActTagsToPureArray(currentActivity.tags);
            corsAjax({
                url: getDataServerRequestUrl('activity', 'submitOrgActivity'),
                data: { 'orgAlias': getCurrentPageOrg(), 'act': currentActivity },
                success: function (data) {
                    doAlert({ 'title': data.returnCode == 0 ? '提交活动成功' : '提交活动失败', 'msg': data.msg, 'style': data.returnCode == 0 ? 'success' : 'warning' });
                    btns.removeAttr('disabled');
                    $('#md_act').modal('hide');
                    if (data.returnCode == 0) {
                        if (index >= 0) {
                            var target = activitiesData[index];
                            if(data.picUrl)
                                target.picUrl = data.picUrl;
                            if(validateNonEmptyArray(data.recruitmentPicUrls))
                                replaceHtmlPostArrayImageSrc(target.recruitment, data.recruitmentPicUrls);
                            if(data.recruitmentUpdatedOn)
                                hikerJoy_storage.storeRecruitment(target._id, target.recruitment, data.recruitmentUpdatedOn);
                            if(data._id)
                                target._id = data._id;
                            if(data.orgId)
                                target.orgId = data.orgId;
                        }
                        else
                            location.reload(); //should not go this place!
                    }
                    else
                        currentActivity.tags = originalTags;
                    defer.resolve();
                }
            });
        }
        return defer.promise;
    };

    var _processActTagsToPureArray = function (tags) {
        var ret = [];
        tags.forEach(function (v) {
            if ((typeof v) !== 'string')
                v = v.name;
            v = v.trim();
            if (v.length > 0 && !ret.contains(v))
                ret.push(v);
        });
        return ret;
    };

    var _removeActivity = function (e) {
        var review = $(this).parents('.actEditorTrigger');
        var id = review.data('act')._id;
        setRemoveAlert();
        archiveRemoveActivityAlert(id)
        .then(function (remove) {
            if (remove) {
                if (!id) {
                    review.remove();
                    _refreshActivitiesFromReviews();
                }
                else {
                    corsAjax({
                        url: getDataServerRequestUrl('activity', 'setOrgActRemoved'),
                        data: { 'orgAlias': getCurrentPageOrg(), 'actId': id },
                        success: function (data) {
                            if (data) {
                                if (data.returnCode !== 0)
                                    doAlert({ 'title': '删除活动失败', 'msg': data.msg, 'style': 'warning' });
                                else {
                                    review.remove();
                                    _refreshActivitiesFromReviews();
                                }
                            }
                        }
                    });
                }
            }
        });
        e.stopPropagation();
    };

    var _archiveActivity = function (e) {
        var review = $(this).parents('.actEditorTrigger');
        var id = review.data('act')._id;
        setArchiveAlert();
        archiveRemoveActivityAlert(id)
        .then(function (archive) {
            if (archive) {
                if (!id) {
                    review.remove();
                    _refreshActivitiesFromReviews();
                }
                else {
                    corsAjax({
                        url: getDataServerRequestUrl('activity', 'setOrgActArchived'),
                        data: { 'orgAlias': getCurrentPageOrg(), 'actId': id },
                        success: function (data) {
                            if (data) {
                                if (data.returnCode !== 0)
                                    doAlert({ 'title': '归档活动失败', 'msg': data.msg, 'style': 'warning' });
                                else {
                                    review.remove();
                                    _refreshActivitiesFromReviews();
                                }
                            }
                        }
                    });
                }
            }
        });
        e.stopPropagation();
    };
})();

var pageTemplates = new (function () {
    var templates = [];

    this.init = function () {
        var defer = new Q.defer();
        corsAjax({
            url: getDataServerRequestUrl('org', 'getOrgActTemplates'),
            data: { 'orgAlias': getCurrentPageOrg() },
            success: function (data) {
                if (!validateNonEmptyArray(data)) data = [];
                templates = data;
                defer.resolve();
            }
        });
        return defer.promise;
    };

    this.getDuplicatedTemplateName = function (str) {
        var dup = null;
        templates.forEach(function (v, k) {
            if (v && v.name === str)
                dup = v.name;
        });
        return dup;
    };

    var _appendOneTemplateToEditor = function (tmpl) {
        var tmp = $('<span />').text(tmpl.name).addClass('signUpTemplate').bind('click', _applyTemplate);
        var rename = $('<input />').addClass('signUpTemplate_rename').hide().bind('focusout', _renameTemplate);
        var renameIndicator = $('<i/>').addClass('fa fa-edit pointerCursor signUpTemplate_rename_trigger hoverYellowgreen').css('margin-right', '5px').bind('click', _triggerTemplateRename);
        var remove = $('<i/>').addClass('fa fa-trash-o pointerCursor hoverRed').bind('click', _removeTemplate);
        var tmpArea = $('<span />').data('template', tmpl).addClass('signUpTemplate_area').append(tmp).append(rename).append(renameIndicator).append(remove);
        $('#md_act_signUpSheet_templates').append(tmpArea);
    };

    this.flushTemplatesToEditor = function () {
        var container = $('#md_act_signUpSheet_templates').empty();
        templates.forEach(_appendOneTemplateToEditor);
        refreshTemplateUpdateButtons();
    };

    var _saveBackFromEditor = this.saveBackFromEditor = function () {
        templates = [];
        $('#md_act_signUpSheet_templates .signUpTemplate_area').each(function () {
            templates.push($(this).data('template'));
        });
    };

    var _triggerTemplateRename = function () {
        var obj = $(this).hide();
        var oldName = obj.parents('.signUpTemplate_area').data('template').name;
        obj.siblings('.signUpTemplate_rename').show().val(oldName).focus();
    };

    var _renameTemplate = function () {
        var obj = $(this);
        var newName = obj.val().trim();
        obj.val('').hide();
        var renameIndicator = obj.siblings('.signUpTemplate_rename_trigger').show();
        var index = Number(obj.parent('span').data('index'));
        var oldName = obj.parents('.signUpTemplate_area').data('template').name;
        if (newName.length > 0 && oldName != newName) {
            corsAjax({
                url: getDataServerRequestUrl('org', 'renameOrgSignupSheetTemplate'),
                data: { 'orgAlias': getCurrentPageOrg(), 'oldName': oldName, 'newName': newName },
                success: function (data) {
                    if (data && data.returnCode == 0) {
                        obj.siblings('.signUpTemplate').text(data.newName);
                        obj.parents('.signUpTemplate_area').data('template').name = data.newName;
                        refreshTemplateUpdateButtons();
                    }
                    else
                        doAlert({ 'title': '重命名模板失败', 'msg': data.msg, 'style': 'warning' });
                }
            });
        }
    };

    var _removeTemplate = function () {
        var templateArea = $(this).parents('.signUpTemplate_area');
        var index = Number(templateArea.data('index'));
        var name = templateArea.data('template').name;
        corsAjax({
            url: getDataServerRequestUrl('org', 'deleteOrgSignupSheetTemplate'),
            data: { 'orgAlias': getCurrentPageOrg(), 'name': name },
            success: function (data) {
                if (data && data.returnCode == 0) {
                    templateArea.remove();
                    _saveBackFromEditor();
                    refreshTemplateUpdateButtons();
                }
                else
                    doAlert({ 'title': '删除模板失败', 'msg': data.msg, 'style': 'warning' });
            }
        });
    };

    var _applyTemplate = function () {
        var template = $(this).parents('.signUpTemplate_area').data('template');
        $('#md_act_signUpSheet_newTemplate_name').val(template.name);
        renderSheetLinesToEditor(template.items);
        refreshTemplateUpdateButtons();
    };

    this.upsertTemplate = function () {
        var newName = $('#md_act_signUpSheet_newTemplate_name').val();
        var newTmp = { 'name': newName, 'items': [] };
        $('#md_act_signUpSheet .signUpSheet_additionalItem').each(function () {
            newTmp.items.push($(this).data('sheetline'));
        });
        corsAjax({
            url: getDataServerRequestUrl('org', 'upsertOrgSignupSheetTemplate'),
            data: { 'orgAlias': getCurrentPageOrg(), 'template': newTmp },
            success: function (data) {
                if (data && data.returnCode === 0) {
                    var replace = null;
                    $('.signUpTemplate').each(function () {
                        if ($(this).text() === newName) replace = $(this);
                    });
                    if (replace)
                        replace.parents('.signUpTemplate_area').data('template', newTmp);
                    else
                        _appendOneTemplateToEditor(newTmp);
                    _saveBackFromEditor();
                    refreshTemplateUpdateButtons();
                }
                else
                    doAlert({ 'title': '提交模板失败', 'msg': data ? data.msg || '' : '', 'style': 'warning' });
            }
        });
    };
})();

pageActivities.init()
.then(function () {
    return Q.all([pageActivities.getActsLeadersFromServer(), pageActivities.getActsRecruitmentsFromServer()]);
})
.then(pageActivities.buildActReview);

pageTemplates.init()
.then(pageTemplates.flushTemplatesToEditor);

$('#md_act_recruitment_rpost .summernote').summernote(generalSummernoteOption());

//defaultDatePickerOption comes from hikerJoy_lib.js
$('#md_act_basicInfo_startsOn').datepicker(defaultDatePickerOption).on('changeDate', function (e) {
    var dt = new Date(e.date);
    dt.setDate(dt.getDate() + 1);
    $('#md_act_basicInfo_endsOn').datepicker('setDate', dt);
});
$('#md_act_basicInfo_endsOn').datepicker(defaultDatePickerOption);

//bindEvent2ImageBtnAndReviewer from hikerJoy_lib_image.js
bindEvent2ImageBtnAndReviewer($('#md_act_basicInfo_uploadPic'), $('#md_act_basicInfo_picReview'), 720, 1280);

$('#md_act_save').bind('click', function () {
    pageActivities.saveBackFromEditor();
    pageActivities.removeActContext();
    //rebuild the review because act-name and pic may change
    pageActivities.buildActReview();
    $('#md_act').modal('hide');
});

$('#md_act_submit').bind('click', function () {
    pageActivities.saveBackFromEditor();
    pageActivities.submitCurrentActivity()
    .then(pageActivities.removeActContext)
    .then(pageActivities.buildActReview)
    .then(function () { $('#md_act').modal('hide'); });
});

var setRemoveAlert = function () {
    $('#md_archiveRemoveActivity_title').text('警告：删除活动！');
    $('#md_archiveRemoveActivity_body').text('是否删除活动？被删除的活动将无法恢复，强烈建议仅当创建了多余的活动线路时进行删除操作。');
    $('#md_archiveRemoveActivity_btnDo').text('删除');
};

var setArchiveAlert = function () {
    $('#md_archiveRemoveActivity_title').text('警告：归档活动！');
    $('#md_archiveRemoveActivity_body').text('是否归档活动？被归档的活动将永久保存，归档之后无法进行任何操作，但可以在普通页-历史活动中查看。');
    $('#md_archiveRemoveActivity_btnDo').text('归档');
};

var archiveRemoveActivityAlert = function (actId) {
    var defer = new Q.defer();
    if (!actId) {
        defer.resolve(true);
    }
    else {
        $('#md_archiveRemoveActivity_btnCancel').unbind('click').bind('click', function () {
            defer.resolve(false);
        });
        $('#md_archiveRemoveActivity_btnDo').unbind('click').bind('click', function () {
            defer.resolve(true);
        });
        $('#md_archiveRemoveActivity').modal({ 'backdrop': 'static', 'keyboard': false });
    }
    return defer.promise;
};

$('#btnAddActivity').bind('click', pageActivities.addNewActivity);

var appendOneActivitySheetLineToEditor = function (sheetline) {
    //renderSheetLineItem_mapping from hikerJoy_lib.js
    var fn = renderSheetLineItem_mapping[sheetline.type];
    if (fn) {
        var ret = fn(sheetline);
        ret.addClass('signUpSheet_additionalItem').data('sheetline', sheetline).append($('<i />').addClass('fa fa-times hoverRed pointerCursor').bind('click', function () { $(this).parents('.signUpSheet_additionalItem').remove(); refreshTemplateUpdateButtons(); }));
        var additionalItems = $('#md_act_signUpSheet .signUpSheet_additionalItem').last();
        if (additionalItems.length > 0)
            additionalItems.after(ret);
        else
            $('#md_act_signUpSheet_lastBasicInfo').after(ret);
    }
};

var addSignUpSheetNewLine = function () {
    var newLine = validateAndAddNewSheetLineItem();
    if (newLine) {
        appendOneActivitySheetLineToEditor(newLine);
        resetSignUpSheetNewLine();
        refreshTemplateUpdateButtons();
    }
};

var resetSignUpSheetNewLine = function () {
    $('#md_act_addSheetLine_label').val('').focus().parent('div').removeClass('has-error');
    $('#md_act_addSheetLine_type option:eq(0)').attr('selected', '');
    $('#md_act_addSheetLine_type').trigger('change');
    $('#md_act_addSheetLine_children').val('').parent('div').removeClass('has-error');
};

$('#md_act_signUpSheet_newLine_add').bind('click', addSignUpSheetNewLine);

$('#md_act_addSheetLine_label, #md_act_addSheetLine_children').bind('keypress', 'return', addSignUpSheetNewLine);

$('#md_act_signUpSheet_newLine_reset').bind('click', resetSignUpSheetNewLine);

$('#md_act_addSheetLine_type').bind('change', function () {
    var opt = $(this).find('option:selected');
    if (opt.is('.signUpSheetLineHasChildren'))
        $('#md_act_addSheetLine_children').parent('div').show();
    else
        $('#md_act_addSheetLine_children').parent('div').hide();
}).trigger('change');

var validateAndAddNewSheetLineItem = function () {
    var label = $('#md_act_addSheetLine_label').val().trim();
    var labelYes = validateValuedString($('#md_act_addSheetLine_label').val());
    var type = $('#md_act_addSheetLine_type').val(); //no check in UI code
    var newLine = { 'label': label, 'type': type };
    var childrenYes = true;
    if ($('#md_act_addSheetLine_type option:selected').is('.signUpSheetLineHasChildren')) {
        //splitString2ArrayBySemicolon from hikerJoy_lib.js
        var children = splitString2ArrayBySemicolon($('#md_act_addSheetLine_children').val());
        if (children.length === 0) childrenYes = false;
        newLine.children = children; //array of string
    }
    $('#md_act_signUpSheet .signUpSheet_additionalItem').each(function () {
        if ($(this).data('sheetline').label == newLine.label)
            labelYes = false;
    });
    if (labelYes)
        $('#md_act_addSheetLine_label').parent('div').removeClass('has-error');
    else
        $('#md_act_addSheetLine_label').parent('div').addClass('has-error');
    if (childrenYes)
        $('#md_act_addSheetLine_children').parent('div').removeClass('has-error');
    else
        $('#md_act_addSheetLine_children').parent('div').addClass('has-error');
    if (labelYes && childrenYes)
        return newLine;
    else
        return false;
};

var refreshTemplateUpdateButtons = function () {
    $('#md_act_signUpSheet_newTemplate_name').parent('div').removeClass('has-error');
    $('#md_act_signUpSheet_addTemplate').attr('disabled', '');
    $('#md_act_signUpSheet_replaceTemplate').attr('disabled', '');
    var newTemplateName = $('#md_act_signUpSheet_newTemplate_name').val().trim();
    if ($('#md_act_signUpSheet .signUpSheet_additionalItem').length > 0 && newTemplateName.length > 0) {
        var dup = pageTemplates.getDuplicatedTemplateName(newTemplateName);
        if (dup != null)
            $('#md_act_signUpSheet_replaceTemplate').removeAttr('disabled');
        else
            $('#md_act_signUpSheet_addTemplate').removeAttr('disabled');
    }
};

var renderSheetLinesToEditor = function (sheetlines) {
    $('#md_act_signUpSheet .signUpSheet_additionalItem').remove();
    if (validateNonEmptyArray(sheetlines)) {
        sheetlines.forEach(appendOneActivitySheetLineToEditor);
    }
    refreshTemplateUpdateButtons();
};

$('#md_act_signUpSheet_newTemplate_name').bind('keyup', refreshTemplateUpdateButtons);

$('#md_act_signUpSheet_replaceTemplate').bind('click', function () {
    var dup = pageTemplates.getDuplicatedTemplateName($('#md_act_signUpSheet_newTemplate_name').val());
    if (dup != null && $('#md_act_signUpSheet .signUpSheet_additionalItem').length > 0)
        pageTemplates.upsertTemplate();
});

$('#md_act_signUpSheet_addTemplate').bind('click', function () {
    var newNameInput = $('#md_act_signUpSheet_newTemplate_name');
    var newName = newNameInput.val().trim();
    if (newName.length == 0)
        newNameInput.parent('div').addClass('has-error');
    else {
        var dup = pageTemplates.getDuplicatedTemplateName(newName);
        if (dup == null && $('#md_act_signUpSheet .signUpSheet_additionalItem').length > 0)
            pageTemplates.upsertTemplate();
        else
            console.log('md_act_signUpSheet_addTemplate called with dup or no sheet line!');
    }
});