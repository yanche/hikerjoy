
var tags = ['清凉峰', '金紫尖', '楠溪江', '三尖-太百童', '七尖-天目山', '大嵛山岛', '牯牛降']

tags.forEach(function (tag) {
    db.activityTags.update({'name': tag}, {'name': tag}, true); //upsert
});
