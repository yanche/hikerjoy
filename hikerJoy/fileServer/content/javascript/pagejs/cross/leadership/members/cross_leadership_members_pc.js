
var renderActivityMembers = function (oneact) {
    var container = $('<div />').attr('id', 'leadership_members_' + oneact._id).addClass('members_view').data('activity', oneact);
    var basic = renderMemberBasicView(oneact.members, oneact.operate, oneact.sheet).addClass('col-xs-11');
    var operation = renderOperationView(oneact.operate).addClass('col-xs-1');
    var statistic =renderStatisticView(oneact.members, oneact.sheet);
    var anchor = $('<div />').addClass('members_operationView_achor');
    return container.append(basic).append(statistic).append(operation).append(anchor);
};

var findFirstSelectSheetLine = function (lines) {
    if (validateNonEmptyArray(lines)) {
        for (var i = 0; i < lines.length; ++i) {
            var ln = lines[i];
            if (ln.type === 'select' && Array.isArray(ln.children) && ln.children.length > 1)
                return lines[i];
        }
    }
    return null;
};

var chartsDic =new Array();

var commonOption = {
    //Boolean - Whether we should show a stroke on each segment
    segmentShowStroke : true,

    //String - The colour of each segment stroke
    segmentStrokeColor : "#fff",

    //Number - The width of each segment stroke
    segmentStrokeWidth : 2,

    //Number - The percentage of the chart that we cut out of the middle
    percentageInnerCutout : 0, // This is 0 for Pie charts

    //Number - Amount of animation steps
    animationSteps : 100,

    //String - Animation easing effect
    animationEasing : "easeOutBounce",

    //Boolean - Whether we animate the rotation of the Doughnut
    animateRotate : true,

    //Boolean - Whether we animate scaling the Doughnut from the centre
    animateScale : true,

    //String - A legend template
    legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<segments.length; i++){%><li><span style=\"background-color:<%=segments[i].fillColor%>\"></span><%if(segments[i].label){%><%=segments[i].label+ \": \" +segments[i].value%><%}%></li><%}%></ul>"


}

var GeneratePie =function (data,chartsDic,key){
    var genderPie =$('<div />').addClass(key);
     var canvas = document.createElement('canvas');
     var ctx =canvas.getContext("2d");
     // For a pie chart
    var myPieChart = new Chart(ctx).Doughnut(data, commonOption);
    var legend = myPieChart.generateLegend();
    var canvasDiv= $('<div />').append(canvas).addClass('canvas');
    var legendDiv= $('<div />').append(legend).addClass('legend');
    genderPie.append(canvasDiv);
    genderPie.append(legendDiv);
    chartsDic[key]=myPieChart;
    return genderPie;
}

var RefreshPie =function (container,pieObj){
   pieObj.update();
   var newLegend=pieObj.generateLegend();
   var legendDiv= container.find('.legend');
   legendDiv.empty();
   legendDiv.append(newLegend);
}

var renderMemberBasicView = function (members, operate, sheet) {
    var firstSelect = findFirstSelectSheetLine(sheet);
    var container = $('<div />').addClass('members_basicView');
    var table = $('<table />').addClass('table table-striped table-hover table-condensed members_basicView_table').css('text-align', 'center');
    table.append(renderBasicViewTableHeader(firstSelect));
    table.append(renderBasicViewTableBody(members, operate, sheet));
    return container.append(table);
};

var renderStatisticView = function (members, sheet) {
    var container = $('<div />').addClass('statisticView hidden');
    var totalSelector = $('<select />').addClass('form-control').bind('change', statisticSelectorChanged);
    $('<option />').attr('value', 'all').text('所有报名成员').appendTo(totalSelector);
    $('<option />').attr('value', 'recruited').text('入队成员').appendTo(totalSelector);
    $('<option />').attr('value', 'shown').text('当前显示成员').appendTo(totalSelector);
    container.append(totalSelector).append('<br />');
    return container;
};

var renderBasicViewTableHeader = function (firstSelect) {
    var widthPer = firstSelect ? '20%' : '25%';
    var thead = $('<thead />');
    var theadRow = $('<tr />');
    theadRow.append($('<th />'));
    var nameFilter = $('<input />').addClass('form-control members_basicView_filter').attr('type', 'text').attr('placeholder', '姓名').css('font-weight', 'bold').data('filterKey', 'displayname').data('filterType', 'contains').bind('keyup', filterAndGiveRowNumber);
    theadRow.append($('<th />').css('width', widthPer).append(nameFilter));
    var statusFilter = $('<select />').addClass('form-control members_basicView_filter').css('font-weight', 'bold').data('filterKey', 'statusId').data('filterType', 'equals').bind('change', filterAndGiveRowNumber);
    $('<option />').attr('value', '*').text('所有').appendTo(statusFilter);
    $('<option />').attr('value', '410').text('等待').appendTo(statusFilter);
    $('<option />').attr('value', '420').text('入队').appendTo(statusFilter);
    $('<option />').attr('value', '430').text('强制退出').appendTo(statusFilter);
    $('<option />').attr('value', '440').text('退出').appendTo(statusFilter);
    theadRow.append($('<th />').css('width', widthPer).append(statusFilter));
    var genderFilter = $('<select />').addClass('form-control members_basicView_filter').css('font-weight', 'bold').data('filterKey', 'gender').data('filterType', 'equals').bind('change', filterAndGiveRowNumber);
    $('<option />').attr('value', '*').text('所有').appendTo(genderFilter);
    $('<option />').attr('value', '男').text('男').appendTo(genderFilter);
    $('<option />').attr('value', '女').text('女').appendTo(genderFilter);
    theadRow.append($('<th />').css('width', widthPer).append(genderFilter));
    if (firstSelect) {
        var specialFilter = $('<select />').addClass('form-control members_basicView_filter').css('font-weight', 'bold').data('filterKey', 'special').data('filterType', 'equals').bind('change', filterAndGiveRowNumber);
        $('<option />').attr('value', '*').text('所有').appendTo(specialFilter);
        firstSelect.children.forEach(function (v) { $('<option />').attr('value', v).text(v).appendTo(specialFilter); });
        theadRow.append($('<th />').css('width', widthPer).append(specialFilter));
    }
    theadRow.append($('<th />').addClass('briefView').css('vertical-align', 'middle').append($('<span />').text('报名日期 ').addClass('members_basicView_signupOnSorter')));
    theadRow.append($('<th />').css('vertical-align', 'middle').append($('<input />').attr('type', 'checkbox').addClass('members_basicView_selectAll').bind('change', selectAllMemberChange)));
    theadRow.appendTo(thead);
    return thead;
}

var renderBasicViewTableBody = function (members, operate, sheet) {
    var firstSelect = findFirstSelectSheetLine(sheet);
    var tbody = $('<tbody />');
    var inTeam = members.filter(function (v, k) { return v.statusId == 420 }).sort(sortBySignup);
    var queued = members.filter(function (v, k) { return v.statusId == 410 }).sort(sortBySignup);
    var quit = members.filter(function (v, k) { return v.statusId == 440 }).sort(sortBySignup);
    var kickout = members.filter(function (v, k) { return v.statusId == 430 }).sort(sortBySignup);
    initialRowCount = 0;
    inTeam.forEach(function (v, k) {
        tbody.append(renderBasicViewTableBodyRow(v, operate, firstSelect));
        tbody.append(renderDetailViewTableBodyRow(v,sheet));
    });
    queued.forEach(function (v, k) {
        tbody.append(renderBasicViewTableBodyRow(v, operate, firstSelect));
        tbody.append(renderDetailViewTableBodyRow(v,sheet));
    });
    quit.forEach(function (v, k) {
        tbody.append(renderBasicViewTableBodyRow(v, operate, firstSelect));
        tbody.append(renderDetailViewTableBodyRow(v,sheet));
    });
    kickout.forEach(function (v, k) {
        tbody.append(renderBasicViewTableBodyRow(v, operate, firstSelect));
        tbody.append(renderDetailViewTableBodyRow(v,sheet));
    });
    return tbody;
};

var renderDetailViewTableBodyRow = function (onemem,sheet) {
    var tr = $('<tr />').addClass('members_memberDetail').addClass('hidden');
    var td=$('<td />').attr('colspan','100');
    var divAll=$('<div />');
    var memberItems = onemem.items;
    var memberInfo = onemem.personalInfo;
    var detailView =buildDetailView(onemem,sheet);
    divAll.append(detailView);
    td.append(divAll); 
    tr.append(td);
    return tr;
};

var renderBasicViewTableBodyRow = function (onemem, operate, firstSelect) {
    var tr = $('<tr />').addClass('pointerCursor members_memberLine').bind('click', selectOneMember);
    var displayname = onemem.personalInfo.name || onemem.nickName || '';
    tr.data('statusId', onemem.statusId);
    tr.data('displayname', displayname);
    tr.data('email', onemem.personalInfo.email);
    tr.data('gender', onemem.personalInfo.gender);
    tr.data('memberId', onemem.memberId);
    tr.data('memberItems', onemem.items);
    tr.data('memberPersonalInfo', onemem.personalInfo);
    tr.data('memberNickName', onemem.nickName || '');
    tr.append($('<td />').text(++initialRowCount));
    tr.append($('<td />').text(displayname));
    var statusId = onemem.statusId;
    if (operate && (statusId == 410 || statusId == 420 || statusId == 430)) {
        var statusSelect = $('<select />').addClass('form-control members_status_update').bind('change', updateMemberStatus);
        $('<option />').attr('value', 410).text('等待').appendTo(statusSelect);
        $('<option />').attr('value', 420).text('入队').appendTo(statusSelect);
        $('<option />').attr('value', 430).text('强制退出').appendTo(statusSelect);
        statusSelect.val(statusId);
       $div = $('<div />').append(statusSelect);
         tr.append($('<td />').append($div));
    }
    else
    {  
        tr.append($('<td />').text(memberStatusMapping[statusId]));
    }
    tr.append($('<td />').text(onemem.personalInfo.gender));
    if (firstSelect) {
        var item = mappingData2SheetLine(onemem.items, firstSelect);
        var itemval = item.length > 0 ? item[0].value : '';
        tr.append($('<td />').text(itemval)).data('special', itemval);
    }
    tr.append($('<td />').addClass('briefView').text(new Date(onemem.signUpOn).format('yyyy/MM/dd')));
    tr.append($('<td />').append($('<input />').attr('type', 'checkbox').addClass('members_basicView_selectMember').bind('click', noPropagation)));
    return tr;
};

var renderOperationView = function (operate) {
    var panelBasic_Body = $('<div />').addClass('members_operationView');
    panelBasic_Body.append($('<button />').addClass('btn btn-sm btn-primary members_detailView_btnDownloadMembersReport marginT15px').bind('click', downloadMembersReport).append($('<i />').addClass('fa fa-cloud-download marginR5px')).append($('<span />').text('队员名单')));
    panelBasic_Body.append($('<button />').addClass('btn btn-sm btn-warning members_detailView_btnDownloadFetionCSV marginT15px').bind('click', downloadFetionCSV).append($('<i />').addClass('fa fa-cloud-download marginR5px')).append($('<span />').text('飞信CSV')));
    panelBasic_Body.append($('<button />').addClass('btn btn-sm btn-success members_detailView_btnMessageSender marginT15px ').bind('click', sendMessageModalTrigger).append($('<i />').addClass('fa fa-send marginR5px')).append($('<span />').text('发送邮件')));
    panelBasic_Body.append($('<button />').addClass('btn btn-sm members_operationView_btnShowStatisctic marginT15px ').bind('click', ShowStatistic).append($('<i />').addClass('fa fa-bar-chart-o marginR5px')).append($('<span />').text('查看统计')));
    //panelBasic_Body.append($('<button />').addClass('btn btn-sm members_operationView_btnShowStatisctic marginT15px ').bind('click', updatePie).append($('<i />').addClass('fa fa-bar-chart-o marginR5px')).append($('<span />').text('update')));
    if(!operate) panelBasic_Body.find('.members_detailView_btnMessageSender').attr('disabled', '');
    return panelBasic_Body;
};

var updatePie = function (statView) {
     var statView = $(this).closest('.members_operationView').siblings('.statisticView');
        chartsDic['gender'].segments[0].value=20;
        RefreshPie(statView.find('.gender'),chartsDic['gender'])
    }

var statisticSelectorChanged = function (e) {
      var selector= $(this);
    var statView = selector.parent();
    var tableView =  statView.siblings('.members_basicView');
    var critiria = selector.val();
    CollectDataAndUpdateGenderPie(statView,tableView,critiria);
}

var ifMeetCritiria =function(keyObj, critiria){
    if(critiria === 'all')
    {
        return true;
    }
    else if(critiria === 'recruited')
    {
        var key = keyObj.data('statusId');
        if(key == '420')
        {
            return true;    
        }
    }
    else if(critiria === 'shown')
    {
        if(!keyObj.hasClass('hidden'))
        {
            return true;    
        }
    }
    return false;
}
var CollectDataAndUpdateGenderPie =function(statView,tableView,critiria ) {
        if(critiria == 'shown' && statView.find('select').val() != 'shown')
        {
            return;    
        } 
        var male=0;
        var female=0;
        tableView.find('tbody tr.members_memberLine').each(function () {
        var row = $(this);
        if(row.data('gender')=='女' && ifMeetCritiria(row,critiria))
        {
            female++;
        }
        if(row.data('gender')=='男' && ifMeetCritiria(row,critiria))
         {
             male++;
         }
        });
        if(male== 0 && female ==0 )
        {
            return;    
        }
        if( statView.find('.gender').length==0 )
        {
            var genderPie =GeneratePie( [
            {
            value: male,
            color: "#46BFBD",
            highlight: "#5AD3D1",
            label: "男"
            },
            {
            value: female,
            color: "#FDB45C",
            highlight: "#FFC870",
            label: "女"
            }
            ],chartsDic,'gender');
       
           statView.append(genderPie);
       }
       else
        {
            chartsDic['gender'].segments[0].value=male;
            chartsDic['gender'].segments[1].value=female;
            RefreshPie(statView.find('.gender'),chartsDic['gender'])
       }
}

var ShowStatistic = function (e) {
   //change button text
   var span=$(this).find('span');
   var scope = $(this).closest('.members_operationView').siblings('.members_basicView').find('table.members_basicView_table');
   var tableView = $(this).closest('.members_operationView').siblings('.members_basicView');
   var statView = $(this).closest('.members_operationView').siblings('.statisticView');
   if(span.text() ==='查看统计')
   {   
       span.text('收起统计');
       scope.find('th.briefView,td.briefView').each(function () {
          $(this).addClass('hidden');
          $(this).siblings('select').removeClass('hidden');
       });
        tableView.removeClass('col-xs-11').addClass('col-xs-7');
        statView.removeClass('hidden').addClass('col-xs-4');
        var critiria = statView.find('select').val();
        CollectDataAndUpdateGenderPie(statView,tableView,critiria);
   }
   else
   { 
       span.text('查看统计');
       scope.find('th.briefView,td.briefView').each(function () {
          $(this).removeClass('hidden');
          $(this).siblings('select').addClass('hidden');
       });
        tableView.removeClass('col-xs-7').addClass('col-xs-11');
        statView.addClass('hidden').removeClass('col-xs-4');
   }
    e.stopPropagation();
};

var panelHeadClick = function (e) {
    $(this).data('target').slideToggle();
    e.stopPropagation();
};

var filterAndGiveRowNumber = function () {
    var scope = $(this).closest('table.members_basicView_table');
    filter(scope);
    tableView = scope.parent();
    statView =scope.parent().siblings('.statisticView');
    if(!statView.hasClass('hidden'))
    {
        CollectDataAndUpdateGenderPie(statView,tableView,'shown');
    }
    giveRowNumberToVisibleRows(scope);

};

//var GobalSearch = function () {
//    var keyword= $(this).val();
//    var scope = $(this).closest('.members_operationView').siblings('.members_basicView').find('table.members_basicView_table');
//     scope.find('tbody tr.members_memberLine').not('.hidden').each(function () {
//        var row = $(this);
//        var match = row.data('name').indexOf(keyword) >= 0;
//        match =match || (row.data('gender').indexOf(keyword) >= 0);
//        if (match)
//        {
//           row.removeClass('hidden');
//        }
//        else
//        {  
//              row.addClass('hidden');
//              row.next().addClass('hidden');
//        }
//    });
//};
var giveRowNumberToVisibleRows = function (scope) {
    scope.find('.members_memberLine:visible').each(function (idx) {
        $(this).find('td:eq(0)').text(idx + 1);
    });
};

var updateMemberStatus = function () {
    var obj = $(this);
    var row = obj.parents('tr.members_memberLine');
    var statusId = obj.val();
    corsAjax({
        url: getDataServerRequestUrl('user', 'updateMemberStatus'),
        data: { 'userActId': row.data('memberId'), 'statusId': statusId },
        success: function (data) {
            if (data) {
                if (data.returnCode === 0) {
                    row.data('statusId', statusId);
                }
                else {
                    doAlert({ 'title': '更新队员状态失败', 'msg': data.msg, 'style': 'warning' });
                    obj.val(row.data('statusId'));
                }
            }
        }
    });
};

var selectOneMember = function (e) {
    var obj = $(this);
    if (!obj.hasClass('members_memberLine_active')) {
        obj.siblings('tr').removeClass('members_memberLine_active');
        obj.addClass('members_memberLine_active');
        obj.siblings('tr.members_memberDetail').addClass('hidden');   
    }
     if(obj.next().hasClass('hidden'))
    {
        obj.next().removeClass('hidden');
    }
    else{
        obj.next().addClass('hidden');    
    }
 
     var winTop = $(window).scrollTop();
     var winHeight =$(window).height();
     var winBottom = winTop+ winHeight;
        var top = $(this).offset().top;
        var height = $(this).height()+ $(this).next().height();
        var bottom= top + height;
        if(winHeight<height)
        {
            $(window).scrollTop(top);
        }
        else
        {
            if(top < winTop)
            {   
                $(window).scrollTop(top);
            }
            if(winBottom < bottom)
            {
                $(window).scrollTop(winTop+ bottom-winBottom);
            }
    }
};

var buildDetailView = function (onemem,sheet) {
    var items = onemem.items;
    var info = onemem.personalInfo;
    var form = $('<form />');
    var divOne=$('<div />').addClass('col-xs-6');
    var divTwo=$('<div />').addClass('col-xs-6');
    var divPhone = $('<div />');
    divPhone.append($('<label />').text('电话'));
    divPhone.append($('<input />').addClass('form-control disabledDefaultCursor').attr('disabled', '').val(info.phone));
    var divEmail = $('<div />');
    divEmail.append($('<label />').text('邮箱'));
    divEmail.append($('<input />').addClass('form-control disabledDefaultCursor').attr('disabled', '').val(info.email));
    var divEdu = $('<div />');
    divOne.append(divPhone);
    divTwo.append(divEmail);
    if (validateNonEmptyArray(sheet)) {
        var even =true;
        sheet.forEach(function (line) {
            if(even)
            { 
               divOne.append(buildDetailItemListLine(items, line));
               even=!even;
            }
            else
            {
                divTwo.append(buildDetailItemListLine(items, line));
                even=!even;
            }

        });
    }
    form.append(divOne).append(divTwo);
    return form;
};

var buildDetailItemListLine = function (items, line) {
    var ret = $('<div />');
    var label = $('<label />').text(line.label);
    var data = mappingData2SheetLine(items, line);
    data = data.length > 0 ? data[0] : false;
    if (line.type === 'image')
        var val = $('<img />').addClass('img-responsive').attr('src', data ? data.value : '/content/image/noimageUpload_default.jpg');
    else if (line.type === 'multi-select')
        var val = $('<input />').addClass('form-control disabledDefaultCursor').val(data ? data.value.join(', ') : '').attr('disabled', '');
    else if (line.type === 'textarea')
        var val = $('<textarea />').addClass('form-control disabledDefaultCursor').css('height', '80px').val(data ? data.value : '').attr('disabled', '');
    else if (line.type === 'weixin') {
        var weixin = $('<input />').addClass('form-control disabledDefaultCursor').val(data ? data.value : '').attr('disabled', '');
        var pic = $('<img />').addClass('img-responsive').attr('src', 'http://open.weixin.qq.com/qr/code/?username=' + (data && data.value ? data.value : '')).attr('alt', '无法根据微信号获得二维码');
        var val = $('<div />').append(weixin).append(pic);
    }
    else
        var val = $('<input />').addClass('form-control disabledDefaultCursor').val(data ? data.value : '').attr('disabled', '');
    return ret.append(label).append(val);
};

$(window).scroll(function () {
    var winTop = $(window).scrollTop();
    $('.members_operationView_achor').each(function () {
        var top = $(this).offset().top;
        if (winTop > top) {
            var offset = winTop - top + 10 + 'px';
            $(this).parent('.members_view').children('.members_operationView,.statisticView').animate({ top: offset }, { duration: 0, queue: false });
        }
        else {
            $(this).parent('.members_view').children('.members_operationView,.statisticView').animate({ top: '0px' }, { duration: 0, queue: false });
        }
    });
});
