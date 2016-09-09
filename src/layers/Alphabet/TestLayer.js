var TestLayer = cc.LayerColor.extend({

    _names: [],
    _touchCounting:0,
    _hudLayer:null,

    _adiDog: null,
    _isTestScene: false,
    _data: null,

    ctor: function() {
        this._super(cc.color(255, 255, 255, 255));
        Utils.showVersionLabel(this);
    },

    setData: function(data) {
        this._data = data;
    },

    onEnter: function() {
        this._super();
        this._addHudLayer();
    }, 

    onExit: function() {
        this._super();
        this._adiDog = null;
    },

    _addHudLayer: function(){
        var hudLayer = new HudLayer(this, true);
        hudLayer.x = 0;
        hudLayer.y = cc.winSize.height - 80;
        this.addChild(hudLayer, 99);
        this._hudLayer = hudLayer;
        // this._hudLayer.setProgressLabelStr(this._touchCounting, this._names.length);
    },

    _setIsTestScene: function(isTestScene) {
        this._isTestScene = isTestScene;
    },

    _moveToNextScene: function() {
        if (this._isTestScene)
            cc.director.replaceScene(new cc.TransitionFade(1, new GameTestScene(), cc.color(255, 255, 255, 255)));
        if (TSOG_DEBUG) {
            this._objectsArray = [{"name":"hat","tag":0},{"name":"jar","tag":1},{"name":"key","tag":2}];
            this._oldSceneName = "room";
        }


        var nextSceneName = SceneFlowController.getInstance().getNextSceneName();

        cc.log("nextSceneName: " + nextSceneName); 
        if (nextSceneName)
            SceneFlowController.getInstance().moveToNextScene(nextSceneName, this._data);
        else
            cc.director.runScene(new MapScene());
        // var scene;
        // if (nextSceneName != "RoomScene" && nextSceneName != "ForestScene" && nextSceneName != "TalkingAdiScene")
        //     scene = new window[nextSceneName](this._objectsArray, this._oldSceneName);
        // else
        //     scene = new window[nextSceneName]();
        // cc.director.replaceScene(new cc.TransitionFade(1, scene, cc.color(255, 255, 255, 255)));
    }
});