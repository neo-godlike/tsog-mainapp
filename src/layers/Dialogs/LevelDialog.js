var LevelDialog = Dialog.extend({
    _level: null,
    _dialogBg: null,
    _layerContent: null,

    _data: null,
    _scenePool: [],
    _gamesSelector: [],
    _stars: [],

    _completedSteps: null,

    ctor: function(level) {
        this._super();

        this._getCompletedSteps();

        this._addDialog();
        this._addLayerContent();

        // level = "1-1"; // testing
        this._level = null;
        if (level) {
            this._level = level;
            this._fetchDataAtLevel(level);
        };
    },

    _getCompletedSteps: function() {
        this._completedSteps = User.getCurrentUser().getCurrentChild().getLevelProgress().getCompletedSteps();
    },

    _addDialog: function() {
        // cc.log("currentLanguage: " + currentLanguage);
        this._dialogBg = new cc.Sprite("#level_dialog_frame.png");
        this._dialogBg.x = cc.winSize.width/2;
        this._dialogBg.y = cc.winSize.height/2;
        this.addChild(this._dialogBg);
        this.background = this._dialogBg;
        this.background.setCascadeOpacityEnabled(true);

        var banner = new cc.Sprite("#level_dialog_banner_" + currentLanguage + ".png");
        banner.x = this._dialogBg.width/2;
        banner.y = this._dialogBg.height;
        this._dialogBg.addChild(banner);

        var closeBtn = new ccui.Button("btn_x.png", "btn_x-pressed.png", "", ccui.Widget.PLIST_TEXTURE);
        closeBtn.x = this._dialogBg.width - closeBtn.width/2 + 20 * this._csf;
        closeBtn.y = this._dialogBg.height - closeBtn.height/2;
        this._dialogBg.addChild(closeBtn);

        closeBtn.addClickEventListener(this._closePressed.bind(this));
    },

    _addLayerContent: function() {
        var l = new cc.Layer();
        l.setContentSize(cc.size(this._dialogBg.width - 50, this._dialogBg.height/2));
        l.x = 25 * this._csf;
        l.y = 100 * this._csf;
        this._dialogBg.addChild(l);
        this._layerContent = l;
        this._layerContent.setCascadeOpacityEnabled(true);
    },

    _addGamesSelector: function() {
        this._scenePool = [];
        this._gamesSelector = [];
        this._stars = [];
        var itemIdx = 0;
        var rowIdx = 1;
        var totalRow = Math.ceil(Object.keys(this._data).length / 3);
        var itemInARow = 3;
        var lastSelectorXPos = 0;
        var layerContentSizeHeight = this._layerContent.getContentSize().height;
        for (var data in this._data) {
            if (this._data.hasOwnProperty(data)) {
                var dt = this._data[data];
                var gameName = dt["1"].name;
                var gameData = dt["1"].data;

                var gameSelectorImageName = "icon_game_" + gameName + ".png";
                // cc.log("gameSelectorImageName: " + gameSelectorImageName);
                var gameSelector = new ccui.Button(gameSelectorImageName, "", "", ccui.Widget.PLIST_TEXTURE);
                gameSelector.x = lastSelectorXPos + gameSelector.width/2 + 50 * this._csf;
                gameSelector.y = (itemIdx < itemInARow) ? (layerContentSizeHeight/2 + gameSelector.height/2) : (layerContentSizeHeight/2 - gameSelector.height/2);
                gameSelector.setCascadeOpacityEnabled(true);
                var star = new cc.Sprite("#star-empty.png");
                star.scale = 0.8;
                star.x = gameSelector.width/2;
                star.y = star.height/2 * star.scale + 10 * Utils.getScaleFactorTo16And9();
                star.tag = itemIdx;
                gameSelector.addChild(star);

                this._stars.push(star);
                // set data to selector
                var gameTag = -1;
                for (var i = 0; i < GAME_IDS.length; i++) {
                    if (GAME_IDS[i].indexOf(gameName) > -1) {
                        gameTag = i;
                    }
                }

                gameSelector.setName(gameName);
                gameSelector.setUserData(data);
                gameSelector.tag = gameTag;
                gameSelector.addClickEventListener(this._gameSelectorPressed.bind(this));

                this._layerContent.addChild(gameSelector);
                this._gamesSelector.push(gameSelector);
                if (++itemIdx >= itemInARow && rowIdx < totalRow) {
                    rowIdx++;
                    lastSelectorXPos = 0;
                } else
                    lastSelectorXPos = lastSelectorXPos + gameSelector.width + 25 * this._csf;
            }
        }

        this._updateLevelDialog();
    },

    _updateLevelDialog: function() {
        debugLog("_updateLevelDialog");
        cc.log(JSON.stringify(this._completedSteps));
        if (this._completedSteps == null || this._completedSteps == "" || this._completedSteps == undefined) {
            return;
        }

        for (var stepIndex in this._completedSteps) {
            if (this._completedSteps.hasOwnProperty(stepIndex)) {
                var stepPrefix = stepIndex.substring(0, stepIndex.lastIndexOf("-"));
                var stepGame = stepIndex.substring(stepIndex.lastIndexOf("-") + 1);
                if (stepPrefix == this._level) {
                    this._stars[stepGame - 1].setSpriteFrame("star-filled.png");
                }
            }
        }
    },

    _closePressed: function() {
        this.close();
        // this.removeFromParent();
    },

    _fetchDataAtLevel: function(level) {
        var self = this;
        var dataPath = "res/config/levels/" + "step-" + level + ".json";
        if(level.indexOf("assessment") > -1)
            dataPath = "res/config/levels/" + level + ".json";
        // cc.log("dataPath: " + dataPath);
        cc.loader.loadJson(dataPath, function(err, data){
            if (!err) {
                self._data = data;
                self._addGamesSelector();
                var dataLength = Object.keys(self._data).length;
                // cc.log("data length: " + dataLength);
                SceneFlowController.getInstance().setTotalSceneInStep(dataLength);
                // cc.log("self._data " + JSON.stringify(data));
            } else {
                cc.fileUtils.removeFile(Utils.getAssetsManagerPath() + res.Map_Data_JSON);
                cc.loader.loadJson(res.Map_Data_JSON, function(err, data) {
                    self._data = data;
                });
            }
        });
    },

    _gameSelectorPressed: function(b) {
        if (this.touchBlocked)
            return;
        Utils.addLoadingIndicatorLayer();
        AudioManager.getInstance().play(res.ui_click_mp3_1, false, null);
        var durationsArray = [];

        var stepKey = b.getUserData();
        var stepData = this._data[stepKey];
        var dataLength = Object.keys(stepData).length;
        var gameName = GAME_IDS[b.tag];

        for(var i = 1; i < dataLength + 1; i++) {
            cc.log("stepData: "  + i);
            durationsArray.push(stepData[i].duration);
        };
        KVDatabase.getInstance().remove("scene_number");
        KVDatabase.getInstance().set("durationsString", JSON.stringify(durationsArray));
        var nextSceneData = stepData["1"].data; // TODO default is 1st game, need save to Local storage current game Index
        var timeForScene = stepData["1"].duration;
        var option = stepData["1"].option;
        
        // process redirecting
        debugLog("stepData: \t " + JSON.stringify(stepData));
        SceneFlowController.getInstance().cacheData(this._level, stepKey, gameName, stepData);
        SceneFlowController.getInstance().setStepData(stepData);
        SceneFlowController.getInstance().moveToNextScene(gameName, nextSceneData, timeForScene, option);
        debugLog("getCurrentStepData: \t" + SceneFlowController.getInstance().getCurrentStepData());
        AnalyticsManager.getInstance().logEventSelectContent(gameName, this._level + "-" + stepKey);
    },

});