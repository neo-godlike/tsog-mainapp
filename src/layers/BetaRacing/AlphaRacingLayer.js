var AR_TAG_TILE_MAP = 1;
var AR_SCALE_NUMBER = 1;
var TEST_SPEED = 1;
var ENABLE_DEBUG_DRAW = false;
var AR_ADI_ZODER = 1002;
var AR_LANDS_ZODER = 1000;
var AR_WORD_ZODER = 1001;
var AR_MAP_HORIZONTAL_TILES = 30;
var AR_MAP_VERTICLE_TILES = 20;

var AR_TAG_ALPHABET_MARGET_ACTION = 834;

var AlphaRacingLayer = cc.LayerColor.extend({
	
    gameLayer: null,
    arEffectLayer: null,
    maps: [],
    mapIndexArray: [],
    historyMapIndexArray: [],
    layers: [],
    _mapIndex: 0,
    _gameLayerSize: cc.size(0,0),
    _mapWidth: 0,
    _mapHeight: 0,
    _player: null,
    _tileSize: cc.size(0,0),
    _landLayer: null,
    _playerBorder: null,
    _tileBorder: null,
    _alphabetPosArray: [],
    _alphabetObjectArray: [],
    _inputData: [],
    _tempInputData: [],
    _currentChallange: null,
    _currentEarnedNumber: 0,
    _hudLayer: null,
    _totalEarned: 0,
    _totalGoalNumber: 0,
    _warningLabel: null,
    _lastPlayerPos: cc.p(0,0),
    // Background objects
    _mountain01: null,
    _mountain02: null,
    _ground01: null,
    _ground02: null,
    _dust01: null,
    _dust02: null,
    _cloudGroup01: null,
    _cloudGroup02: null,
    _elapsedTime: 0,

    _parallaxs: [],
    _deltaTime: 1 / 60,
    _timeForSence: 0,

    _workers: [],
    _obstacleWorker: null,
    _boosterWorker: null,

	ctor: function(inputData, option) {
        this._super(cc.color("#ebfcff"));

        cc.spriteFrameCache.addSpriteFrames(res.AR_Background_plist);

        this.resetData();
        this._inputData = inputData;
        this._tempInputData = inputData.slice();

        this._elapsedTime = 0;
        // this.addRefreshButton();

        this._workers = [];
    },

    addRefreshButton: function() {
        NativeHelper.callNative("customLogging", ["Button", "res/refresh-button.png"]);
        var refreshButton = new ccui.Button("res/refresh-button.png", "", "");
        refreshButton.x = cc.winSize.width - refreshButton.width;
        refreshButton.y = refreshButton.height / 2;
        this.addChild(refreshButton, 100);
        var self = this;
        refreshButton.addClickEventListener(function() {
            var data = DataManager.getInstance().getDataAlpharacing();
            cc.director.replaceScene(new AlphaRacingScene(data, null, 600));
        });
    },

    _init: function() {

        this.gameLayer = new cc.Layer();
        this.addChild(this.gameLayer, 10);
        
        this.initPlayer();
        this.addHud();
        
        this.initWorkers();
        this.initPlatforms();
        this.initBackground();

        cc.eventManager.addListener({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,
            swallowTouches: true,
            onTouchBegan: this.onTouchBegan.bind(this),
            onTouchMoved: this.onTouchMoved.bind(this),
            onTouchEnded: this.onTouchEnded.bind(this)
        }, this);

        this.scheduleUpdate();
    },

    onEnter: function() {
        this._super();
        this._alphabetObjectArray = [];
        this.layers = [];
        this.maps = [];
        
        this._init();
        this._playBackgroundMusic();

        this._eventGameOver = cc.EventListener.create({
            event: cc.EventListener.CUSTOM,
            eventName: EVENT_AR_GAMEOVER,
            callback: function(event) {
                this.unscheduleUpdate();
                this.completedScene(localize("Game Over"));
            }.bind(this)
        });
        cc.eventManager.addListener(this._eventGameOver, 1);
    },

    onExit: function() {
        this._super();
        this.unscheduleUpdate();
        this._player = null;
        this._tileSize = cc.size(0,0);
        this._landLayer = null;
        this._playerBorder = null;
        this._tileBorder = null;
        this._alphabetPosArray = [];
        this._alphabetObjectArray = [];
        this.layers = [];

        this._workers.forEach(w => w.end());

        for (var i = 0; i < this.maps.length; i++) {
            this.gameLayer.removeChild(this.maps[i]);
        }
        this.maps = [];

        cc.eventManager.removeListener(this._eventGameOver);

        cc.audioEngine.stopMusic();
    },

    resetData: function() {
        this._parallaxs = [];
        this.gameLayer = null;
        this.maps = [];
        this.mapIndexArray = [];
        this.historyMapIndexArray = [];
        this.layers = [];
        this._mapIndex = 0;
        this._gameLayerSize = cc.size(0,0);
        this._mapWidth = 0;
        this._mapHeight = 0;
        this._player = null;
        this._tileSize = cc.size(0,0);
        this._landLayer = null;
        this._playerBorder = null;
        this._tileBorder = null;
        this._alphabetPosArray = [];
        this._alphabetObjectArray = [];
        this._inputData = [];
        this._tempInputData = [];
        this._currentChallange = null;
        this._currentEarnedNumber = 0;
        this._hudLayer = null;
        this._totalEarned = 0;
        this._totalGoalNumber = 0;
        this._warningLabel = null;
        this._lastPlayerPos = cc.p(0,0);
        // Background objects
        this._mountain01 = null;
        this._mountain02 = null;
        this._ground01 = null;
        this._ground02 = null;
        this._dust01 = null;
        this._dust02 = null;
        this._cloudGroup01 = null;
        this._cloudGroup02 = null;
    },

    update: function(dt) {

        // Force to 60 FPS
        var updateTimes = Math.round(dt / this._deltaTime);

        for (var i = 0; i < updateTimes; i++) {
            let startTime = (new Date()).getTime();
            this._player.updatea(this._deltaTime / TEST_SPEED);
            // this._checkAndScrollBackgrounds(this._player.getPosition());

            this.checkForAndResolveCollisions(this._player);
        }

        this._workers.forEach(w => w.update(dt));

        this._checkAndReloadMaps(this._player);
        this.checkForAlphabetCollisions(dt);

        var delta = this.setViewpointCenter(this._player.getPosition());
        for (var i = 0; i < this._parallaxs.length; i ++) {
            this._parallaxs[i].updateWithVelocity(cc.p(delta.x / 32, 0), dt);
        };
        // this._parallaxs.updateWithVelocity(cc.p(delta.x / 32, 0), dt);
    },

    _playBackgroundMusic: function() {
        cc.audioEngine.playMusic(res.alpha_racing_mp3, true);
    },

    initPlayer: function() {
        var name = CharacterManager.getInstance().getSelectedCharacter();
        switch (name) {
            case "monkey":
                cc.log("name: " + name);
                this._player = new ARMonkey();
                break;
            case "adi":
                this._player = new ARAdiDog();
                break;
        };
        // cc.log("initPlayer: " + JSON.stringify(this._player.getPosition()));
        this.gameLayer.addChild(this._player, AR_ADI_ZODER);

        this._playerBorder = cc.DrawNode.create();
        // this._playerBorder.retain();
        this.gameLayer.addChild(this._playerBorder, AR_ADI_ZODER+1);
    },

    initPlatforms: function() {        
        // Check current goal and update UI
        this._initChallenges();

        // this._addBackground();

        
        for (var i = 0; i < AR_TMX_LEVELS.length; i++) {
            var tmxMap = new cc.TMXTiledMap(AR_TMX_LEVELS[i]);
            tmxMap.setScale(AR_SCALE_NUMBER);
            tmxMap.setPosition(cc.p(-3000, -3000));
            tmxMap.setVisible(false)
            
            this.maps.push(tmxMap);
            this.gameLayer.addChild(tmxMap, AR_LANDS_ZODER, 2);

            var tmxLayer = tmxMap.getLayer("Lands");
            this.layers.push(tmxLayer);

            this.mapIndexArray.push({index: i});

            this._mapWidth = tmxMap.getContentSize().width;
            this._mapHeight = tmxMap.getContentSize().height;
            this._tileSize = cc.size(tmxMap.getTileSize().width * AR_SCALE_NUMBER, tmxMap.getTileSize().height * AR_SCALE_NUMBER);
        }

        // Shuffle map index array
        let shuffledMapArray = shuffle(this.mapIndexArray);

        // Render 3 maps
        for (var i = 0; i < 3; i++){
            let index = shuffledMapArray[i].index;
            this.maps[index].setVisible(true)
            this.maps[index].setPosition(cc.p(this._gameLayerSize.width, 0));
            cc.log("Map %d - Pos: (%d, %d) - Visible: %d", index, this.maps[index].x, 0, (this.maps[index].isVisible()) ? 1 : 0);
            this._gameLayerSize = cc.size(this._gameLayerSize.width + this._mapWidth, this._mapHeight);
            this.historyMapIndexArray.push(index);

            this.addAlphabet(this.maps[index]);
            this.addObstacles(this.maps[index]);
            this.addBoosters(this.maps[index]);
        }

        this._tileBorder = cc.DrawNode.create();
        // this._tileBorder.retain();
        this.addChild(this._tileBorder);

        this.arEffectLayer = new AREffectLayer();
        this.addChild(this.arEffectLayer, 10);
    },

    initBackground: function() {
        var treessofar1 = new cc.Sprite("#treessofar.png");
        var treessofar2 = new cc.Sprite("#treessofar.png");
        var treessofar3 = new cc.Sprite("#treessofar.png");
        var parallaxtreessofar = cc.CCParallaxScrollNode.create();
        parallaxtreessofar.addInfiniteScrollWithObjects([treessofar1, treessofar2, treessofar3], 0, cc.p(-1, 0), cc.p(), cc.p(1, 0), cc.p(0, 0), cc.p(-2, -2));
        this.addChild(parallaxtreessofar,1);
        this._parallaxs.push(parallaxtreessofar);


        var grass1 = new cc.Sprite("#grassalpharacing.png");
        var grass2 = new cc.Sprite("#grassalpharacing.png");
        var grass3 = new cc.Sprite("#grassalpharacing.png");
        var parallaxgrass = cc.CCParallaxScrollNode.create();
        parallaxgrass.addInfiniteScrollWithObjects([grass1, grass2, grass3], 1, cc.p(-2, 0), cc.p(), cc.p(1, 0), cc.p(0, 0), cc.p(-2, -2));
        this.addChild(parallaxgrass,1);
        this._parallaxs.push(parallaxgrass);

        var trees1 = new cc.Sprite("#trees.png");
        var trees2 = new cc.Sprite("#trees.png");
        var trees3 = new cc.Sprite("#trees.png");
        var parallaxtrees = cc.CCParallaxScrollNode.create();
        parallaxtrees.addInfiniteScrollWithObjects([trees1, trees2, trees3], 2, cc.p(-5, 0), cc.p(), cc.p(1, 0), cc.p(0, 0), cc.p(-2, -2));
        this.addChild(parallaxtrees,1);
        this._parallaxs.push(parallaxtrees);

        var light1 = new cc.Sprite("#light.png");
        var light2 = new cc.Sprite("#light.png");
        var light2 = new cc.Sprite("#light.png");
        var parallaxlight = cc.CCParallaxScrollNode.create();
        parallaxlight.addInfiniteScrollWithObjects([light1, light2], 3, cc.p(- 10, 0), cc.p(0, cc.winSize.height - light1.height), cc.p(1, 0), cc.p(0, 0), cc.p(-2, -2));
        this.addChild(parallaxlight,1);
        this._parallaxs.push(parallaxlight);

        var treesbottom1 = new cc.Sprite("#treesbottom.png");
        var treesbottom2 = new cc.Sprite("#treesbottom.png");
        var parallaxtreesbottom = cc.CCParallaxScrollNode.create();
        parallaxtreesbottom.addInfiniteScrollWithObjects([treesbottom1, treesbottom2], 4, cc.p(-5, 0), cc.p(), cc.p(1, 0), cc.p(0, 0), cc.p(-2, -2));
        this.addChild(parallaxtreesbottom,1);
        this._parallaxs.push(parallaxtreesbottom);

        var treestop1 = new cc.Sprite("#treestop.png");
        var treestop2 = new cc.Sprite("#treestop.png");
        var parallaxtreestop = cc.CCParallaxScrollNode.create();
        parallaxtreestop.addInfiniteScrollWithObjects([treestop1, treestop2], 4, cc.p(-5, 0), cc.p(0, cc.winSize.height - treestop1.height), cc.p(1, 0), cc.p(0, 0), cc.p(-2, -2));
        this.addChild(parallaxtreestop,1);
        this._parallaxs.push(parallaxtreestop);

        var gradientMask = new cc.LayerGradient(cc.color("#a9f22a"), cc.color("#aee0ff"), cc.p(0, 1));
        this.addChild(gradientMask);

    },

    initWorkers: function() {
        this._workers.push(new ARDistanceCountingWorker(this._player, this._hudLayer));

        this._obstacleWorker = new ARObstacleWorker(this._player);
        this._workers.push(this._obstacleWorker);

        this._boosterWorker = new ARBoosterWorker(this._player);
        this._workers.push(this._boosterWorker);
    },

    _addBackground: function() {
        cc.spriteFrameCache.addSpriteFrames(res.AR_Background_plist);

        this._mountain01 = new cc.Sprite("#mountain.png");
        this._mountain01.setScale(1);
        this._mountain01.setAnchorPoint(0.5,0);
        this._mountain01.setPosition(cc.p(cc.winSize.width / 2, 150));
        this.addChild(this._mountain01, 0, 1);

        this._mountain02 = new cc.Sprite("#mountain.png");
        this._mountain02.setScale(1);
        this._mountain02.setAnchorPoint(0.5,0);
        this._mountain02.setPosition(cc.p(cc.winSize.width / 2 + this._mountain01.width, 150));
        this.addChild(this._mountain02, 0, 1);

        this._dust01 = new cc.Sprite("#foreground2.png");
        this._dust01.setScale(1);
        this._dust01.setAnchorPoint(0.5,0);
        this._dust01.setPosition(cc.p(cc.winSize.width / 2, 100));
        this.addChild(this._dust01, 0, 1);

        this._dust02 = new cc.Sprite("#foreground2.png");
        this._dust02.setScale(1);
        this._dust02.setAnchorPoint(0.5,0);
        this._dust02.setPosition(cc.p(cc.winSize.width / 2 + this._dust01.width, 100));
        this.addChild(this._dust02, 0, 1);

        this._ground01 = new cc.Sprite("#foreground1.png");
        this._ground01.setScale(1);
        this._ground01.setAnchorPoint(0.5,0);
        this._ground01.setPosition(cc.p(cc.winSize.width / 2, 100));
        this.addChild(this._ground01, 0, 1);

        this._ground02 = new cc.Sprite("#foreground1.png");
        this._ground02.setScale(1);
        this._ground02.setAnchorPoint(0.5,0);
        this._ground02.setPosition(cc.p(cc.winSize.width / 2 + this._ground01.width, 100));
        this.addChild(this._ground02, 0, 1);

        this._addCloudBackground();
    },

    _addCloudBackground: function() {
        this._cloudGroup01 = new cc.Layer();
        this._cloudGroup02 = new cc.Layer();
        this._cloudGroup02.setPositionX(cc.winSize.width);

        var cloud = new cc.Sprite("#cloud1.png");
        cloud.setPosition(cc.p(Utils.getRandomInt(100, cc.winSize.width / 2), cc.winSize.height - Utils.getRandomInt(50, 120)));
        this._cloudGroup01.addChild(cloud);

        cloud = new cc.Sprite("#cloud2.png");
        cloud.setPosition(cc.p(Utils.getRandomInt(100, cc.winSize.width / 2), cc.winSize.height - Utils.getRandomInt(50, 120)));
        this._cloudGroup01.addChild(cloud);

        cloud = new cc.Sprite("#cloud1.png");
        cloud.setPosition(cc.p(Utils.getRandomInt(100, cc.winSize.width / 2), cc.winSize.height - Utils.getRandomInt(50, 120)));
        this._cloudGroup01.addChild(cloud);

        cloud = new cc.Sprite("#cloud2.png");
        cloud.setPosition(cc.p(Utils.getRandomInt(100, cc.winSize.width / 2), cc.winSize.height - Utils.getRandomInt(50, 120)));
        this._cloudGroup02.addChild(cloud);

        cloud = new cc.Sprite("#cloud1.png");
        cloud.setPosition(cc.p(Utils.getRandomInt(100, cc.winSize.width / 2), cc.winSize.height - Utils.getRandomInt(50, 120)));
        this._cloudGroup02.addChild(cloud);

        cloud = new cc.Sprite("#cloud2.png");
        cloud.setPosition(cc.p(Utils.getRandomInt(100, cc.winSize.width / 2), cc.winSize.height - Utils.getRandomInt(50, 120)));
        this._cloudGroup02.addChild(cloud);

        this.addChild(this._cloudGroup01);
        this.addChild(this._cloudGroup02);
    },

    _checkAndScrollBackgrounds: function(playerPos) {
        if (this._lastPlayerPos == cc.p(0,0)){
            this._lastPlayerPos = playerPos;
        }

        let offsetPos = cc.pSub(playerPos, this._lastPlayerPos);
        offsetPos.x = 0.1;
        this._scrollBackground(this._mountain01, this._mountain02, offsetPos, 0.1, 0.2);
        this._scrollBackground(this._ground01, this._ground02, offsetPos, 0.2, 0.4);
        this._scrollBackground(this._dust01, this._dust02, offsetPos, 0.17, 0.34);
        this._scrollBackground(this._cloudGroup01, this._cloudGroup02, offsetPos, 0.25, 0.25);

        this._lastPlayerPos = playerPos;
    },

    _scrollBackground: function(background1, background2, offsetPos, speedX, speedY) {
        let background1Pos = background1.getPosition();
        let background2Pos = background2.getPosition();

        var bg1NewPos = cc.p(background1Pos.x - offsetPos.x * speedX, background1Pos.y - offsetPos.y * speedY);
        var bg2NewPos = cc.p(background2Pos.x - offsetPos.x * speedX, background2Pos.y - offsetPos.y * speedY)

        if (background1Pos.x < background2Pos.x){
            if (background2Pos.x < cc.winSize.width / 2){
                bg1NewPos.x = background2Pos.x + background1.getContentSize().width - 10;
            }
        }
        else {
            if (background1Pos.x < cc.winSize.width / 2){
                bg2NewPos.x = background1Pos.x + background2.getContentSize().width - 10;   
            }
        }

        // bg1NewPos = cc.p(Math.round(bg1NewPos.x * cc.contentScaleFactor()) / cc.contentScaleFactor(), 
        //                  Math.round(bg1NewPos.y * cc.contentScaleFactor()) / cc.contentScaleFactor());
        // bg2NewPos = cc.p(Math.round(bg2NewPos.x * cc.contentScaleFactor()) / cc.contentScaleFactor(), 
        //                  Math.round(bg2NewPos.y * cc.contentScaleFactor()) / cc.contentScaleFactor());

        background1.setPosition(bg1NewPos);
        background2.setPosition(bg2NewPos);
    },

    _checkAndReloadMaps: function(player) {
        var newMapIndex = Math.floor(player.getPosition().x / this._mapWidth);

        if (newMapIndex == this._mapIndex)
            return;

        if (newMapIndex > 1){
            let shouldHideMapIndex = this.historyMapIndexArray[this.historyMapIndexArray.length - 3];
            this.maps[shouldHideMapIndex].setVisible(false);
            this.maps[shouldHideMapIndex].setPosition(cc.p(-3000, -3000));
            cc.log("Hide Map %d - Pos: (%d, %d)", shouldHideMapIndex, -3000, -3000);
            // Shuffle map index array
            let shuffledMapArray = shuffle(this.mapIndexArray.slice(0));

            let hasAvaiableMap = false;
            for (var i = 0; i < shuffledMapArray.length; i++){
                let index = shuffledMapArray[i].index;
                cc.log("Map %d - Pos: (%d, %d) - Visible: %d", index, this.maps[index].x, this.maps[index].y, (this.maps[index].isVisible()) ? 1 : 0);
                if (!this.maps[index].isVisible()){
                    hasAvaiableMap = true;
                    this.maps[index].setVisible(true);
                    this.maps[index].setPosition(cc.p(this._gameLayerSize.width, 0));

                    this._gameLayerSize = cc.size(this._gameLayerSize.width + this._mapWidth, this._mapHeight);
                    this.historyMapIndexArray.push(index);

                    this.addAlphabet(this.maps[index]);
                    this.addObstacles(this.maps[index]);
                    this.addBoosters(this.maps[index]);
                    break;
                }
            }
        }

        this._mapIndex = newMapIndex;
    },

    addHud: function() {
        cc.log("timeForScene: " + this._timeForSence);
        var hudLayer = new ARHudLayer(this, this._player);

        // var hudLayer = new HudLayer(this, false, this._timeForSence);
        // hudLayer.x = 0;
        // hudLayer.y = 0;

        this.addChild(hudLayer, 99);
        this._hudLayer = hudLayer;

        this._hudLayer.addSpecifyGoal();
    },

    _addButtons: function() {
        var self = this;

        // RESTART
        var btnRestart = new ccui.Button("btn-language.png", "", "", ccui.Widget.PLIST_TEXTURE);
        btnRestart.x = btnRestart.width - btnRestart.width;
        btnRestart.y = cc.winSize.height - btnRestart.height*2/3
        btnRestart.setLocalZOrder(1000);
        this.addChild(btnRestart);
        btnRestart.addClickEventListener(function() {
            self.restart();
        });

        var lbRestart = new cc.LabelBMFont("RESTART", "yellow-font-export.fnt");
        lbRestart.scale = 0.6;
        lbRestart.x = btnRestart.width/2;
        lbRestart.y = btnRestart.height/2;
        btnRestart.getRendererNormal().addChild(lbRestart);
    },

    restart: function() {

    },


    completedScene: function(text) {
        this._hudLayer.pauseClock();

        var lbText = text;
        this.createWarnLabel(lbText, null, null, cc.winSize.height/2);
        var warningLabel = this._warningLabel;
        warningLabel.runAction(cc.sequence(
            cc.callFunc(function() { 
                AnimatedEffect.create(warningLabel, "sparkles", 0.02, SPARKLE_EFFECT_FRAMES, true)
            }), 
            cc.scaleTo(3, 2).easing(cc.easeElasticOut(0.5))
        ));

        var self = this;
        this.runAction(
            cc.sequence(
                cc.delayTime(3),
                cc.callFunc(function() {
                    // if (warningLabel)
                    //     warningLabel.removeFromParent();
                    // cc.director.pause();
                    // if(CurrencyManager.getInstance().getCoin() > 10)
                    //     self.addChild(new DialogFinishAlpharacing(),10)
                    // cc.director.replaceScene(new cc.TransitionFade(1, new HomeScene(), cc.color(255, 255, 255, 255)));
                    cc.director.runScene(new HomeScene());
                })
            )
        )
    },

    _moveToNextScene: function() {
        if (this._isTestScene)
            cc.director.replaceScene(new cc.TransitionFade(1, new GameTestScene(), cc.color(255, 255, 255, 255)));
        else {
            var nextSceneName = SceneFlowController.getInstance().getNextSceneName();

            if (nextSceneName) {
                var numberScene = KVDatabase.getInstance().getInt("scene_number");
                var durationArray = JSON.parse(KVDatabase.getInstance().getString("durationsString"));
                SceneFlowController.getInstance().moveToNextScene(nextSceneName, this._inputData, durationArray[numberScene]);
            }
            else {
                User.getCurrentChild().winCurrentLevelStep();
                SceneFlowController.getInstance().clearData();
                cc.director.runScene(new MapScene());
            }
        }
    },

    _backToHome: function() {
        cc.director.replaceScene(new cc.TransitionFade(1, new MainScene(), cc.color(255, 255, 255, 255)));
    },

    createWarnLabel: function(text, object, x, y) {
        var randSchoolIdx = Math.floor(Math.random() * 4);
        font = FONT_COLOR[randSchoolIdx];

        text = text.toUpperCase();
        var warnLabel = new cc.LabelBMFont(text, font);
        var scaleTo = 1.5;
        warnLabel.setScale(scaleTo);

        warnLabel.x = x || cc.winSize.width / 2;
        warnLabel.y = y || cc.winSize.height / 2 - 100;
        this.addChild(warnLabel, 10000);

        this._warningLabel = warnLabel;
    },

    _initChallenges: function(){
        for (var i = 0; i < this._tempInputData.length; i++) {
            this._totalGoalNumber += parseInt(this._tempInputData[i].amount);
        }

        this._currentChallange = this._tempInputData.shift();
        this._tempInputData.push(this._currentChallange);
        this._hudLayer.setCurrencyType("diamond");
        this._hudLayer.setTotalGoals(this._totalGoalNumber);
        this._hudLayer.updateSpecifyGoalLabel("".concat(this._currentChallange.amount).concat("-").concat(this._currentChallange.value));
    },

    _checkForGoalAccepted: function(word) {
        if (!this._currentChallange){
            // Init
            for (var i = 0; i < this._tempInputData.length; i++) {
                this._totalGoalNumber += parseInt(this._tempInputData[i].amount);
            }

            this._currentChallange = this._tempInputData.shift();
            this._tempInputData.push(this._currentChallange);
        }

        if (this._tempInputData.length == 0 && parseInt(this._currentChallange.amount) <= this._currentEarnedNumber)
            return false;

        let returnVal = this._currentChallange.value == word;        

        if (this._currentChallange.value == word){
            AudioManager.getInstance().play(res.collect_diamond_mp3);

            this._currentEarnedNumber++;
            this._totalEarned++;
            // this._hudLayer.setProgressBarPercentage(this._totalEarned / this._totalGoalNumber);

            // this.updateProgressBar();
            if (parseInt(this._currentChallange.amount) == this._currentEarnedNumber){
                // if (this._tempInputData.length > 0){
                this._currentChallange = this._tempInputData.shift();
                this._tempInputData.push(this._currentChallange);
                this._currentEarnedNumber = 0;
                // }
                // else {
                //     // Completed game
                //     this.completedScene(localizeForWriting("you win"));
                // }
            }
        }
        else {
            AudioManager.getInstance().play(res.incorrect_word_mp3);
        }

        let leftObjects = parseInt(this._currentChallange.amount) - this._currentEarnedNumber;
        this._hudLayer.updateSpecifyGoalLabel("".concat(leftObjects).concat("-").concat(this._currentChallange.value));

        return returnVal;
    },

    checkForAlphabetCollisions: function(dt){
        for (var i = 0; i < this._alphabetObjectArray.length; i++) {
            if (this._alphabetObjectArray[i].x < this._player.x - this._mapWidth / 2){
                this.gameLayer.removeChild(this._alphabetObjectArray[i]);
                this._alphabetObjectArray.splice(i--, 1);
                continue;
            }

            let delta = cc.pSub(this._player.getPosition(), this._alphabetObjectArray[i].getPosition());

            if (this._player.hasBoostFlag(ARMagnet.getBoostFlag()) && 
                cc.pLengthSQ(delta) < 200*200) { // 50 * 50

                this._alphabetObjectArray[i].setPosition(cc.pLerp(this._player.getPosition(), this._alphabetObjectArray[i].getPosition(), 0.9));
            }

            let pRect = this._player.getCollisionBoundingBox();
            let alphaRect = cc.rect(this._alphabetObjectArray[i].x,
                this._alphabetObjectArray[i].y,
                this._alphabetObjectArray[i].getBoundingBox().width, 
                this._alphabetObjectArray[i].getBoundingBox().height );
            if (cc.rectIntersectsRect(pRect, alphaRect)) {
                let val = this._checkForGoalAccepted(this._alphabetObjectArray[i].getName());

                if (val) {
                    var addedCoin = this._player.hasBoostFlag(ARDouble.getBoostFlag()) ? 2 : 1;

                    this._hudLayer.popGold(addedCoin, cc.winSize.width/3, cc.winSize.height/3);
                    CurrencyManager.getInstance().incDiamond(addedCoin);

                    var object = new cc.LabelBMFont("+" + addedCoin.toString(), res.CustomFont_fnt);
                    object.scale = 0.5;
                    object.setPosition(this._alphabetObjectArray[i].getPosition());
                    this.gameLayer.addChild(object, AR_ADI_ZODER+1);

                    object.runAction(cc.sequence(
                        cc.spawn(
                            cc.moveBy(0.8, cc.p(0, 100)),
                            cc.fadeOut(0.8)
                        ),
                        cc.callFunc(sender => sender.removeFromParent())
                    ));
                }

                this.gameLayer.removeChild(this._alphabetObjectArray[i]);
                this._alphabetObjectArray.splice(i--, 1);
            }
            
        }
    },

    addObstacles: function(tmxMap) {
        let self = this;
        let group = this.getGroupPositions(tmxMap).filter(group => group.name == "Obstacles" )[0];

        if (group && group.posArray.length > 0) {
            group.posArray.forEach((params) => {                
                var obstacle = self._obstacleWorker.addObstacle(params);
                self.gameLayer.addChild(obstacle, AR_WORD_ZODER);
            });
        }
    }, 

    addBoosters: function(tmxMap) {
        let self = this;
        let group = this.getGroupPositions(tmxMap).filter(group => group.name == "Boosters" )[0];

        if (group && group.posArray.length > 0) {
            group.posArray.forEach((params) => {                
                var obstacle = self._boosterWorker.addBooster(params);
                self.gameLayer.addChild(obstacle, AR_WORD_ZODER);
            });
        }
    },

    addAlphabet: function(tmxMap) {
        let posArray = this.getGroupPositions(tmxMap).filter(group => group.name.startsWith("alphaPosition"));
        let inputArray = this._inputData.slice(0);
        let groupIndex = 0;
        let self = this;

        // cc.log("This.Input Length: %d, That length: %d", this._inputData.length, inputArray.length);

        // this._alphabetObjectArray = [];

        posArray = shuffle(posArray);
        inputArray = shuffle(inputArray);
        
        let randomGroupNumber = Utils.getRandomInt(2, posArray.length);

        for (var i = 0; i < randomGroupNumber; i++) {
            let group = posArray.pop();
            let randomInputIndex = Utils.getRandomInt(0, self._inputData.length);
            let alphabet = self._inputData[randomInputIndex];
            // Set 0.8 probability for current alphabet
            if (Utils.getRandomInt(0, 10) < 6){
                alphabet = self._currentChallange;
            }

            group.posArray.forEach((pos) => {
                var object = new cc.LabelBMFont(alphabet.value, res.CustomFont_fnt);
                object.setScale(0.8);
                object.x = pos.x;
                object.y = pos.y;
                object.setName(alphabet.value);
                self.gameLayer.addChild(object, AR_WORD_ZODER);
                self._alphabetObjectArray.push(object);
            });
        }
    },

    getGroupPositions: function(tmxMap){
        var posArray = [];
        let _csf = cc.director.getContentScaleFactor();

        var self = this;
        tmxMap.getObjectGroups().forEach(function(group) {
            var groupPos = {
                name: group.getGroupName(),
                posArray: []
            };

            group.getObjects().forEach(function(obj) {
                var keys = Object.keys(obj);
                var copy = {};

                keys.forEach(k => copy[k] = obj[k]);

                copy.x = (copy.x + self._gameLayerSize.width - self._mapWidth) * _csf;
                copy.y = copy.y * _csf;

                groupPos.posArray.push(copy); 
            });

            posArray.push(groupPos);
        });
        return posArray;
    },

    onTouchBegan: function(touch, event) {
        var touchedPos = touch.getLocation();
        
        this._player.setMightJump(true);

        return true;
    },

    onTouchMoved: function(touch, event) {
        
    },

    onTouchEnded: function (touch, event) {
        var touchedPos = touch.getLocation();
        
        this._player.setMightJump(false);
    },

    tileCoordForPosition: function(position) {
        let x = Math.floor(position.x / this._tileSize.width);
        let levelHeightInPixels = this._gameLayerSize.height;
        let y = Math.floor((levelHeightInPixels - position.y) / this._tileSize.height);
        return cc.p(x, y);
    },

    tileRectFromTileCoords: function(tileCoords, mapIndex) {
        let levelHeightInPixels = this._gameLayerSize.height;
        let origin = cc.p(tileCoords.x * this._tileSize.width + mapIndex * this._mapWidth, levelHeightInPixels - ((tileCoords.y + 1) * this._tileSize.height));
        return cc.rect(origin.x, origin.y, this._tileSize.width, this._tileSize.height);
    },

    getSurroundingTilesAtPosition: function(position, layer, mapIndex) {
        let plPos = this.tileCoordForPosition(cc.p(position.x % this._mapWidth, position.y));
        // cc.log("position: %d, %d -> plPos: %d, %d", position.x, position.y, plPos.x, plPos.y);
    
        let gids = [];

        for (var j = 0; j < 9; j++) {
            let i = j;
            if (j == 4) {
                continue;
            } else if (j > 4) {
                i = j - 1;
            }

            let index = i;
            if (i == 0) {
                index = 6;
            } else if (i == 2) {
                index = 3
            } else if (i == 3) {
                index = 4
            } else if (i == 4) {
                index = 0
            } else if (i == 5) {
                index = 2
            } else if (i == 6) {
                index = 5
            } else if (i == 7) {
                index = 7
            } 

            let indexToCalculateRC = index
            if (index >= 4) {
                indexToCalculateRC = index + 1;
            }
            let c = indexToCalculateRC % 3;
            let r = Math.floor(indexToCalculateRC / 3);
            let tilePos = cc.p(plPos.x + (c - 1), plPos.y + (r - 1));
            
            if (tilePos.x > AR_MAP_HORIZONTAL_TILES - 1)
                tilePos.x = AR_MAP_HORIZONTAL_TILES - 1;
            if (tilePos.x < 0)
                tilePos.x = 0;

            if (tilePos.y > AR_MAP_VERTICLE_TILES - 1)
                tilePos.y = AR_MAP_VERTICLE_TILES - 1;
            if (tilePos.y < 0)
                tilePos.y = 0;

            let tgid = layer.getTileGIDAt(tilePos);
            
            let tileRect = this.tileRectFromTileCoords(tilePos, mapIndex);
            
            let tileDict = {gid: tgid, x: tileRect.x, y: tileRect.y, tilePos: tilePos, c: c, r: r};

            // cc.log("gid = %d -> tilePos.x = %d, tilePos.y = %d, index = %d", tgid, tilePos.x, tilePos.y, index);

            gids.push(tileDict);
        }

        return gids;
    },

    drawRectWithLabel: function(from, to, fillColor, lineSize, lineColor, label) {
        if (!ENABLE_DEBUG_DRAW)
            return;

        this._playerBorder.drawRect(from, to, fillColor, lineSize, lineColor);

        var lbl = new cc.LabelBMFont(label+"", "hud-font.fnt");
        lbl.color = cc.color("#ffd902");
        lbl.x = (to.x - from.x)/2 + from.x;
        lbl.y = (to.y - from.y)/2 + from.y;

        this._playerBorder.addChild(lbl);
    },

    drawRectPlatforms: function(tiles) {
        if (!ENABLE_DEBUG_DRAW)
            return;

        this._tileBorder.clear();

        for (var i = 0; i < tiles.length; i++) {
            var tile = tiles[i];
            let tileRect = cc.rect(tile.x, tile.y, this._tileSize.width, this._tileSize.width);

            this._tileBorder.drawRect(tileRect, cc.p(tileRect.x + tileRect.width, tileRect.y + tileRect.height), cc.color(255,0,100,0), 3, cc.color(33, 33, 33, 100));
        }

        // var ls = this._landLayer.getLayerSize();
        // var offsetPos = this._tmxMap.getPosition();
        // for (var y = 0; y < ls.height; y++) {
        //     for (var x = 0; x < ls.width; x++) {
        //         let tile = this._landLayer.getTileAt(cc.p(x, y));
        //         if (tile){
        //             let tileRect = cc.rect(tile.x + offsetPos.x, tile.y + offsetPos.y, this._tileSize.width, this._tileSize.height);
        //             this._tileBorder.drawRect(tileRect, cc.p(tileRect.x + tileRect.width 
        //                 ,tileRect.y + tileRect.height), cc.color(255,0,100,0), 3, cc.color(33, 33, 33, 100));
        //         }
        //     }
        // }
    },

    checkForAndResolveCollisions: function(p) {
        // cc.log("MapIndex %d, MapWidth %d, layersLength %d", this._mapIndex, this._mapWidth, this.layers.length);
        this._playerBorder.clear();
        this._playerBorder.removeAllChildren();

        var pRect = p.getCollisionBoundingBox();
        // cc.log("RECT: " + JSON.stringify(pRect));
        this.drawRectWithLabel(cc.p(pRect.x, pRect.y),
            cc.p(pRect.x + pRect.width, pRect.y + pRect.height),
            cc.color(255,0,100,0), 3, cc.color(0, 100, 100,255),
            "[]");

        // this.drawRectPlatforms();
        
        // Player pass through 2nd map => create a new map, push new map,layer => remove old map, layer
        // => current map, layer index will be 1
        // let layerIndex = (this._mapIndex > 1) ? 1 : this._mapIndex; 
        let layerIndex = 0;
        for (var i = 0; i < this.maps.length; i++){
            // cc.log("Player (%d, %d) - MapPos (%d, %d)", p.x, p.y, this.maps[i].x, this.maps[i].y);
            if (this.maps[i].isVisible()){
                if (p.x >= this.maps[i].x && p.x < (this.maps[i].x + this._mapWidth)){
                    layerIndex = i;
                    break;
                }
            }
        }

        console.log("Layer Index => " + layerIndex);

        var tiles = this.getSurroundingTilesAtPosition(p.getPosition(), this.layers[layerIndex], this._mapIndex);

        // this.drawRectPlatforms(tiles);

        p.setOnGround(false);
        p.setOnRightCollision(false);
        for (var i = 0; i < tiles.length; i++) {
            var dic = tiles[i];

            var gid = dic.gid;
            if (gid) {
                let tileRect = cc.rect(dic.x, dic.y + this._tileSize.height/2, this._tileSize.width, this._tileSize.height/2); 
                if (cc.rectIntersectsRect(pRect, tileRect)) {               

                    this.drawRectWithLabel(cc.p(dic.x, dic.y),
                        cc.p(dic.x+this._tileSize.width, dic.y+this._tileSize.height),
                        cc.color(255,0,100,0), 3, cc.color(255, 0, 0,255),
                        i+1);

                    // continue;

                    let intersection = cc.rectIntersection(pRect, tileRect);

                    let desiredPosition = p.getDesiredPosition();
                    let velocity = p.getVelocity();
                    if (i == 0) {
                        // cc.log("tile is directly below player. i = %d", i + 1);
                        if (!p.onGround()){
                            p.setDesiredPosition( cc.p(desiredPosition.x, desiredPosition.y + intersection.height));
                            p.setVelocity(cc.p(velocity.x, 0.0));
                            p.setOnGround(true);
                            p.runAnimation();
                        }
                    } else if (i == 1) {
                        // cc.log("tile is directly above player");
                        p.setDesiredPosition(cc.p(desiredPosition.x, desiredPosition.y - intersection.height));
                        p.setVelocity(cc.p(velocity.x, 0.0));
                    } else if (i == 2) {
                        // cc.log("tile is left of player. i = %d", i + 1);
                        p.setDesiredPosition(cc.p(desiredPosition.x + intersection.width, desiredPosition.y));
                    } else if (i == 3) {
                        // cc.log("tile is right of player. i = %d", i + 1);
                        p.setDesiredPosition(cc.p(desiredPosition.x - intersection.width, desiredPosition.y));
                        p.setOnRightCollision(true);
                        // p.setVelocity(cc.p(0.0, 0.0));
                    } else {
                        
                        if (intersection.width > intersection.height) {
                            // cc.log("tile is diagonal, but resolving collision vertially. i = %d", i + 1);
                            p.setVelocity(cc.p(velocity.x, 0.0)); 
                            let resolutionHeight;
                            if (i > 5) {
                                resolutionHeight = intersection.height;
                                // p.setOnGround(true);
                            } else {
                                resolutionHeight = -intersection.height;
                            }
                            // p.setDesiredPosition(cc.p(desiredPosition.x, desiredPosition.y + resolutionHeight ));
                            
                        } else {
                            // cc.log("tile is on right or left side. i = %d", i + 1);
                            let resolutionWidth;
                            if (i == 6 || i == 4 || !p.onGround()) {
                                resolutionWidth = intersection.width;
                            } else {
                                resolutionWidth = -intersection.width;
                            }
                            // p.setDesiredPosition(cc.p(desiredPosition.x , desiredPosition.y + resolutionWidth));
                        } 
                    } 

                    // cc.log("Desired Position (%d, %d)", this._player.getDesiredPosition().x, this._player.getDesiredPosition().y);
                }
                else {
                    this.drawRectWithLabel(cc.p(dic.x, dic.y),
                        cc.p(dic.x+this._tileSize.width, dic.y+this._tileSize.height),
                        cc.color(255,0,100,0), 3, cc.color(0, 0, 255,255),
                        i+1);
                }
            }
            else {
                this.drawRectWithLabel(cc.p(dic.x, dic.y),
                    cc.p(dic.x+this._tileSize.width, dic.y+this._tileSize.height),
                    cc.color(255,0,100,0), 3, cc.color(33, 33, 33,255),
                    i+1);
            }
        }
        // cc.log("yo, onground: ", p.onGround());
        // cc.log("ARLayer desiredPosition => (%d, %d)", p.getDesiredPosition().x, p.getDesiredPosition().y);
        p.setPosition(p.getDesiredPosition());
    },

    setViewpointCenter: function(position) {
        let winSize = cc.winSize;

        let x = Math.max(position.x, winSize.width / 2);
        let y = Math.max(position.y, winSize.height / 2);
        x = Math.min(x, (this._gameLayerSize.width * this._tileSize.width) 
                - winSize.width / 2);
        y = Math.min(y, (this._gameLayerSize.height * this._tileSize.height) 
                - winSize.height/2);
        let actualPosition = cc.p(x, y);
        
        let centerOfView = cc.p(winSize.width/3, winSize.height/3);
        let viewPoint = cc.pSub(centerOfView, actualPosition);

        // let contentScaleFactor = cc.contentScaleFactor();
        // this.gameLayer.setPosition(cc.p(
        //     Math.round(viewPoint.x * contentScaleFactor) / contentScaleFactor, 
        //     Math.round(viewPoint.y * contentScaleFactor) / contentScaleFactor)); 

        var delta = cc.pSub(this.gameLayer.getPosition(), viewPoint);
        this.gameLayer.setPosition(viewPoint);

        this.arEffectLayer.y = this.gameLayer.y;

        return delta;
    },

    updateProgressBar: function() {
        var percent = this._totalEarned / this._totalGoalNumber;

        this._hudLayer.setCurrentGoals(this._totalEarned);
        this._hudLayer.updateTotalGoalsLabel();
        this._hudLayer.setProgressBarPercentage(percent);
    },
});

var AlphaRacingScene = cc.Scene.extend({
    ctor: function(inputData, option) {
        this._super();
        this.name = "alpha-racing";
        var layer = new AlphaRacingLayer(inputData,option);
        this.addChild(layer);
    }
});