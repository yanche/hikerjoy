function doAlert(option) {
	$('#md_alert').find('.modal-title, .modal-body strong').empty();
	$('#md_alert .modal-content').removeAttr('style');
	if (option) {
		if (option.title)
			$('#md_alert .modal-title').text(option.title);
		if (option.msg)
			$('#md_alert .modal-body strong').text(option.msg);
		var bg = '';
		if (option.bgColor)
			bg = option.bgColor;
		else if (option.style) {
			switch (option.style) {
				case 'warning':
					bg = 'lemonchiffon';
					break;
				case 'success':
					bg = '#dff0d8';
					break;
			}
		}
		if (bg.length > 0)
			$('#md_alert .modal-content').attr('style', 'background-color:' + bg + ';');
		if (option.done) {
			$('#md_alert').on('hidden.bs.modal', option.done).on('hidden.bs.modal', function (){
				$('#md_alert').off('hidden.bs.modal');
			});
		}
	}
	else {
		$('#md_alert .modal-title').text('非法输入');
		$('#md_alert .modal-body strong').text('请根据对话框提示纠正输入错误');
		$('#md_alert .modal-content').removeAttr('style').attr('style', 'background-color:lemonchiffon;');
	}
	$('#md_alert').modal('show');
}