$('#siteBanner').on('click', 'img', function () {
    var url = $(this).data('url');
    if (url)
        window.location = url;
});