//Mapping: /members
okulusApp.controller('MembersAdminCntrl',
	['$rootScope','$scope','$firebaseAuth','$location','AuthenticationSvc', 'MembersSvc', 'UtilsSvc',
	function($rootScope,$scope,$firebaseAuth,$location,AuthenticationSvc,MembersSvc,UtilsSvc){

		/*Executed everytime we enter to /members
		  This function is used to confirm the user is Admin */
		$firebaseAuth().$onAuthStateChanged(function(authUser){
		if(authUser){
			$scope.response = {loading: true, message: $rootScope.i18n.alerts.loading };
			AuthenticationSvc.loadSessionData(authUser.uid).$loaded().then(
				function(user){
					if(user.type == 'admin'){
						UtilsSvc.loadSystemCounter();
						$rootScope.systemCounters.$loaded().then(function(counters) {
							$scope.response = undefined;
						});
				}else{
					$rootScope.response = {error:true, showHomeButton: true,
																	message:$rootScope.i18n.error.noAdmin};
					$location.path("/error");
				}
			});
		}
	});

	$scope.loadMembersList = function functionName() {
		$scope.memberTypeFilter = "all";
		$scope.response = {loading: true, message: $rootScope.i18n.admin.members.loading };
		$rootScope.membersList = MembersSvc.loadAllMembersList();
		$rootScope.membersList.$loaded().then(function(members) {
			$scope.response = {success:true, message:members.length+" "+$rootScope.i18n.admin.members.loadingSuccess };
		})
		.catch( function(error){
			$scope.response = { error: true, message: $rootScope.i18n.admin.members.loadingError };
			console.error(error);
		});
	};

	$scope.filterMembersByType = function () {
		if($scope.memberTypeFilter=="all"){
			$scope.membersList = MembersSvc.loadAllMembersList();
		}else if($scope.memberTypeFilter=="host"){
			$scope.membersList = MembersSvc.filterActiveHosts($rootScope.allMembers);
		}else if($scope.memberTypeFilter=="lead"){
			$scope.membersList = MembersSvc.filterActiveLeads($rootScope.allMembers);
		}else if($scope.memberTypeFilter=="trainee"){
			$scope.membersList = MembersSvc.filterActiveTrainees($rootScope.allMembers);
		}
	};

	}
]);

okulusApp.controller('MemberFormCntrl', ['$rootScope', '$scope', '$location','$firebaseAuth','MembersSvc', 'AuditSvc', 'UtilsSvc', 'GroupsSvc','AuthenticationSvc',
	function($rootScope, $scope, $location,$firebaseAuth, MembersSvc, AuditSvc, UtilsSvc, GroupsSvc,AuthenticationSvc){
		$firebaseAuth().$onAuthStateChanged( function(authUser){
    		if(authUser){
				AuthenticationSvc.loadSessionData(authUser.uid).$loaded().then(function (user) {
					if(!user.memberId){
						$rootScope.response = { error:true, message: systemMsgs.error.noMemberAssociated};
						$location.path(constants.pages.error);
						return;
					}

					$rootScope.response = null;
					$scope.provideAddress = true;
					$scope.groupsList = GroupsSvc.loadActiveGroups();
				});
			}
		});

		$scope.saveOrUpdateMember = function() {
			$scope.response = null;
			$scope.working = true;

			let record = undefined;
			if($scope.provideAddress){
				record = { member: $scope.member, address: $scope.address };
			}else{
				record = { member: $scope.member };
			}
			record.member.birthdate = UtilsSvc.buildDateJson($scope.member.bday);

			/* When a value for memberId is present in the scope, the user is on Edit
				mode and we have to perform an UPDATE.*/
			if( $scope.memberId ){
	    	let mRef = MembersSvc.getMemberReference($scope.memberId);
				let orgiStatus = undefined;
				mRef.child("member/status").once('value').then(
					function(snapshot) {
						orgiStatus = snapshot.val();
				});

			  mRef.update(record, function(error) {
					if(error){
						$scope.working = false;
						$scope.response = { memberMsgError: error};
					}else{
					  AuditSvc.recordAudit(mRef.key, "update", "members");
					  if(orgiStatus != record.member.status){
							MembersSvc.updateStatusCounter(record.member.status);
						}
						$scope.response = { memberMsgOk: "Miembro Actualizado"};
						$scope.working = false;
					}
				});
			}
			/* Otherwise, when groupId is not present in the scope,
				we perform a SET to create a new record */
			else{
				var newmemberRef = MembersSvc.getNewMemberReference();
				newmemberRef.set(record, function(error) {
					if(error){
						$scope.working = false;
						$scope.response = { memberMsgError: error};
					}else{
						//For some reason the message is not displayed until
						//you interact with any form element
					}
				});

				//adding trick below to ensure message is displayed
				let obj = MembersSvc.getMember(newmemberRef.key);
				obj.$loaded().then(function(data) {
					//$scope.memberId = newmemberRef.key;
					AuditSvc.recordAudit(newmemberRef.key, "create", "members");
					MembersSvc.increaseStatusCounter(data.member.status);
					$scope.working = false;
					$rootScope.response = { memberMsgOk: "Miembro Creado"};
					$location.path( "/members");
				});
			}
		};

		/* A member can be deleted by Admin.
			If a memeber is deleted, his attendance to reunions still recorded on every Reunion Report
			When deleting a Member:
			1. Decrease the Member Status counter
			2. Delete all references to this member from group/access
		*/
	  $scope.deleteMember = function() {
			if($rootScope.currentSession.user.type == 'user'){
				$scope.response = { memberMsgError: "Para eliminar este miembro, contacta al administrador"};
			}else{
				$scope.working = true;
				if( $scope.memberId ){
					MembersSvc.getMember($scope.memberId).$loaded().then( function(memberObj){
						let status = memberObj.member.status;
						let accessList = memberObj.access;
						memberObj.$remove().then(function(ref) {
							$rootScope.response = { memberMsgOk: "Miembro Eliminado"};
					    AuditSvc.recordAudit(ref.key, "delete", "members");
							MembersSvc.decreaseStatusCounter(status);
							GroupsSvc.deleteAccessToGroups(accessList);
							$scope.working = false;
							$location.path( "/members");
						}, function(error) {
							$scope.working = false;
							$rootScope.response = { memberMsgError: err};
						});
					});
				}
			}
		};

		$scope.isHost = function(value){
			validateMemberObj();
			$scope.member.isHost = value;
			//console.debug($scope.member);
		};
		$scope.isLeader = function(value){
			validateMemberObj();
			$scope.member.isLeader = value;
			//console.debug($scope.member);
		};
		$scope.isTrainee = function(value){
			validateMemberObj();
			$scope.member.isTrainee = value;
			//console.debug($scope.member);
		};
		$scope.canBeUser = function(value){
			validateMemberObj();
			$scope.member.canBeUser = value;
			//console.debug($scope.member);
		};

		validateMemberObj = function () {
			if(!$scope.member){
				$scope.member = {}
			}
		}
  }
]);

okulusApp.controller('MemberDetailsCntrl', ['$scope','$routeParams', '$location', 'MembersSvc',
	function($scope, $routeParams, $location, MembersSvc){
		let whichMember = $routeParams.memberId;
		$scope.provideAddress = true;

		/* When opening "Edit" page from the Members List, we can use the
		"allMemberss" firebaseArray from rootScope to get the specific Member data */
		if( MembersSvc.allMembersLoaded() ){
			let record = MembersSvc.getMemberFromArray(whichMember);
			putRecordOnScope(record);
		}
		/* But, when using a direct link to an "Edit" page, or when refresing (f5),
		we will not have the "allMemberss" firebaseArray Loaded in the rootScope.
		Instead of loading all the Members, what could be innecessary,
		we can use firebaseObject to get only the required member data */
		else{
			let obj = MembersSvc.getMember(whichMember);
			obj.$loaded().then(function() {
				putRecordOnScope(obj);
			}).catch(function(error) {
		    $location.path( "/error/norecord" );
		  });
		}

		function putRecordOnScope(record){
			if(record && record.member){
				$scope.memberId = record.$id;
				$scope.member = record.member;
				$scope.address = record.address;
				$scope.audit = record.audit;

				if(record.member.birthdate){
					$scope.member.bday = new Date(record.member.birthdate.year,
												  record.member.birthdate.month-1,
												  record.member.birthdate.day);
				}
			}else{
				$location.path( "/error/norecord" );
			}
		}

	}
]);

okulusApp.factory('MembersSvc', ['$rootScope', '$firebaseArray', '$firebaseObject', 'GroupsSvc',
	function($rootScope, $firebaseArray, $firebaseObject, GroupsSvc){

		let membersRef = firebase.database().ref().child(rootFolder).child('members');
		let activeMembersRef = membersRef.orderByChild("member/status").equalTo("active");
		let counterRef = firebase.database().ref().child(rootFolder).child('counters/members');

		return {
			allMembersLoaded: function() {
				return $rootScope.allMembers != null;
			},
			getMemberFromArray: function(memberId){
				return $rootScope.allMembers.$getRecord(memberId);
			},
			/* Get member Personal data from firebase and return as object */
			getMemberDataObject: function(memberId){
				return $firebaseObject(membersRef.child(memberId).child("member"));
			},
			/* Get member from firebase and return as object */
			getMemberObject: function(memberId){
				return $firebaseObject(membersRef.child(memberId));
			},
			//Deprecated
			getMember: function(memberId){
				return $firebaseObject(membersRef.child(memberId));
			},
			getMemberInfo: function(memberId){
				return $firebaseObject(membersRef.child(memberId).child("member"));
			},
			getMemberAccessRules: function(whichMember) {
				return $firebaseArray(membersRef.child(whichMember).child("access"));
			},
			loadAllMembersList: function(){
				if(!$rootScope.allMembers){
					// console.debug("Creating firebaseArray for allMembers");
					$rootScope.allMembers = $firebaseArray(membersRef);
				}
				return $rootScope.allMembers;
			},
			loadActiveMembers: function(){
				if(!$rootScope.allActiveMembers){
					$rootScope.allActiveMembers = $firebaseArray(activeMembersRef);
				}
				return $rootScope.allActiveMembers;
			},
			getMembersThatCanBeUser: function(){
				return  $firebaseArray(membersRef.orderByChild("member/canBeUser").equalTo(true));
			},
			getMembersWithUser: function(){
				return  $firebaseArray(membersRef.orderByChild("user/isUser").equalTo(true));
			},
			filterActiveHosts: function(activeMembers){
				let activeHosts = [];
				activeMembers.forEach(function(host) {
						if(host.member.isHost){
							activeHosts.push( host );
						}
				});
				return activeHosts;
			},
			filterActiveLeads: function(activeMembers){
				let activeLeads = [];
				activeMembers.forEach(function(lead) {
						if(lead.member.isLeader){
							activeLeads.push( lead );
						}
				});
				return activeLeads;
			},
			filterActiveTrainees: function(activeMembers){
				let activeTrainees = [];
				activeMembers.forEach(function(lead) {
						if(lead.member.isTrainee){
							activeTrainees.push( lead );
						}
				});
				return activeTrainees;
			},
			getMemberReference: function(memberId){
				return membersRef.child(memberId);
			},
			getNewMemberReference: function(){
				return membersRef.push();
			},
			getMembersForBaseGroup: function(gropId){
				let ref = membersRef.orderByChild("member/baseGroup").equalTo(gropId);
				return $firebaseArray(ref);
			},
			//Receives the access list from a Group = { accessRuleId: {memberId,mamberName,date} , ...}
			//The accessRuleId is the same on groups/:gropuId/access and members/:memberId/access
			//Use accessRuleId.memberId and accessRuleId tu delete the reference from each member to the group
			deleteMembersAccess: function(accessObj){
				if(accessObj){
					for (const accessRuleId in accessObj) {
						let memberId = accessObj[accessRuleId].memberId;
						membersRef.child(memberId).child("access").child(accessRuleId).set(null);
					}
				}
			},
			removeMemberReferenceToReport: function(memberId,reportId){
				membersRef.child(memberId).child("attendance").child(reportId).set(null);
			},
			removeReferenceToReport: function(reportId,membersAttendanceList){
				if(membersAttendanceList){
					for (const attKey in membersAttendanceList) {
						// console.debug(attKey);
						let memberId = membersAttendanceList[attKey].memberId;
						membersRef.child(memberId).child("attendance").child(reportId).set(null);
					}
				}
			},
			/* Returns a list of Group records (from $firebaseArray) that are
			 * present in the Member's acess rules folder.
			getMemberGroups: function(whichMember) {
				return new Promise((resolve, reject) => {
					GroupsSvc.loadAllGroupsList().$loaded().then( function(allGroups){
						return $firebaseArray(membersRef.child(whichMember).child("access")).$loaded();
					}).then( function(memberRules) {
						let myGroups = [];
						memberRules.forEach(function(rule) {
							let group = $rootScope.allGroups.$getRecord(rule.groupId);
							if( group != null){
								myGroups.push( group );
							}
						});
						//$rootScope.groupsList = myGroups;
						resolve(myGroups);
					});

				});
			},*/
			filterMemberGroupsFromRules: function(memberRules, allGroups) {
				let myGroups = [];
				memberRules.forEach(function(rule) {
					let group = allGroups.$getRecord(rule.groupId);
					if( group != null){
						myGroups.push( group );
					}
				});
				return myGroups;
			},
			/*Use the passed Groups List to get all members with those groups as BaseGroup*/
			getMembersInGroups: function(groups) {
				return new Promise((resolve, reject) => {
					let contacts = [];
					groups.forEach(function(group) {
						//get from members folder order by member.baseGroup equals to group.$id
						let ref = membersRef.orderByChild("member/baseGroup").equalTo(group.$id);
						$firebaseArray(ref).$loaded().then(function(members){
							members.forEach(function(member) {
								contacts.push( member );
							});
						});
					});
					resolve(contacts);
				});
			},
			/* Return a list with all members having the email passed */
			getMembersByEmail: function(email){
				let ref = membersRef.orderByChild("member/email").equalTo(email);
				return $firebaseArray(ref);
			},
			/* Called from AuthenticationSvc to update the User reference in the Member Object*/
			updateUserReferenceInMemberObject: function(userId, memberDataObj){
				memberDataObj.userId = userId;
				memberDataObj.isUser = false;
				if(userId){
					memberDataObj.isUser = true;
				}
				memberDataObj.$save();
			},
			/* Same method than above, but using different aproach.*/
			updateUserReferenceInMember: function(userId, memberId){
				let isUser = false;
				if(userId){
					isUser = true;
				}
				membersRef.child(memberId).child("member").update({isUser:isUser, userId:userId});
			},
			increaseStatusCounter(status){
				$firebaseObject(counterRef).$loaded().then(
					function( statusCounter ){
						if(status == 'active'){
							statusCounter.active = statusCounter.active+1;
						}else{
							statusCounter.inactive = statusCounter.inactive+1;
						}
						statusCounter.$save();
					});
			},
			decreaseStatusCounter(status){
				$firebaseObject(counterRef).$loaded().then(
					function( statusCounter ){
						if(status == 'active'){
							statusCounter.active = statusCounter.active-1;
						}else{
							statusCounter.inactive = statusCounter.inactive-1;
						}
						statusCounter.$save();
					});
			},
			updateStatusCounter(status){
				$firebaseObject(counterRef).$loaded().then(
					function( statusCounter ){
						if(status == 'active'){
							statusCounter.active = statusCounter.active+1;
							statusCounter.inactive = statusCounter.inactive-1;
						}else{
							statusCounter.inactive = statusCounter.inactive+1;
							statusCounter.active = statusCounter.active-1;
						}
						statusCounter.$save();
					});
			},
			addReportReference: function(memberId,reportId, report){
				// console.debug(memberId,reportId, report);
				//Save the report Id in the Group/reports
				let ref = membersRef.child(memberId).child("attendance").child(reportId);
				ref.set({
					reportId: reportId,
					weekId:report.reunion.weekId,
					date:report.reunion.dateObj,
					groupId:report.reunion.groupId,
					groupName:report.reunion.groupname
				});
			}
		};
	}
]);
