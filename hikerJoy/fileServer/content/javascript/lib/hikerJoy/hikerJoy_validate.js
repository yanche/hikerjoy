
$(document).on('focusout', '[validate]', function () {
    var obj = $(this);
    var validator = validatorMapping[obj.attr('validate')];
    obj.trigger('validating');
    if (validator(obj)) {
        rmvError(obj.parent('div'));
        obj.trigger('validatedTrue');
    }
    else {
        setError(obj.parent('div'));
        obj.trigger('validatedFalse');
    }
});

var rmvError = function(target) {
    target.removeClass('has-error');
};

var setError = function(target) {
    target.addClass('has-error');
};

var validateAll = function(scope) {
    return $(scope).find('[validate]').toArray().every(function (v, k) {
        var obj = $(v);
        var validator = validatorMapping[obj.attr('validate')];
        if (validator(obj)) {
            rmvError(obj.parent('div'));
            obj.trigger('validatedTrue');
            return true;
        }
        else {
            setError(obj.parent('div'));
            obj.trigger('validatedFalse');
            return false;
        }
    });
};

var clearAll = function(scope) {
    $(scope).find('.clearData').val('');
    $(scope).find('[validate]').parent('div').removeClass('has-error');
};

var sameValue = function(obj) {
    var val1 = obj.val();
    var val2 = $(obj.data('validatetarget')).val();
    return val1 == val2;
};

var validateValuedString = function (str) {
    if(str != null && str.val) str = str.val();
    return (typeof str) === 'string' && str.trim().length > 0;
};

var validateNonEmptyText = function(str) {
    return (str != null && str.val) ? ( str.val().length != 0) : ((typeof str) === 'string' && str.length > 0);
};

/*
var validateUniv = function(str) {
    if(str != null && str.val) str = str.val();
    var ret = univ_available_list.filter(function (univ, k) {
        return str == univ;
    });
    return str.length != 0 && (ret.length > 0 || str == '其他');
};
*/

var phoneRegex = new RegExp('^[0-9]{11}$');
var validatePhoneNumber = function(str) {
    return phoneRegex.test(str != null && str.val ? str.val() : str);
};

var phoneRegex = new RegExp('^[0-9]{11}$');
var validatePhoneNumberNullable = function(str) {
    if(str != null && str.val) str = str.val();
    return validateNullOrEmptyString(str) || phoneRegex.test(str);
};

var emailRegex = new RegExp('^(\\w)+(\\.\\w+)*@(\\w)+((\\.\\w+)+)$');
var validateEmailAddress = function(str) {
    return emailRegex.test(str != null && str.val ? str.val() : str);
};

var validateEmailAddressNullable = function(str) {
    if(str != null && str.val) str = str.val();
    return validateNullOrEmptyString(str) || emailRegex.test(str);
};

var dateRegex = new RegExp('^[0-9]{1,4}/(((0?[1-9]|1[0-2])/(0?[1-9]|[12][0-9]))|((0?[13-9]|1[0-2])/30)|((0?[13578]|1[02])/31))$');
var validateDate = function(str) {
    return dateRegex.test(str != null && str.val ? str.val() : str);
};

var numberRegex = new RegExp('^([0]|[1-9][0-9]*)$');
var validateNumber = function(str) {
    return numberRegex.test(str != null && str.val ? str.val() : str);
};

var floatRegex = new RegExp('^(([0]|[1-9][0-9]*)(.[0-9]+)?)$');
var validateFloat = function(str) {
    return floatRegex.test(str != null && str.val ? str.val() : str);
};

var isStrongPassword = function(str) {
    if(str != null && str.val) str = str.val();
    return str.length >= 6;
};

var isNickName = function(str) {
    if(str != null && str.val) str = str.val();
    return str.length >= 1 && str[0] != ' ' && str[str.length - 1] != ' ';
};

var isNickNameNullable = function(str) {
    return validateNullOrEmptyString(str) || isNickName(str);
};

//1-8 characters, no space
var validateName = function(name) {
    if(name != null && name.val) name = name.val();
    return name.length >= 1 && name.length <= 8 && name.indexOf(' ') == -1;
}

var validateNameNullable = function(name) {
    return validateNullOrEmptyString(name) || validateName(name);
}

/*
//from 1900 to 2100
var validateGradeYear = function(year) {
    if(year != null && year.val) year = year.val();
    year = Number(year);
    return !isNaN(year) && year >= 1900 && year <= 2100;
};
*/

var validateNonEmptyArray = function (arr) {
    return Array.isArray(arr) && arr.length > 0;
};

var validateNullOrEmptyString = function (str) {
    if(str != null && str.val) str = str.val();
    return str == null || str === ''; //null, undefined, ''
};

var validatorMapping = {
    'nonEmptyText': validateNonEmptyText,
    'email': validateEmailAddress,
    'emailNullable': validateEmailAddressNullable,
    'password': isStrongPassword,
    'nickName': isNickName,
    'nickNameNullable': isNickNameNullable,
    'sameValue': sameValue,
    'valuedString': validateValuedString,
    'phone': validatePhoneNumber,
    'phoneNullable': validatePhoneNumberNullable,
    'date': validateDate,
    'pos_number': validateNumber,
    'pos_float': validateFloat,
    'name': validateName,
    'nameNullable': validateNameNullable
};
