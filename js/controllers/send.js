"use strict";
function SendController($scope,modals,$rootScope,Wallet,WalletManager){
	
	/****SendController init************/
	$scope.pageClass = 'page-send';
	$scope.item = {};
	$scope.inputAddress='';
	$scope.inputAmount='';
	$scope.changeAsset= function(option){

	};
	/****SendController init end************/
    //check balance
    $rootScope.$watch( 'balance', function() {
		$scope.balanceInt = $rootScope.balanceInt
		$scope.balance = $rootScope.balance
    });



    $scope.send = function(item) {
    	var success = function() {
			var satoshies=100000000;
			var formData ={
				addr:$scope.inputAddress,
				amount:$scope.inputAmount*satoshies,
			}
			console.log(formData);
			WalletManager.getCurrentWallet().buildTransaction(formData,function(data){
				console.log(data);
			});
		};
		modals.open("modalpassword", {
			"message":"Please input password",
			"databaseName":"password",
			"objectName":"password"
		}, success);
		
    };  
}
