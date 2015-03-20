var __hideLRMobileNavBar = function () {
    $('._mobile_nav_sidebar_left').animate({ 'left': '-150px' }, { duration: 100, queue: false });
    $('._mobile_nav_sidebar_right').animate({ 'right': '-150px' }, { duration: 100, queue: false });
};

$(window).on('cutright', function () {
    $('._mobile_nav_sidebar_left').animate({ 'left': '0px' }, { duration: 300, queue: false });
}).on('cutleft', function () {
    $('._mobile_nav_sidebar_right').animate({ 'right': '0px' }, { duration: 300, queue: false });
}).on('click', __hideLRMobileNavBar);
$('body').on('click', __hideLRMobileNavBar);


if (!$.cookie('hikerJoy_mobile_cutLR_hint')) {
    var cutLRHint = $('<div />').css('position', 'fixed').css('bottom', '0px').css('right', '0px').css('left', '0px').css('background-color', 'white');
    cutLRHint.append($('<img />').attr('src', '/content/image/hand_cutLR.png'));
    cutLRHint.append($('<span />').css('color', '#888').css('position', 'absolute').css('top', '10px')
        .append($('<span />').text('请尝试左右滑动，以获得导航条 ^^...'))
        .append($('<br />'))
        .append($('<i />').addClass('fa fa-windows'))
        .append($('<span />').text(' wp可能暂时无法显示导航条 TAT'))
        );
    cutLRHint.append($('<span />').text('不再提示').css('color', '#888').css('position', 'absolute').css('bottom', '10px').css('right', '20px').bind('click', function (e) {
        e.stopPropagation();
        hideCutLRHint();
        $.cookie('hikerJoy_mobile_cutLR_hint', 1, { 'expires': 365, 'domain': location.hostname, 'path': '/' });
    }));
    cutLRHint.append($('<i />').addClass('fa fa-times').css('position', 'absolute').css('top', '5px').css('right', '15px').bind('click', function (e) {
        e.stopPropagation();
        hideCutLRHint();
    }));
    $('body').append(cutLRHint);
    var hideCutLRHint = function () { cutLRHint.animate({ 'bottom': '-' + cutLRHint.height() + 'px' }, { duration: 200, queue: false }); };
}