var MapLayer = cc.Layer.extend({
    _poolParts: [],
    _btnStepCoordinates: [],
    _steps: [],
    _stepsStar: {},

    _mapData: null,
    _scrollView: null,

    _csf: 1,

    ctor: function() {
        this._super();
        this._stepsStar = {};
        this._loadTmx();
        this._loadMapData();

        this.addSettingButton();
        this._updateMapData();
    },

    addSettingButton: function() {
        var settingBtn = new ccui.Button();
        settingBtn.loadTextures("btn_pause.png", "btn_pause-pressed.png", "", ccui.Widget.PLIST_TEXTURE);
        settingBtn.x = settingBtn.width - 10;
        settingBtn.y = cc.winSize.height - settingBtn.height/2 - 10;
        this.addChild(settingBtn);

        var self = this;
        settingBtn.addClickEventListener(function() {
            self.addChild(new SettingDialog(), 999);
        })
        this._settingBtn = settingBtn;
    },

    _loadMapBg: function() {
        var lastPartXPos = 0;
        var stepIndex = 1;
        var mapIndex = 1;
        var isAllLevelUnlocked = KVDatabase.getInstance().getInt("UnlockAllLevels");

        this._steps = [];

        var scrollView = new cc.ScrollView();
        for (var map in this._mapData) {
            if (this._mapData.hasOwnProperty(map) && map.indexOf("assessment") < 0) {
                var path = "Map_Part" + mapIndex + "_jpg";
                var mapPart = new cc.Sprite(res[path]);
                mapPart.x = lastPartXPos + mapPart.width/2;
                mapPart.y = cc.winSize.height/2;
                
                var _map = this._mapData[map];
                var _mapInArray = Object.keys(_map);
                var totalSteps = _mapInArray.length;

                for (var step in _map) {
                    if (_map.hasOwnProperty(step)) {
                        var val = _map[step];

                        var pos = this._btnStepCoordinates[stepIndex-1];
                        var enabled = (val == "1-1") ? true : false;
                        var btn = new ccui.Button("btn_level.png", "btn_level-pressed.png", "btn_level-disabled.png", ccui.Widget.PLIST_TEXTURE);
                        btn.x = pos.x + btn.width * 0.5 + mapPart.width * (parseInt(map) - 1);
                        btn.y = pos.y + btn.height * 1.5;
                        btn.setEnabled(isAllLevelUnlocked ? true : enabled);
                        var lb = new cc.LabelBMFont(val, res.MapFont_fnt);
                        lb.x = btn.width/2;
                        lb.y = btn.height/2 + 35 * this._csf;
                        btn.addChild(lb);

                        scrollView.addChild(btn, 1);

                        btn.setUserData(val);
                        btn.addClickEventListener(this._stepPressed.bind(this));

                        this._addStepStars(btn);

                        if ((stepIndex%5 > 0) && _mapInArray[totalSteps-1] == step)
                            stepIndex += 5 - (stepIndex%5);

                        this._steps.push(btn);
                        stepIndex = (stepIndex >= this._btnStepCoordinates.length) ? 1 : (stepIndex+1);
                    }
                }
                
                scrollView.addChild(mapPart);

                lastPartXPos += mapPart.width;
                this._poolParts.push(mapPart);

                mapIndex = (mapIndex >= 4) ? 1 : (mapIndex+1);
            }
        }

        scrollView.setDirection(cc.SCROLLVIEW_DIRECTION_HORIZONTAL);
        scrollView.setContentSize(cc.size(lastPartXPos, mapPart.height));
        scrollView.setViewSize(cc.director.getWinSize());
        this.addChild(scrollView);
        this._scrollView = scrollView;
    },

    _duplicateMapAt: function(idx) {},

    _loadMapData: function() {
        var self = this;
        cc.loader.loadJson(res.Map_Data_JSON, function(err, data){
            if (!err) {
                self._mapData = data;
                self._loadMapBg();
            } else {
                cc.fileUtils.removeFile(Utils.getAssetsManagerPath() + res.Map_Data_JSON);
                cc.loader.loadJson(res.Map_Data_JSON, function(err, data) {
                    self._mapData = data;
                });
            }
        });
        // cc.log("_mapData: " + JSON.stringify(this._mapData));

    },

    _loadTmx: function() {
        this._btnStepCoordinates = [];
        this._csf = cc.director.getContentScaleFactor();
        var tiledMap = new cc.TMXTiledMap();
        tiledMap.initWithTMXFile(res.Map_TMX);

        // var group = tiledMap.getObjectGroup("buttonPart1");
        var self = this;
        tiledMap.getObjectGroups().forEach(function(group) {
            if (group.getGroupName().startsWith("buttonPart")) {
                group.getObjects().forEach(function(obj) {
                    self._btnStepCoordinates.push({
                        "x": obj.x * self._csf,
                        "y": obj.y * self._csf
                    }); 
                });
            }
        });
        // cc.log("this._btnStepCoordinates: " + JSON.stringify(this._btnStepCoordinates));
        // cc.log("this._btnStepCoordinates length : " + this._btnStepCoordinates.length);
    },

    _addStepStars: function(btn) {
        var self = this;
        var step = btn.getUserData();
        this._stepsStar[step] = [];
        var stepData = [];
        // var starPosDif = [2.2, 1.6, 1.2, 1.2, 1.6, 2.2];
        // getTotalGame in step
        var dataPath = "res/config/levels/" + currentLanguage + "/" + "step-" + step + "." + currentLanguage +".json";
        cc.log("_addStepStars dataPath: " + dataPath);
        if (!jsb.fileUtils.isFileExist(dataPath))
            return;
        cc.loader.loadJson(dataPath, function(err, data){
            cc.log("err: " + err);
            if (!err && data) {
                stepData = data;
                // cc.log("self._data " + JSON.stringify(data));
                var totalGameInStep = Object.keys(stepData).length;
                for (var i = 0; i < totalGameInStep; i++) {
                    var star = new cc.Sprite("#star-empty.png");
                    star.scale = 0.35;
                    star.x = btn.width/2 - star.width * (totalGameInStep/2 - i - 0.5) *star.scale;
                    star.y = btn.height;
                    star.tag = i;
                    btn.addChild(star);
                    self._stepsStar[step].push(star);
                }
            } else {
                cc.fileUtils.removeFile(Utils.getAssetsManagerPath() + res.Map_Data_JSON);
                cc.loader.loadJson(res.Map_Data_JSON, function(err, data) {
                });
            }
        });
        
    },

    _updateMapData: function() {
        var stepData = KVDatabase.getInstance().getString("stepData");
        var currentLevel = SceneFlowController.getInstance().getCurrentLevel();
        var currentSceneName = SceneFlowController.getInstance().getCurrentSceneName();
        
        if (stepData == null || stepData == "" || stepData == undefined)
            return;
        cc.log("stepData: " + stepData);
        stepData = JSON.parse(stepData);
        for (var step in stepData) {
            var eachStepData = stepData[step];
            cc.log("eachStepData: " + JSON.stringify(eachStepData));
            if (!eachStepData)
                return;
            cc.log("eachStepData.completed: " + eachStepData.completed);
            if (eachStepData.completed) {
                this._updateStepState(step);
            }
            for (var info in eachStepData){
                cc.log("info: " + info);
                var gameCompleted;
                var eachStepInfo = eachStepData[info];
                if (info.indexOf("totalStars") < 0)
                    gameCompleted = eachStepData[info];
                else {
                    this._updateStepData(step, eachStepInfo);
                }
            }
        }

    },

    _updateStepState: function(step) {
        cc.log("_updateStepState");
        for (var i = 0; i < this._steps.length; i++) {
            var stepBtn = this._steps[i];
            var userData = stepBtn.getUserData();

            if (step == userData)
                this._steps[i+1].setEnabled(true);
        }
    },

    _updateStepData: function(step, eachStepInfo) {
        // cc.log("_updateStepData");
        // cc.log("this._stepsStar: " + JSON.stringify(this._stepsStar));
        // cc.log("eachStepInfo: " + eachStepInfo);
        var stepStars = this._stepsStar[step];
        if (isNaN(eachStepInfo))
            eachStepInfo = parseInt(eachStepInfo);
        for (var i = 0; i < eachStepInfo; i++) {
            var star = stepStars[i];
            star.setSpriteFrame("star-filled.png");
        }
    },

    _stepPressed: function(b) {
        var level = b.getUserData();
        cc.log("level-> " + level);
        this.addChild(new LevelDialog(level));
    },
});

MapLayer.TotalMapPart = 4;
MapLayer.TotalStarsEachStep = 6;

var MapScene = cc.Scene.extend({
    ctor:function() {
        this._super();

        var l = new MapLayer();
        this.addChild(l);
    }
});