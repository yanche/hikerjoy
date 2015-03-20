
var getPartial = require('./forum/get.js');
var submitPartial = require('./forum/submit.js');
var managePartial = require('./forum/manage.js');
var authPartial = require('./forum/auth.js');

exports.getForumPostList = getPartial.getForumPostList;
exports.getForumPostPrms = getPartial.getForumPostPrms;
exports.getForumPostSecs = getPartial.getForumPostSecs;
exports.getRelatedEmphasizedForumPostsByActivityTag = getPartial.getRelatedEmphasizedForumPostsByActivityTag;

exports.submitForumPostSec = submitPartial.submitForumPostSec;
exports.submitForumPostPrm = submitPartial.submitForumPostPrm;
exports.submitNewForumPost = submitPartial.submitNewForumPost;
exports.voteForumPostPrm = submitPartial.voteForumPostPrm;

exports.disactivateForumPost = managePartial.disactivateForumPost;
exports.disactivateForumPostPrm = managePartial.disactivateForumPostPrm;
exports.disactivateForumPostSec = managePartial.disactivateForumPostSec;
exports.activateForumPost = managePartial.activateForumPost;
exports.activateForumPostPrm = managePartial.activateForumPostPrm;
exports.activateForumPostSec = managePartial.activateForumPostSec;
exports.emphasizePost = managePartial.emphasizePost;
exports.fadeoutPost = managePartial.fadeoutPost;
exports.updatePostTags = managePartial.updatePostTags;
exports.updatePostLabel = managePartial.updatePostLabel;

exports.unauthorizeUserToPost = authPartial.unauthorizeUserToPost;
exports.authorizeUserToPost = authPartial.authorizeUserToPost;
exports.getUnauthorizedUsers = authPartial.getUnauthorizedUsers;
