"use strict";
cApp.factory("Wallet",["Blockchaininfo","DecentralStorage","Encryption",function(Blockchaininfo,DecentralStorage,Encryption){


	var Wallet = function(Name) {
		var self = this;
		this.Assets=[];
		this.Name=Name;
		this.Addresses=[];
		this.Book=[];
		this.Txs=[];
		this.peerBook={};
		this.Balance=0;
		this.CurrentAddress='';
		this.privatekey;
		this.storage= DecentralStorage;
		this.blockchain=Blockchaininfo;
		this.Txfee =10000;

		this.initialize=function(wallet)
		{
			this.Assets = wallet.Assets;
			this.Addresses=wallet.Addresses;
			this.Txs=wallet.Txs;
			this.Balance=wallet.Balance;
			this.CurrentAddress=wallet.CurrentAddress;
			this.privatekey=wallet.privatekey;
			//this.storage=wallet.storage;
			this.blockchain=wallet.blockchain;
			this.Txfee =wallet.Txfee;
		};

		this.getName = function() {
			return this.Name;
		};

		this.addAsset = function(asset) {
			this.Assets.push(asset);
		};

		this.getAllAssets = function() {
			return this.Assets;
		};

		this.addAddress = function(address) {
			this.Addresses.push(address);
		};

		this.getAddress = function(ind) {
			return this.Addresses[ind];
		};
		
		this.getCurrentAddress = function(){
			return CurrentAddress;
		};

		this.setCurrentAddress = function(hash){
			CurrentAddress = hash;
		};

		this.getAllTransactions = function() {
			return this.Txs;
		};

		this.addTransaction = function(transaction) {
			this.Txs.push(transaction);
		};

		this.getAllAddresses = function(){
			return this.Addresses;
		};

		this.getBook = function() {
			return this.Book;
		};

		this.setBalance = function(balance){
			this.Balance = balance;
		};

		this.getBalance = function() {
			return this.Balance;
		};

		var update = function(adr, sind) {
			
			Blockchaininfo.multiAddr(adr, function(result) {
				var balanceAcc = self.getBalance();
				for(var j = 0; j < result.addresses.length; j++)
				{
					var final_balance = result.addresses[j].final_balance;
					balanceAcc += final_balance;
					//var si = sind + j;
					//console.log(sind + " " + j + " " + self.getAddress(sind + j));
					self.getAddress(sind + j)["balance"] = final_balance;
				}
				self.setBalance(balanceAcc);
			});
		};
		
		this.updateBalance = function() {
			this.Balance = 0;
			var arr = [];
			var tot = 0;
			for(var i = 0; i < this.Addresses.length; i++) {
				arr.push(this.Addresses[i].address);
				tot += this.Addresses[i].address.length;
				if(tot > 1500 || i == this.Addresses.length-1)
				{
					update(arr.slice(0), i - arr.length + 1);
					tot = 0;
					arr = [];
				}
			}
		};

		console.log('Wallet instantiated'+Name);
	};

	Wallet.prototype.loadWallet = function(callback) {
		var _name=this.Name;
		var walletData=[]
		var _addresses=this.getAddresses();
		this.storage.get('wallet', function(data) {

			if (data === undefined) {
				data = {}
			}

			var addresses ={};
			addresses=data['wallet'][_name];
			var addresses2 = Object.keys(addresses );
			console.log(addresses2)
			console.log(_addresses);
			for ( var i = 0; i < addresses2.length; i++ ) {
				walletData.push(addresses2[i]);  
				_addresses.push(addresses2[i])    
			}
			console.log(_addresses)
			callback(_addresses);
		});
	};

	Wallet.prototype.generatePublicAddress = function(passphrase) {
		var key = Bitcoin.ECKey.makeRandom();
		var hash = key.pub.getAddress().toString();
		var newAddress = {};
		var bookEntry ={};
		newAddress["address"] = hash;
		bookEntry[hash]= Encryption.encrypt(key.toWIF(),passphrase);
		console.log("private key " + key.toWIF());
		console.log("public key " + hash);
		console.log(bookEntry)
		this.Addresses.push(newAddress);
		this.Book.push(bookEntry);
		return hash;
	}
    
	Wallet.prototype.utxofetcher = function(Addresses, callback) {
		//  var addresses  = this.getAddresses(), 
		var _blockchain=Blockchaininfo;
		_blockchain.getUnspent(Addresses,function(data){
			var unspents = {};
			unspents._value=[];
			unspents._script=[];
			unspents._tx_index=[];
			unspents._tx_hash=[];
			console.log(data)
			for(var i=0;i<data.length;i++) {
				unspents._value.push(data[i].value_hex);
				unspents._script.push(data[i].tx_output_n);
				unspents._tx_index.push(data[i].tx_index);
				unspents._tx_hash.push(data[i].tx_hash);
			}
			callback(unspents);
		});
	}
	
	Wallet.prototype.save= function(wifkey,hash){
		//  if (password !== undefined){
		var encrypted= this.encrypt(wifkey,'hello');
		var decrypted= this.decrypt(encrypted,'hello')
		// }else{
		//return false;
		//}
		var key= wifkey;
		var data={};
		data[hash]=encrypted;
		console.log("storing")
		console.log(data);
		/*if (password !== undefined){
		encrypt(key,password);
		}else{
		return false;
		}*/
		if(key !== undefined){
			// this.storage.clear()
			this.storage.save("wallet",this.Name,data);
			// this.storage.getall();
			//setTimeout(store, saveTimeOut);
			return true;
		}	
		return false;
	}
  
 //TODO: make sure that sign function uses all selected private addresses in order
  Wallet.prototype.buildTransaction= function(formData,callback) {
     var tx = new Bitcoin.Transaction()
	 
	 //retrieve all addresses with unspent outputs no more addresses than required for balance
	 /*for(
     var unspentAddresses = this.selectUnspentAddresses(this.getAddresses(),formData.amount);
     //retrieve all private keys from addresses with balances
     var key = this.retrievePvtKeys(unspentAddresses);
     this.utxofetcher(unspentAddresses,function(data){
     var tx = new Bitcoin.Transaction();
     addInput(tx,data);
     addOutput(tx,formData.addr,formData.amount);
     sign(tx,data,key)
     console.log(tx.toHex())
     return tx.toHex();
      });
     //change address
 */
  }//end build transaction

  function addInput(tx,unspent_output) {
      for ( var i = 0; i < unspent_output._tx_index.length; i++ ) {
          var unspent = unspent_output[ i ]
          //reverse bytes for endianness
          var hash= reverse(unspent_output._tx_hash[i]);
          var index = unspent_output._tx_index[i];
          console.log(index)
          tx.addInput(hash,index);
      }
  }

  function addFee(toAddress) {
      var Fee= 10000;
      var txValue =toAddress.value;
      return txValue+Fee;
  }

  function calculateChange(allunspents, addFee) {

      var result=allunspents-addFee;
      return result;
  }
    //substract change when adding outputs

  function addOutput(tx,address,value){

      var fee = 10000;
       //change address
      console.log(address);
      var changeValue = calculateChange(value,fee);
      console.log(changeValue);
      //generate change address
     // var changeAddress=generatePublicAddress();
      //console.log(changeAddress);
      tx.addOutput(address,changeValue);

  }

  function sign(tx,unspent_outputs,key){
    console.log(key)
     for(var i=0;i<unspent_outputs._tx_index.length;i++){
       console.log("iteration: "+i)
       tx.sign(i,key);
      }
  }
  

  // change network callback scheme to just return data
  Wallet.prototype.selectUnspentAddresses = function(addresses,amount){
      var balance=0;
      var addresses=[];
      this.blockchain.multiAddr(addressess,function(data){
        for(var i=0;i<data.addresses.length;i++){
            if(balance<amount){
                balance+=data.addresses[i].final_balance;
                if(data.addresses[i].final_balance>0){
                  addresses.push(data.addresses[i].address);
                }
           }
        }
          //console.log(addresses)
      });  //end callback      
      return addresses;
  }

    
  Wallet.prototype.unspentsToAddresses = function(unspentOutputs) {
      var addressStrs = [];
      for ( var i = 0; i < unspentOutputs.length; i++ ) {
          var unspent = unspentOutputs[i];
          var script = new Bitcoin.Script( Crypto.util.hexToBytes(unspent. script) );
          var pubKeyHash = script.simpleOutPubKeyHash();
          var addressStr = new Bitcoin.Address( pubKeyHash ).toString();
          addressStrs.push( addressStr );
      }
      return addressStrs;
  }


  Wallet.prototype.retrievePvtKeys = function(){
    console.log("hello")
      var addresses=this.getAddresses();
      var walletBook=this.getBook();
      console.log(walletBook)
      var privateKeys = {};
      for ( var i = 0; i < addresses.length; i++ ) {
          var publicAddress = addresses[i];
          privateKeys = walletBook[publicAddress];
      }
      console.log(privateKeys)
      return privateKeys;
  }


    /*
     * Start a multisig structure out n participants public keys and m
     * m {number} needed participants 
     * n {Array} public keys of all participants
     */
  Wallet.prototype.multisig= function(m, n){
      //Todo: make sure n is an array
        // Create script
        var redeemScript = Bitcoin.scripts.multisigOutput(m, n) // 2 of 3
        // Encoded script
        var scriptPubKey = Bitcoin.scripts.scriptHashOutput(redeemScript.getHash())
        // Encode in base58, v0x05 is multisig
        var multisigAddress = Bitcoin.Address.fromOutputScript(scriptPubKey).toString()
        
        console.log("multisigP2SH:", multisigAddress)
        
        return multisigAddress;
  },
    /*
     *Import a multisig transaction
     */
  Wallet.prototype.importMultiSig = function(data, version){
        var script = new Bitcoin.Script(convert.hexToBytes(data));
        var hashed = Bitcoin.crypto.hash160(script.buffer);
        var address = Bitcoin.base58check.encode(hashed, version);
        var pubKeys = script.extractPubkeys();
        var m = script.chunks[0] - Bitcoin.Opcode.map.OP_1 + 1;
        //return {address: address, script: data, m: m, pubKeys: pubKeys};
  },


  Wallet.prototype.encrypt= function(privateKey,passwordDigest) {
      if (passwordDigest !== undefined ) {
        var encrypted = CryptoJS.AES.encrypt(privateKey, passwordDigest).toString();
        privateKey=encrypted;
        return encrypted;
      }
  }

  Wallet.prototype.decrypt= function(encrypted,passwordDigest) {
      var decrypted = CryptoJS.AES.decrypt(encrypted, passwordDigest);
       var privateKey = decrypted.toString(CryptoJS.enc.Utf8);
      if ((privateKey === "") || (typeof privateKey === 'undefined')){
          return false;
      }
      return privateKey;
  }

  var reverse = function(str){
    	var ret = "";
    	var len = str.length;
    	if(len % 2 == 1){
    		len--;
    		ret = str.charAt(len);
    	}
    	for(var i = len-2; i >= 0; i-=2)
    	{
    		ret += str.charAt(i);
    		ret += str.charAt(i+1);
    	}
    	return ret;
  }

return Wallet;
}]);//end factory
