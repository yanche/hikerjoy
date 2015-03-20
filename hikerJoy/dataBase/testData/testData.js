
var mongo = require('mongodb');
var constants = require('hikerJoy').constants;
var testQ = require('./testQ.js').testQ;

var openDb = function (db, callback) {
    db.open(callback);
};

var collections = {};

var putCollections = function (cols, callback) {
    collections.users = cols[0]; //users collection;
    collections.organizations = cols[1]; //users collection;
    process.nextTick(function () { callback(null, null); });
};

var getCol_users = function (db, callback) {
    db.collection('users', { safe: true }, callback);
};

var getCol_organizations = function (db, callback) {
    db.collection('organizations', { safe: true }, callback);
};

var get2Collections = [getCol_users, getCol_organizations]; //same sequence as fn: 'putCollections'

var now = new Date();

//god
var user1 = {
    'statusId': constants.userStatus.active,
    'special': 1,
    'email': 'god@hikerjoy.com',
    'hash_ecp': '900150983cd24fb0d6963f7d28e17f72',
    'nickName': 'god',
    'createdOn': now,
    'personalInfo': {
        'name': '上帝',
        'gender': '男',
        'phone': '12345678901',
        'email': 'god@hikerjoy.com'
    }
};
//ob
var user2 = {
    'statusId': constants.userStatus.active,
    'special': 2,
    'email': 'ob@hikerjoy.com',
    'hash_ecp': '900150983cd24fb0d6963f7d28e17f72',
    'nickName': 'observer',
    'createdOn': now,
    'personalInfo': {
        'name': '观察者',
        'gender': '女',
        'phone': '09876543210',
        'email': 'ob@hikerjoy.com'
    }
};
//admin
var user3 = {
    'statusId': constants.userStatus.active,
    'special': 0,
    'email': 'admin1@hikerjoy.com',
    'hash_ecp': '900150983cd24fb0d6963f7d28e17f72',
    'nickName': 'admin1',
    'createdOn': now,
    'personalInfo': {
        'name': '管理员1',
        'gender': '女',
        'phone': '09876543210',
        'email': 'admin1@hikerjoy.com'
    }
};
//admin for 2 org
var user4 = {
    'statusId': constants.userStatus.active,
    'special': 0,
    'email': 'admin2@hikerjoy.com',
    'hash_ecp': '900150983cd24fb0d6963f7d28e17f72',
    'nickName': 'admin2',
    'createdOn': now,
    'personalInfo': {
        'name': '管理员2',
        'gender': '男',
        'phone': '09876543210',
        'email': 'admin2@hikerjoy.com'
    }
};
var user5 = {
    'statusId': constants.userStatus.active,
    'special': 0,
    'email': 'user5@hikerjoy.com',
    'hash_ecp': '900150983cd24fb0d6963f7d28e17f72',
    'createdOn': now,
    'personalInfo': {
        'name': '普通1',
        'gender': '男',
        'phone': '09876543210',
        'email': 'user5@hikerjoy.com'
    }
};
var user6 = {
    'statusId': constants.userStatus.active,
    'special': 0,
    'email': 'user6@hikerjoy.com',
    'hash_ecp': '900150983cd24fb0d6963f7d28e17f72',
    'nickName': 'user6',
    'createdOn': now,
    'personalInfo': {
        'name': '普通2',
        'gender': '女',
        'phone': '09876543210',
        'email': 'user6@hikerjoy.com'
    }
};
var users = [user1, user2, user3, user4, user5, user6];

var insertUser = function (non, callback) {
    collections.users.insert(users.shift(), { safe: true }, function (err, data) {
        if (err)
            callback(err, null);
        else if (Array.isArray(data))
            callback(null, data[0]);
        else
            callback(null, data);
    });
};

var insert6Users = [insertUser, insertUser, insertUser, insertUser, insertUser, insertUser];

var org1 = {
    'statusId': constants.orgStatus.active,
    'alias': 'fdu',
    'fullName': '复旦大学登山探险协会',
    'shortName': '复旦登协',
    'typeCode': 'EDU',
    'bannerUrl': '/content/image/banner_default.jpg',
    'logoUrl': '/content/image/orgLogo_default.jpg',
    'createdOn': now,
    'comments': '复旦登协-测试'
};
var now2 = new Date();
now2.setMinutes(now2.getMinutes() + 1);
var org2 = {
    'statusId': constants.orgStatus.active,
    'alias': 'tdh',
    'fullName': '复旦大学天地会-户外',
    'shortName': '天地会户外',
    'typeCode': 'SOC',
    'bannerUrl': '/content/image/banner_default.jpg',
    'logoUrl': '/content/image/orgLogo_default.jpg',
    'createdOn': now2,
    'comments': '天地会户外-测试'
};

var insertOrg1 = function (dbUsers, callback) {
    org1.admins = [dbUsers[2]._id, dbUsers[3]._id]; //user3, user4
    collections.organizations.insert(org1, { safe: true }, callback);
};

var insertOrg2 = function (dbUsers, callback) {
    org2.admins = [dbUsers[3]._id]; //user3, user4
    collections.organizations.insert(org2, { safe: true }, callback);
};

var queue = new testQ();
queue.then(openDb, null).all(get2Collections, null).then(putCollections, null).all(insert6Users, null).all([insertOrg1, insertOrg2], null).then(function () { console.log('done'); });

var server = new mongo.Server('localhost', 27017, { auto_reconnect: true });
var db = new mongo.Db('dev', server, { safe: true });

queue.run(db);
