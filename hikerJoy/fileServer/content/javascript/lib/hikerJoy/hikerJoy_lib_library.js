
var hikerJoy_sharingData = function (orgs, activities) {
    var sharingSummaryOrgs = 0;
    var sharingBillOrgs = 0;
    var activitiesWithSummary = 0;
    var activitiesWithBill = 0;
    var orgData = {};
    if(Array.isArray(orgs) && orgs.length > 0) {
        orgs.forEach(function (v) {
            orgData[v._id] = v;
            orgData[v._id].activities = [];
            orgData[v._id].activitiesWithSummary = 0;
            orgData[v._id].activitiesWithBill = 0;
            if(v.shareSummary) sharingSummaryOrgs++;
            if(v.shareBillStatement) sharingBillOrgs++;
        });
    }
    if(Array.isArray(activities) && activities.length > 0) {
        activities.forEach(function (v) {
            var orgD = orgData[v.orgId];
            if(orgD) {
                orgD.activities.push(v);
                if(v.summaryUpdatedOn) { orgD.activitiesWithSummary++; activitiesWithSummary++;  }
                if(v.billstatementUpdatedOn) { orgD.activitiesWithBill++; activitiesWithBill++; }
            }
        });
    }
    this.sharingSummaryOrgs = sharingSummaryOrgs;
    this.sharingBillOrgs = sharingBillOrgs;
    this.activitiesWithSummary = activitiesWithSummary;
    this.activitiesWithBill = activitiesWithBill;
    this.orgData = orgData;
};
