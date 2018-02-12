var okulusApp = angular.module('okulusApp',['ngRoute','firebase']);

okulusApp.config(['$routeProvider',
	function($routeProvider){
		$routeProvider
			.when('/home', {
				templateUrl: 'views/about.html'
			})
			.when('/mygroups', {
				templateUrl: 'views/user/myGroups.html',
				controller: 'UserMyGroupsCntrl'
			})
			.when('/myreports', {
				templateUrl: 'views/user/myReports.html',
				controller: 'UserMyReportsCntrl'
			})
			.when('/admin/dashboard', {
				controller: 'AdminDashCntrl',
				templateUrl: 'views/admin/dashboard.html'
			})
			.when('/admin/monitor', {
				templateUrl: 'views/admin/monitor.html',
				controller: 'MonitorCntrl'
			})
			.when('/groups', {
				templateUrl: 'views/admin/groups.html',
				controller: 'GroupsAdminListCntrl'
			})
			.when('/groups/new', {
				templateUrl: 'views/groups/newgroup.html'
			})
			.when('/groups/edit/:groupId', {
				templateUrl: 'views/groups/newgroup.html',
				controller: 'GroupDetailsCntrl'
			})
			.when('/groups/access/:groupId', {
				templateUrl: 'views/groups/accessRules.html',
				controller: 'AccessRulesCntrl'
			})
			.when('/members', {
				templateUrl: 'views/members/membersList.html',
				controller: 'MembersListCntrl'
			})
			.when('/members/new', {
				templateUrl: 'views/members/newmember.html'
			})
			.when('/members/edit/:memberId', {
				templateUrl: 'views/members/newmember.html',
				controller: 'MemberDetailsCntrl'
			})
			.when('/reports/new/:groupId', {
				templateUrl: 'views/reports/newreport.html'
			})
			.when('/reports/edit/:reportId', {
				templateUrl: 'views/reports/newreport.html',
				controller: 'ReportDetailsCntrl'
			})
			.when('/weeks', {
				templateUrl: 'views/weeks/weeks.html',
				controller: "WeeksCntrl"
			})
			.when('/error/norecord', {
				templateUrl: 'views/responses/error-norecord.html'
			})
			.otherwise({
				redirectTo: '/home'
			});
	}
]);
