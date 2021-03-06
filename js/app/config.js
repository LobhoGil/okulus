/** Application entry point. In this is the configuration file we:
1. Create the Angular module
2. Prepare the URL routing in the config function
3. Create a constants $firebaseObject
4. Set the System Editable Configurations
**/
var okulusApp = angular.module('okulusApp',['ngRoute','firebase']);

okulusApp.config(['$routeProvider',
	function($routeProvider){
		$routeProvider
			.when('/login',{
				controller: 'LoginCntrl',
				templateUrl: 'views/auth/login.html'
			})
			.when('/register',{
				controller: 'RegistrationCntrl',
				templateUrl: 'views/auth/register.html'
			})
			.when('/pwdreset',{
				templateUrl: 'views/auth/pwdReset.html'
			})
			.when('/home', {
				resolve: {
					currentAuth: function(AuthenticationSvc){
						return AuthenticationSvc.isUserLoggedIn();
					}
				},
				controller: 'HomeCntrl',
				templateUrl: 'views/home.html'
			})
			.when('/mygroups', {
				resolve: {
					currentAuth: function(AuthenticationSvc){
						return AuthenticationSvc.isUserLoggedIn();
					}
				},
				templateUrl: 'views/groups/groups-user.html',
				controller: 'GroupsUserCntrl'
			})
			.when('/mycontacts', {
				resolve: {
					currentAuth: function(AuthenticationSvc){
						return AuthenticationSvc.isUserLoggedIn();
					}
				},
				templateUrl: 'views/user/myContacts.html',
				controller: 'UserMyContactsCntrl'
			})
			.when('/myreports', {
				resolve: {
					currentAuth: function(AuthenticationSvc){
						return AuthenticationSvc.isUserLoggedIn();
					}
				},
				templateUrl: 'views/user/myReports.html',
				controller: 'UserMyReportsCntrl'
			})
			.when('/admin/dashboard', {
				resolve: {
					currentAuth: function(AuthenticationSvc){
						return AuthenticationSvc.isUserLoggedIn();
					}
				},
				controller: 'AdminDashCntrl',
				templateUrl: 'views/admin/dashboard.html'
			})
			.when('/admin/monitor', {
				resolve: {
					currentAuth: function(AuthenticationSvc){
						return AuthenticationSvc.isUserLoggedIn();
					}
				},
				templateUrl: 'views/admin/monitor.html',
				controller: 'MonitorCntrl'
			})
			.when('/groups', {
				resolve: {
					currentAuth: function(AuthenticationSvc){
						return AuthenticationSvc.isUserLoggedIn();
					}
				},
				templateUrl: 'views/groups/groups-admin.html',
				controller: 'GroupsAdminCntrl'
			})
			.when('/groups/new', {
				resolve: {
					currentAuth: function(AuthenticationSvc){
						return AuthenticationSvc.isUserLoggedIn();
					}
				},
				templateUrl: 'views/groups/newgroup.html'
			})
			.when('/groups/edit/:groupId', {
				resolve: {
					currentAuth: function(AuthenticationSvc){
						return AuthenticationSvc.isUserLoggedIn();
					}
				},
				templateUrl: 'views/groups/newgroup.html',
				controller: 'GroupDetailsCntrl'
			})
			.when('/groups/details/:groupId', {
				resolve: {
					currentAuth: function(AuthenticationSvc){
						return AuthenticationSvc.isUserLoggedIn();
					}
				},
				templateUrl: 'views/groups/newgroup.html',
				controller: 'GroupDetailsCntrl'
			})
			.when('/groups/access/:groupId', {
				resolve: {
					currentAuth: function(AuthenticationSvc){
						return AuthenticationSvc.isUserLoggedIn();
					}
				},
				templateUrl: 'views/groups/accessRules.html',
				controller: 'GroupAccessRulesCntrl'
			})
			.when('/members', {
				resolve: {
					currentAuth: function(AuthenticationSvc){
						return AuthenticationSvc.isUserLoggedIn();
					}
				},
				templateUrl: 'views/members/members-admin.html',
				controller: 'MembersAdminCntrl'
			})
			.when('/members/new', {
				resolve: {
					currentAuth: function(AuthenticationSvc){
						return AuthenticationSvc.isUserLoggedIn();
					}
				},
				templateUrl: 'views/members/newmember.html'
			})
			.when('/members/edit/:memberId', {
				resolve: {
					currentAuth: function(AuthenticationSvc){
						return AuthenticationSvc.isUserLoggedIn();
					}
				},
				templateUrl: 'views/members/newmember.html',
				controller: 'MemberDetailsCntrl'
			})
			.when('/members/details/:memberId', {
				resolve: {
					currentAuth: function(AuthenticationSvc){
						return AuthenticationSvc.isUserLoggedIn();
					}
				},
				templateUrl: 'views/members/newmember.html',
				controller: 'MemberDetailsCntrl'
			})
			.when('/users/edit/:userId', {
				templateUrl: 'views/user/userDetails.html',
				controller: 'UserEditCntrl'
			})
			.when('/users/details/:userId', {
				templateUrl: 'views/user/userDetails.html',
				controller: 'UserEditCntrl'
			})
			.when('/reports/new/:groupId', {
				resolve: {
					currentAuth: function(AuthenticationSvc){
						return AuthenticationSvc.isUserLoggedIn();
					}
				},
				controller: 'NewReportCntrl',
				templateUrl: 'views/reports/newreport.html'
			})
			.when('/reports/edit/:reportId', {
				resolve: {
					currentAuth: function(AuthenticationSvc){
						return AuthenticationSvc.isUserLoggedIn();
					}
				},
				templateUrl: 'views/reports/newreport.html',
				controller: 'ReportDetailsCntrl'
			})
			.when('/reports/details/:reportId', {
				resolve: {
					currentAuth: function(AuthenticationSvc){
						return AuthenticationSvc.isUserLoggedIn();
					}
				},
				templateUrl: 'views/reports/newreport.html',
				controller: 'ReportDetailsCntrl'
			})
			.when('/weeks', {
				resolve: {
					currentAuth: function(AuthenticationSvc){
						return AuthenticationSvc.isUserLoggedIn();
					}
				},
				templateUrl: 'views/weeks/weeks-admin.html',
				controller: "WeeksCntrl"
			})
			.when('/weeks/new', {
				templateUrl: 'views/weeks/weekEdit.html',
				controller: 'WeekDetailsCntrl'
			})
			.when('/weeks/edit/:weekId', {
				templateUrl: 'views/weeks/weekEdit.html',
				controller: 'WeekDetailsCntrl'
			})
			.when('/weeks/details/:weekId', {
				templateUrl: 'views/weeks/weekDetails.html',
				controller: 'WeekDetailsCntrl'
			})
			.when('/chats', {
				resolve: {
					currentAuth: function(AuthenticationSvc){
						return AuthenticationSvc.isUserLoggedIn();
					}
				},
				templateUrl: 'views/chat/chatCenter.html',
				controller: "ChatCenterCntrl"
			})
			// .when('/chats', {
			// 	resolve: {
			// 		currentAuth: function(AuthenticationSvc){
			// 			return AuthenticationSvc.isUserLoggedIn();
			// 		}
			// 	},
			// 	templateUrl: 'views/chat/chats.html',
			// 	controller: "ChatCntrl"
			// })
			.when('/notifications', {
				resolve: {
					currentAuth: function(AuthenticationSvc){
						return AuthenticationSvc.isUserLoggedIn();
					}
				},
				templateUrl: 'views/notifications/notificationCenter.html',
				controller: "NotificationCenterCntrl"
			})
			.when('/error', {
				templateUrl: 'views/errors/error-general.html'
			})
			.when('/error/norecord', {
				templateUrl: 'views/errors/error-norecord.html'
			})
			.otherwise({
				redirectTo: '/home'
			});
	}
]);

//Db Root Folder
const rootFolder = "okulusTest";
const constants = {
	roles: {
		user:"user", admin: "admin"
	},
	status: {
		online:"online", offline:"offline",
		active:"active", inactive:"inactive",
		open:"open", closed:"closed",
		visible:"show", hidden:"hide"
	},
	pages: {
		login:"/login", home:"/home",
		error: "/error",
		adminWeeks:"/weeks",
		adminMonitor:"/admin/monitor"
	},
	folders:{
		root:"okulusTest",
		users:"users", chats:"chats", metadata:"metadata",
		chatList:"chatList"
	},
	actions:{
		create:"create"
	},
	config:{isProdEnv: false}
};

/* Configurations that, in future versions, can be modified by System Admin*/
okulusApp.run(function($rootScope) {
		$rootScope.config ={
			/*The Max lenght a firebaseArray should have in the initial request*/
			maxQueryListResults: 20,
			/*After this number of records, the Filter box will be visible*/
			minResultsToshowFilter: 3,
			/*Date range limits*/
			bday:{maxDate:"2019-12-31",minDate:"1900-01-01"},
			week:{maxDate:"2019-12-31",minDate:"2018-01-01"},
			reports:{
						maxDate:"2019-12-31",minDate:"2018-01-01",
						minDuration:"0", maxDuration:"300"
					}
		};
});
