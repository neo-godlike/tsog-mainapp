var IAPManager = cc.Class.extend({

    purchaseCallback: null,

    ctor: function () {
        cc.assert(IAPManager._instance == null, "can be instantiated once only");
    },
    
    getLastestProductData: function() {
        sdkbox.IAP.refresh();
    },

    purchase: function(name, cb) {
        sdkbox.IAP.purchase(name);
        this.purchaseCallback = cb;
    },

    restore: function(callback){
        this.purchaseCallback = callback;

        cc.log("cc.sys.os: '%s'", cc.sys.os);
        if (cc.sys.os === "iOS") {
            cc.log("calling sdkbox.IAP.restore");
            sdkbox.IAP.restore();
        }
        else {
            var purchaseDatasJson = NativeHelper.callNative("getPurchases");
            //console.log(purchaseDatasJson);
            // Format @purchaseDatasJson:
            // [{"packageName":"", "productId":"",....},]
            //NativeHelper.callNative("showMessage", ["Purchased Products", purchaseDatasJson]);

            // Reformat Json string if has @',]' in the tail
            var jsonData;
            if (purchaseDatasJson.lastIndexOf(",]") == -1){
                jsonData = JSON.parse(purchaseDatasJson);
            }
            else {
                jsonData = JSON.parse(purchaseDatasJson.substr(0, purchaseDatasJson.lastIndexOf(",]")) + "]");
            }

            let hasPurchased = false; 

            for (var i = 0; i < jsonData.length; i++) {
                var receipt = jsonData[i];
                if (SUBSCRIPTION_IAP_ID_ANDROID == receipt.productId){
                    Utils.startCountDownTimePlayed("showPayWall");
                    hasPurchased = true;
                    break;
                }
            }

            if (this.purchaseCallback && hasPurchased)
                this.purchaseCallback(true);
        }
    },

    init: function() {
        //console.log("SDKBox IAP start init");
        sdkbox.IAP.init();
        // sdkbox.IAP.setDebug(true);
        // sdkbox.IAP.enableUserSideVerification(true);

        var self = this;
        
        if (cc.sys.os === "Android")
            NativeHelper.callNative("initInAppBillingService");

        //console.log("SDKBox IAP Set listener");
        sdkbox.IAP.setListener({
            onSuccess : function (product) {
                // Purchase success
                console.log("onProductPurchaseSuccess");
                console.log(JSON.stringify(product));

                // Only one type of IAP so dont need to check productID
                if (self.purchaseCallback)
                    self.purchaseCallback(true, product);
            },
            onFailure : function (product, msg) {
                console.log("onProductPurchaseFailure");
                console.log(JSON.stringify(product));
                //console.log(msg);
                // Utils.startCountDownTimePlayed("showPayWall");
                if (self.purchaseCallback)
                    self.purchaseCallback(false);
            },
            onCanceled : function (product) {
                // Purchase was canceled by user
                // Utils.startCountDownTimePlayed("showPayWall");
                if (self.purchaseCallback)
                    self.purchaseCallback(false);
            },
            onRestored : function (product) {
                console.log("onRestored: " + JSON.stringify(product));
                if (self.purchaseCallback) {
                    self.purchaseCallback(true, product);
                }
            },
            onRestoreComplete: function(success, msg) {
                console.log("onRestoreComplete: " + msg);
                if (self.purchaseCallback) {
                    self.purchaseCallback(success, msg);
                }
            },
            onProductRequestSuccess : function (products) {
                console.log("onProductRequestSuccess");
                //Returns you the data for all the iap products
                //You can get each item using following method
                for (var i = 0; i < products.length; i++) {
                    console.log(JSON.stringify(products[i]));
                    if (products[i]["id"] == SET_SMALL_ID) {
                        SET_SMALL_PRICE = products[i]["price"] || SET_SMALL_PRICE;
                    }
                    else if (products[i]["id"] == SET_MEDIUM_ID) {
                        SET_MEDIUM_PRICE = products[i]["price"] || SET_MEDIUM_PRICE;
                    }
                    else if (products[i]["id"] == SET_BIG_ID) {
                        SET_BIG_PRICE = products[i]["price"] || SET_BIG_PRICE;
                    }
                    else if (products[i]["id"] == MONTHLY_SUBSCRIPTION_ID) {
                        MONTHLY_SUBSCRIPTION_PRICE = products[i]["price"] || MONTHLY_SUBSCRIPTION_PRICE;
                    }
                }
            },
            onProductRequestFailure : function (msg) {
                console.log("onProductRequestFailure");
                //console.log(msg);
                //When product refresh request fails.
            }
        });
    }
    
});

IAPManager._instance = null;

IAPManager.getInstance = function () {
  return IAPManager._instance || IAPManager.setupInstance();
};

IAPManager.setupInstance = function () {
    IAPManager._instance = new IAPManager();
    IAPManager._instance.init();
    return IAPManager._instance;
}