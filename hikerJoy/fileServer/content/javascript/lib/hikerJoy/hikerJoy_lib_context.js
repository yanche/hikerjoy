
var isCurrentUserLogin = function () {
    return hikerJoy_context.getUserRole()
    .then(function (userRole) {
        return Boolean(userRole && userRole.auth);
    });
};

var isCurrentUserGod = function () {
    return hikerJoy_context.getUserRole()
    .then(function (userRole) {
        return Boolean(userRole && Array.isArray(userRole.role) && userRole.role.contains('god'));
    });
};

var isCurrentUserGodOrOb = function () {
    return hikerJoy_context.getUserRole()
    .then(function (userRole) {
        return Boolean(userRole && Array.isArray(userRole.role) && userRole.role.containsOne(['god', 'ob']));
    });
};

var isCurrentUserGodOrObOrAdmin = function () {
    return hikerJoy_context.getUserRole()
    .then(function (userRole) {
        return Boolean(userRole && Array.isArray(userRole.role) && userRole.role.containsOne(['god', 'ob', 'admin']));
    });
};

var isCurrentUserGodOrObOrAdminOfAnyOrg = function () {
    return hikerJoy_context.getUserRole()
    .then(function (userRole) {
        return Boolean(userRole && Array.isArray(userRole.role) && userRole.role.containsOne(['god', 'ob', 'admin', 'oneAdmin']));
    });
};

var isCurrentUserGodOrObOrAdminOrOrganizer = function () {
    return hikerJoy_context.getUserRole()
    .then(function (userRole) {
        return Boolean(userRole && Array.isArray(userRole.role) && userRole.role.containsOne(['god', 'ob', 'admin', 'organizer']));
    });
};

var getCurrentUserId = function () {
    return hikerJoy_context.getUserRole()
    .then(function (userRole) {
        return (userRole && userRole.userId) ? userRole.userId : null;
    });
};

//singleton
var hikerJoy_context = new (function () {
    var userRole = null, orgContext = null;
    var querySet = getQueryString();
    corsAjax({
        url: getDataServerRequestUrl('security', 'getRole'),
        data: { 'orgAlias': getCurrentPageOrg(), 'actId': querySet.activity },
        success: function (data) {
            if (data) {
                userRole = data;
                pendingUserRoleDefers.forEach(function (defer) { defer.resolve(userRole); });
            }
            else
                throw new Error('no return for security/getRole, hikerJoy_lib_context.js');
        }
    });

    var fromWebStorage = hikerJoy_storage.getStoredOrgContext();
    corsAjax({
        url: getDataServerRequestUrl('org', 'getOrgContext'),
        data: { 'contextUpdatedOn': fromWebStorage ? fromWebStorage.contextUpdatedOn : null },
        success: function (data) {
            if (data && validateNonEmptyArray(data.context)) {
                if (data.contextUpdatedOn) {
                    console.log('org context(WS) updated from server.');
                    hikerJoy_storage.storeOrgContext(data.context, data.contextUpdatedOn);
                }
                that.orgContextRefreshed = true; //means the context from server, not WS
            }
            else {
                data = fromWebStorage;
                that.orgContextRefreshed = false;
            }
            orgContext = data.context;
            pendingOrgContextDefers.forEach(function (defer) { defer.resolve(orgContext); });
        }
    });
    var pendingUserRoleDefers = [], pendingOrgContextDefers = [];

    this.getUserRole = function () {
        var defer = new Q.defer();
        if (userRole)
            defer.resolve(userRole);
        else
            pendingUserRoleDefers.push(defer);
        return defer.promise;
    };

    this.getOrgContext = function () {
        var defer = new Q.defer();
        if (orgContext)
            defer.resolve(orgContext);
        else
            pendingOrgContextDefers.push(defer);
        return defer.promise;
    };

    this.getOrgContext_Active = function () {
        return that.getOrgContext()
               .then(function (orgs) {
                   return searchActiveOrg(orgs);
               });
    };

    //from cache: web storage
    this.fastLoadOrgContext = function () {
        var fromWS = hikerJoy_storage.getStoredOrgContext();
        return fromWS && validateNonEmptyArray(fromWS.context) ? fromWS.context : null;
    };

    //from cache: web storage
    this.fastLoadOrgContext_Active = function () {
        var allfromWS = that.fastLoadOrgContext()
        if (validateNonEmptyArray(allfromWS))
            return searchActiveOrg(allfromWS);
        else
            return null;
    };

    this.orgContextRefreshed = null;
    var that = this;
})();

var searchOrgByAlias = function (context, alias) {
    if (validateNonEmptyArray(context)) {
        var match = context.filter(function (v) { return v.alias === alias; });
        return match.length > 0 ? match[0] : null;
    }
    else
        return null;
};

var searchOrgById = function (context, id) {
    if (validateNonEmptyArray(context)) {
        var match = context.filter(function (v) { return v._id === id; });
        return match.length > 0 ? match[0] : null;
    }
    else
        return null;
};

var searchActiveOrg = function (context) {
    if (validateNonEmptyArray(context)) {
        return context.filter(function (v) { return v.statusId === 10; });
    }
    else
        return [];
};

var searchInactiveOrg = function (context) {
    if (validateNonEmptyArray(context)) {
        return context.filter(function (v) { return v.statusId === 20; });
    }
    else
        return [];
};
