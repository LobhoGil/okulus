//mappgin: /groups
okulusApp.controller('GroupsAdminListCntrl', ['GroupsSvc', '$rootScope','$scope','$firebaseAuth','$location','AuthenticationSvc',
	function(GroupsSvc, $rootScope,$scope,$firebaseAuth,$location,AuthenticationSvc){
		$firebaseAuth().$onAuthStateChanged( function(authUser){
    	if(authUser){
				AuthenticationSvc.loadSessionData(authUser.uid).$loaded().then(function (obj) {
					if($rootScope.currentSession.user.type == 'admin'){
						$scope.groupsList = GroupsSvc.loadAllGroupsList();
					}else{
						$location.path("/error/norecord");
					}
				});
			}
		});
	}
]);

okulusApp.controller('GroupFormCntrl', ['$rootScope', '$scope', '$location', '$firebaseAuth', 'GroupsSvc', 'MembersSvc', 'AuditSvc', 'UtilsSvc', 'AuthenticationSvc',
	function($rootScope, $scope, $location, $firebaseAuth, GroupsSvc, MembersSvc, AuditSvc, UtilsSvc,AuthenticationSvc){

		$firebaseAuth().$onAuthStateChanged( function(authUser){
    		if(authUser){
				AuthenticationSvc.loadSessionData(authUser.uid).$loaded().then(function (user) {
					if(!user.memberId){
						$location.path("/error/nomember");
						return;
					}
					$rootScope.response = null;
					$scope.provideAddress = true;
					$scope.membersList = MembersSvc.loadActiveMembers();
					$scope.membersList.$loaded().then(function(activeMembers){
						$scope.hostsList = MembersSvc.filterActiveHosts(activeMembers);
						$scope.leadsList = MembersSvc.filterActiveLeads(activeMembers);
					});
				});
			}
		});

		cleanScope = function(){
	    	$scope.groupId = null;
	    	$scope.group = null;
	    	$scope.address = null;
	    	$scope.schedule = null;
	    	$scope.response = null;
				$rootScope.response = null;
	    };

	    $scope.saveOrUpdateGroup = function() {
				//$scope.response = null;
				let record = { group: $scope.group, address: $scope.address, schedule: $scope.schedule };
				record.schedule.time = UtilsSvc.buildTimeJson($scope.schedule.timestamp);

				/* When a value for groupId is present in the scope, the user is on Edit
					mode and we have to perform an UPDATE.*/
		    	if( $scope.groupId ){
						let gRef = GroupsSvc.getGroupReference($scope.groupId);
						let orgiStatus = undefined;
						gRef.child("group/status").once('value').then(
							function(snapshot) {
								orgiStatus = snapshot.val();
							});

						gRef.update(record, function(error) {
							if(error){
								$scope.response = { groupMsgError: error};
							}else{
								$scope.response = { groupMsgOk: "Grupo Actualizado"};
								AuditSvc.recordAudit(gRef.key, "update", "groups");

								if(orgiStatus != record.group.status){
									GroupsSvc.updateGroupsStatusCounter(record.group.status);
								}
							}
						});
		    	}
				/* Otherwise, when groupId is not present in the scope,
					we perform a SET to create a new record */
				else{
	    		var newgroupRef = GroupsSvc.getNewGroupReference();
					newgroupRef.set(record, function(error) {
						if(error){
							$scope.response = { groupMsgError: error};
						}else{
							//For some reason the message is not displayed until
							//you interact with any form element
						}
					});

					//adding trick below to ensure message is displayed
					let obj = GroupsSvc.getGroupObj(newgroupRef.key);
					obj.$loaded().then(function(data) {
						$scope.groupId = newgroupRef.key;
						$rootScope.response = { groupMsgOk: "Grupo Creado"};
						AuditSvc.recordAudit(newgroupRef.key, "create", "groups");
						GroupsSvc.increaseGroupsStatusCounter(data.group.status);
						$location.path( "/groups");
					});
	    	}
	    };

			/* A group can be deleted by Admin if there are no reports associated to it.
			 When deleting a Group:
				1. Decrease the Group Status counter
				2. Delete all references to this group from member/access
			*/
	    $scope.deleteGroup = function() {
				if($rootScope.currentSession.user.type == 'user'){
					$scope.response = { groupMsgError: "Para eliminar este grupo, contacta al administrador"};
				}else{
		    	if( $scope.groupId ){
						GroupsSvc.getGroupObj($scope.groupId).$loaded().then( function (groupObj) {
							let status = groupObj.group.status;
							let accessList = groupObj.access;
							if( !groupObj.reports ){
								groupObj.$remove().then(function(ref) {
									$rootScope.response = { groupMsgOk: "Grupo Eliminado"};
									AuditSvc.recordAudit(ref.key, "delete", "groups");
									GroupsSvc.decreaseGroupsStatusCounter(status);
									MembersSvc.deleteMembersAccess(accessList);
									$location.path( "/groups");
								}, function(error) {
									$rootScope.response = { groupMsgError: err};
									// console.log("Error:", error);
								});
							}else{
								$scope.response = { groupMsgError: "No se puede elminar el Grupo porque tiene Reportes asociados"};
							}
						});
			    }
				}
	    };

}]);

okulusApp.controller('GroupDetailsCntrl', ['$scope','$routeParams', '$location', 'GroupsSvc','MembersSvc',
	function($scope, $routeParams, $location, GroupsSvc,MembersSvc){
		let whichGroup = $routeParams.groupId;
		$scope.provideAddress = true;
		$scope.membersList = MembersSvc.loadActiveMembers();

		/* When opening "Edit" page from the Groups List, we can use the
		"allGroups" firebaseArray from rootScope to get the specific Group data */
		if( GroupsSvc.allGroupsLoaded() ){
			let record = GroupsSvc.getGroupFromArray(whichGroup);
			putRecordOnScope(record);
		}
		/* But, when using a direct link to an "Edit" page, or when refresing (f5),
		we will not have the "allGroups" firebaseArray Loaded in the rootScope.
		Instead of loading all the Groups, what could be innecessary,
		we can use firebaseObject to get only the required group data */
		else{
			let obj = GroupsSvc.getGroupObj(whichGroup);
			obj.$loaded().then(function() {
				putRecordOnScope(obj);
			}).catch(function(error) {
		    $location.path( "/error/norecord" );
		  });
		}

		function putRecordOnScope(record){
			if(record && record.group){
				$scope.groupId = record.$id;
				$scope.group = record.group;
				$scope.address = record.address;
				$scope.schedule = record.schedule;
				if(record.schedule.time){
					console.log("Setting Time")
					$scope.schedule.timestamp = new Date();
					$scope.schedule.timestamp.setHours(record.schedule.time.HH);
					$scope.schedule.timestamp.setMinutes(record.schedule.time.MM);
					$scope.schedule.timestamp.setSeconds(0);
					$scope.schedule.timestamp.setMilliseconds(0);
				}
			}else{
				$location.path( "/error/norecord" );
			}
		}

	}
]);

okulusApp.factory('GroupsSvc', ['$rootScope', '$firebaseArray', '$firebaseObject',
	function($rootScope, $firebaseArray, $firebaseObject){

		let groupsRef = firebase.database().ref().child('pibxalapa/groups');
		let activeGroupsRef = groupsRef.orderByChild("group/status").equalTo("active");

		let counterRef = firebase.database().ref().child('pibxalapa/counters/groups');

		return {
			getGroupReference: function(groupId){
				return groupsRef.child(groupId);
			},
			getNewGroupReference: function(){
				return groupsRef.push();
			},

			//Use this when $rootScope.allGroups is NOT loaded
			getGroupObj: function(groupId){
				return $firebaseObject(groupsRef.child(groupId));
			},
			//Use this when $rootScope.allGroups is already loaded
			getGroupFromArray: function(groupId){
				return $rootScope.allGroups.$getRecord(groupId);
			},
			loadAllGroupsList: function(){
				if(!$rootScope.allGroups){
					console.debug("Creating firebaseArray for Groups");
					$rootScope.allGroups = $firebaseArray(groupsRef);
				}
				return $rootScope.allGroups;
			},
			allGroupsLoaded: function() {
				return $rootScope.allGroups != null;
			},

			loadActiveGroups: function(){
				if(!$rootScope.allActiveGroups){
					$rootScope.allActiveGroups = $firebaseArray(activeGroupsRef);
				}
				return $rootScope.allActiveGroups;
			},
			// getActiveGroupFromArray: function(groupId){
			// 	return $rootScope.allGroups.$getRecord(groupId);
			// },
			addReportReference: function(report){
				//Save the report Id in the Group/reports
				let ref = groupsRef.child(report.reunion.groupId).child("reports").child(report.$id);
				ref.set({
					reportId:report.$id,
					weekId:report.reunion.weekId,
					date:report.reunion.dateObj
				});
			},
			removeReportReference: function(reportId,groupId){
				let ref = groupsRef.child(groupId).child("reports").child(reportId);
				ref.set(null);
			},
			getAccessRulesForGroup: function (groupId) {
				let reference = groupsRef.child(groupId).child("access");
				return $firebaseArray(reference);
			},
			//Receives the access list from a Member = { accessRuleId: {groupId,groupName,date} , ...}
			//The accessRuleId is the same on groups/:gropuId/access and groups/:groupId/access
			//Use accessRuleId.groupId and accessRuleId to delete the reference from each member to the group
			deleteAccessToGroups: function(accessObj){
				if(accessObj){
					for (const accessRuleId in accessObj) {
						let groupId = accessObj[accessRuleId].groupId;
						console.log(accessRuleId);
						groupsRef.child(groupId).child("access").child(accessRuleId).set(null);
					}
				}
			},
			increaseGroupsStatusCounter(status){
				$firebaseObject(counterRef).$loaded().then(
					function( groupStatusCounter ){
						if(status == 'active'){
							groupStatusCounter.active = groupStatusCounter.active+1;
						}else{
							groupStatusCounter.inactive = groupStatusCounter.inactive+1;
						}
						groupStatusCounter.$save();
					});
			},
			decreaseGroupsStatusCounter(status){
				$firebaseObject(counterRef).$loaded().then(
					function( groupStatusCounter ){
						if(status == 'active'){
							groupStatusCounter.active = groupStatusCounter.active-1;
						}else{
							groupStatusCounter.inactive = groupStatusCounter.inactive-1;
						}
						groupStatusCounter.$save();
					});
			},
			updateGroupsStatusCounter(status){
				$firebaseObject(counterRef).$loaded().then(
					function( groupStatusCounter ){
						if(status == 'active'){
							groupStatusCounter.active = groupStatusCounter.active+1;
							groupStatusCounter.inactive = groupStatusCounter.inactive-1;
						}else{
							groupStatusCounter.inactive = groupStatusCounter.inactive+1;
							groupStatusCounter.active = groupStatusCounter.active-1;
						}
						groupStatusCounter.$save();
					});
			}
		};
	}
]);

okulusApp.controller('GroupAccessRulesCntrl',
	['GroupsSvc', 'MembersSvc', 'AuditSvc','NotificationsSvc','$rootScope', '$scope','$routeParams', '$location','$firebaseAuth','AuthenticationSvc',
	function(GroupsSvc, MembersSvc, AuditSvc, NotificationsSvc, $rootScope, $scope,$routeParams, $location, $firebaseAuth,AuthenticationSvc){

		$scope.response = null;
		let whichGroup = $routeParams.groupId;

		$firebaseAuth().$onAuthStateChanged( function(authUser){
    		if(authUser){
				AuthenticationSvc.loadSessionData(authUser.uid).$loaded().then(function (obj) {
					if($rootScope.currentSession.user.type == 'admin'){
						$scope.membersAccess = MembersSvc.getMembersThatCanBeUser();
						$scope.acessList = GroupsSvc.getAccessRulesForGroup(whichGroup);
						$scope.group = GroupsSvc.getGroupObj(whichGroup);
					}else{
						$location.path("/error/norecord");
					}
				});
			}
		});

		$scope.addRule = function(){
			let whichMember = $scope.access.memberId;
			let memberName = document.getElementById('memberSelect').options[document.getElementById('memberSelect').selectedIndex].text;
			let groupName = $scope.group.group.name;
			let record = { memberName: memberName, memberId: whichMember, date:firebase.database.ServerValue.TIMESTAMP };

			let ruleExists = false;
			$scope.acessList.forEach(function(rule) {
					if(rule.memberId == whichMember){
						ruleExists = true;
					}
			});

			if(!ruleExists){
				//Use the Group´s access list to add a new record
				$scope.acessList.$add(record).then(function(ref) {
					AuditSvc.recordAudit(whichGroup, "access-granted", "groups");
					//notify the member that got the access
					MembersSvc.getMember(whichMember).$loaded().then(function(member){
						console.log(member);
						NotificationsSvc.sendNotificationTo(member.user.userId,"access-granted", "groups", whichGroup,null,null);
					});
					$scope.response = { accessMsgOk: "Acceso Concedido a " + memberName };
					//update record. Now to point to the Group
					var id = ref.key; //use the same push key for the record on member/access folder
					record = { groupName: groupName, groupId: whichGroup, date:firebase.database.ServerValue.TIMESTAMP };
					MembersSvc.getMemberReference(whichMember).child("access").child(id).set(record, function(error) {
						if(error){
							$scope.response = { accessMsgError: error };
						}else{
							AuditSvc.recordAudit(whichMember, "access-granted", "members");
						}
					});
				});
			}else{
				$scope.response = { accessMsgError: memberName + " ya tiene acceso al grupo"};
			}

		};

		$scope.deleteRule = function(ruleId){
			var rec = $scope.acessList.$getRecord(ruleId);
			let whichMember = rec.memberId;
			$scope.acessList.$remove(rec).then(function(ref) {
				//rule removed from Groups access folder
				$scope.response = { accessMsgOk: "Acceso Revocado" };
				//now removed the same rule from Member access folder
			  AuditSvc.recordAudit(whichGroup, "access-deleted", "groups");
				//notify the member that got the access
				MembersSvc.getMember(whichMember).$loaded().then(function(member){
					NotificationsSvc.sendNotificationTo(member.user.userId,"access-deleted", "groups", whichGroup,null,null);
				});
				MembersSvc.getMemberReference(whichMember).child("access").child(ref.key).set(null, function(error) {
					if(error){
						$scope.response = { accessMsgError: error };
					}else{
						AuditSvc.recordAudit(whichMember, "access-deleted", "members");
					}
				});
			});
		};


	}
]);
