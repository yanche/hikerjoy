
var imageRegex = /^image\//;

var bindEvent2ImageBtnAndReviewer = function (btn, review, maxH, maxW) {
    btn.unbind('change').bind('change', function () {
        if (this.type === 'file' && this.files && this.files.length > 0) {
            if (this.files.length > 1 || !(imageRegex.test(this.files[0].type))) {
                if (doAlert)
                    doAlert({ 'title': '上传失败', 'msg': '仅接受一副图片哟...', 'style': 'warning' });
                else
                    alert('上传失败, 仅接受一副图片哟...');
            }
            else {
                if (maxH && maxW) {
                    retrieveAndResizeOneImage(this.files[0], maxH, maxW, function (imgData) {
                        review.attr('src', imgData);
                    });
                }
                else {
                    retrieveAndResizeOneImage(this.files[0], function (imgData) {
                        review.attr('src', imgData);
                    });
                }
            }
        }
    });

    review.unbind('dragenter dragover').bind('dragenter dragover', false).unbind('drop').bind('drop', function (e) {
        var dataTransfer = e.originalEvent.dataTransfer;
        e.stopPropagation();
        e.preventDefault();
        if (dataTransfer && dataTransfer.files && dataTransfer.files.length > 0) {
            if (dataTransfer.files.length > 1 || !(imageRegex.test(dataTransfer.files[0].type))) {
                if (doAlert)
                    doAlert({ 'title': '上传失败', 'msg': '仅接受一副图片哟...', 'style': 'warning' });
                else
                    alert('上传失败, 仅接受一副图片哟...');
            }
            else {
                if (maxH && maxW) {
                    retrieveAndResizeOneImage(dataTransfer.files[0], maxH, maxW, function (imgData) {
                        review.attr('src', imgData);
                    });
                }
                else {
                    retrieveAndResizeOneImage(dataTransfer.files[0], function (imgData) {
                        review.attr('src', imgData);
                    });
                }
            }
        }
    });
};

var retrieveAndResizeOneImage = function (file, maxH, maxW, onLoad) {
    if (!file || !(imageRegex.test(file.type)))
        return;

    if ((typeof maxH) === 'function') {
        onLoad = maxH;
        maxH = maxW = null;
    }

    var fReader = new FileReader();
    fReader.onload = function (e) {
        if (maxH && maxW) {
            img = document.createElement('img');
            img.src = e.target.result;
            img.onload = function () {
                var h = img.height, w = img.width;
                var expected_h = w * maxH / maxW;
                expected_h = expected_h >= maxH ? maxH : expected_h;
                var to_h = expected_h <= h ? expected_h : h;
                var to_w = to_h * maxW / maxH;
                var canvas = document.createElement('canvas');
                canvas.width = to_w;
                canvas.height = to_h;
                var cvs = canvas.getContext('2d');
                cvs.drawImage(img, 0, 0, to_w, to_h);
                onLoad(canvas.toDataURL('image/jpeg'));
            };
        }
        else {
            onLoad(e.target.result);
        }
    };
    fReader.readAsDataURL(file);
};
