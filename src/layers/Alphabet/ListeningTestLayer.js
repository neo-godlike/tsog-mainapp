var ListeningTestLayer = TestLayer.extend({
    _nameNode: null,
    _objectNodes: [],
    _nameIdx: 0,
    _curSoundName: "",

    _nextSceneName: null,
    _oldSceneName: null,

    _objCenter: null,
    _objSoundPath: null,

    _objSoundIsPlaying: false,

    _tutorial: null,
    _data: null,
    _blockTouch: false,
    _addedObject: [],
    _keyObject: [],
    _currentKeyIndex: 0,

    _totalGoals: 0,

    ctor: function(data, duration) {
        this._super();
        // cc.log("data : " + data);

        this._oldSceneName = SceneFlowController.getInstance().getPreviousSceneName();
        // cc.log("data.length :  " + data.length);
        
        this._fetchObjectData(data);
        this._duration = duration;
        this._addedObject = [];

        this._objCenter = cc.p(cc.winSize.width * 0.65, cc.winSize.height/2);

        this._addAdiDog();
        cc.eventManager.addListener({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,
            swallowTouches: true,
            onTouchBegan: this.onTouchBegan.bind(this)
        }, this);
    },
    _addHudLayer: function(){
        this._super(this._duration);
    },

    onEnter: function() {
        this._super();
        var self = this;
        this._eventTimeUp = cc.EventListener.create({
            event: cc.EventListener.CUSTOM,
            eventName: "event_logout",
            callback: function(event){
                jsb.AudioEngine.stop(self._soundEffect);
            }
        });
        cc.eventManager.addListener(this._eventTimeUp, 1);
    },

    onEnterTransitionDidFinish: function() {
        this._super();
        this.playBeginSound();
        this.runAction(cc.sequence(cc.delayTime(0.1),cc.callFunc(function() {Utils.startCountDownTimePlayed();})))
        this._hudLayer.setTotalGoals(this._totalGoals);
    },

    playBeginSound: function() {
        var beginSoundPath = "res/sounds/sentences/" + localize("begin-listening") + ".mp3";
        var self = this;
        this._blockTouch = true;
        this._adiDog.adiTalk();
        
        this.playBackGroundMusic();
        this._super(beginSoundPath, function() {
            // cc.log("callback after play beginSoundPath");
            self._blockTouch = false;
            if (self._adiDog) {
                self._adiDog.adiIdling();
                self._displayCurrentName();
                self._showObjects();
            }
        });
    },

    onTouchBegan: function(touch, event) {
        if (this._blockTouch)
            return false;

        if (this._ended) {
            // cc.log("ended");
            return false;
        }

        var self = this;
        var touchedPos = touch.getLocation();

        if (cc.rectContainsPoint(this._adiDog.getBoundingBox(), touchedPos) || 
            cc.rectContainsPoint(this._nameNode.getBoundingBox(), touchedPos)) {
            this._playObjSound();
            return true;
        }

        this._objectNodes.forEach(function(obj) {
            // cc.log("obj size: %f, %f", obj.width, obj.height);
            if (cc.rectContainsPoint(obj.getBoundingBox(), touchedPos)) {
                var currentKeyNames;
                if (self._keyObject.length>0)
                    currentKeyNames = self._keyObject[self._currentKeyIndex];
                else
                    currentKeyNames = self._names[self._nameIdx];
                if (obj.name == currentKeyNames) {
                    self._celebrateCorrectObj(obj);
                    self._touchCounting ++;
                    self.updateProgressBar();
                    self._currentKeyIndex++;

                    self.popGold(obj.getPosition());
                } else {
                    self._incorrectAction(obj);
                }
            }
        });

        return true;
    },

    updateProgressBar: function() {
        // cc.log("ListeningTestLayer - updateProgressBar");
        var percent = this._touchCounting / this._totalGoals;
        this.setHUDProgressBarPercentage(percent);
        this.setHUDCurrentGoals(this._touchCounting);

        this._super();
    },

    _addAdiDog: function() {
        this._adiDog = new AdiDogNode();
        this._adiDog.scale = Utils.screenRatioTo43() * 0.6;
        this._adiDog.setPosition(cc.p(cc.winSize.width * 0.15, cc.winSize.height/3));
        this.addChild(this._adiDog);
    },

    _addCountDownClock: function() {
        var self = this;
        var clockInitTime = GAME_CONFIG.listeningTestTime || UPDATED_CONFIG.listeningTestTime;
        this._clock = new Clock(clockInitTime, function(){
            self.doCompletedScene();
        });
        this._clock.setIsClockInTalkingAdi(true);
        this._clock.visible = true;
        this._clock.x = cc.winSize.width - 60;
        this._clock.y = 100;
        this.addChild(this._clock, 99);

    },

    _showObjects: function() {
        if(this._tutorial)
            this._tutorial.removeFromParent();
        this._objectNodes.forEach(function(obj) { obj.removeFromParent(); });
        this._objectNodes = [];

        var self = this;
        var shownObjNames = [];

        var remainingObj = this._names.slice(0);
        var d = this.getStoryTimeForListeningData();
        // cc.log("D ->>>>" + JSON.stringify(d));
        // cc.log("this._currentKeyIndex: " + this._currentKeyIndex);
        // cc.log("remainingObj: " + remainingObj);
        var currentKeyNames;
        if (this._keyObject.length > 0) {
            currentKeyNames = this._keyObject[this._currentKeyIndex]
        } else
            currentKeyNames = this._names[this._nameIdx];

        shownObjNames.push(currentKeyNames);
        
        remainingObj.splice(this._nameIdx, 1);
        
        // cc.log("remainingObj: " + JSON.stringify(remainingObj));
        var self = this;
        if (this._keyObject.length > 0) {
            for (var i = 0; i < remainingObj.length; i++) {
                if (shownObjNames.length >= 3) {
                    break;
                }
                var name = remainingObj[i];
                
                for (var j = 0; j < this._keyObject.length; j++) {
                    var key = this._keyObject[j];
                    if (name !== currentKeyNames && name !== key) {
                        // cc.log("break;");
                        shownObjNames.push(name);
                        break;
                    }
                }
            }
        } else {
            shownObjNames.push(remainingObj[0]);
            shownObjNames.push(remainingObj[1]);
        }

        if(d)
            shownObjNames = d.data[this._currentKeyIndex];

        // cc.log("shownObjNames: " + shownObjNames);

        if (shownObjNames[2] == null || shownObjNames[2] == undefined) {
            if (!this._addedObject.length) {
                var self = this;
                data = this._data;
                if(typeof(this._data) != "object")
                    data = JSON.parse(this._data);
                var currentMainObjectId = data.map(function(obj) {
                    // cc.log("shownObjNames null case value: " + obj.value);
                    if (obj && obj.value == self._names[self._nameIdx])
                        return obj.id;
                });
                var rdmObjectName = GameObject.getInstance().getRandomAnObjectDiffWithId(currentMainObjectId[0]);
                shownObjNames[2] = rdmObjectName;
                this._addedObject.push(rdmObjectName);
            } else
                shownObjNames[2] = this._addedObject[0];
        }
        // cc.log("shownObjNames: " + JSON.stringify(shownObjNames));
        shownObjNames = shuffle(shownObjNames);
        // if (d)
        //     shownObjNames = shuffle(d.data[this.storytimeCurrentDataIndex]);

        // cc.log("shownObjNames: " + shownObjNames);
        // cc.log("d: " + d);
        var secondNumberImageName;
        var numberObjectShow = 3;
        // if(shownObjNames.length < 3)
        //     numberObjectShow = shownObjNames.length;
        for (var i = 0; i < numberObjectShow; i++) {
            // cc.log("i -> " + i);
            var isNumber = false;
            var spritePath = "objects/" + shownObjNames[i].toLowerCase() + ".png";
            if (!jsb.fileUtils.isFileExist("res/SD/" + spritePath)) {
                spritePath = "animals/" + shownObjNames[i].toLowerCase() + ".png";
                if (!jsb.fileUtils.isFileExist("res/SD/" + spritePath)) {
                    // handle case number has two digit
                    // number case
                    var number = parseInt(shownObjNames[i]);
                    // cc.log("number: " + number);
                    if (isNaN(number)) {
                        if (shownObjNames[i].charAt(0) == shownObjNames[i].toLowerCase()) {
                            // cc.log("shownObjNames[i]: " + shownObjNames[i]);
                            spritePath = "#" + shownObjNames[i].toUpperCase() + "_lowercase" + ".png";
                        }
                        else
                            spritePath = "#" + shownObjNames[i] + ".png";
                    } else
                        isNumber = true;
                }
                if (shownObjNames[i].indexOf("color") > -1) {
                    // color case
                    var color = shownObjNames[i].toLowerCase().substr(6);
                    spritePath = "#btn_" + color + ".png";   
                }
            }

            // cc.log("sprite path: " + spritePath);
            var mostTopY = this._nameNode.y - this._nameNode.height/2 - 20;

            var sprite;
            if (isNumber)
                sprite = new cc.LabelBMFont(shownObjNames[i], res.CustomFont_fnt);
            else
                sprite = new cc.Sprite(spritePath);

            sprite.name = shownObjNames[i];
            sprite.scale = Math.min(200 / sprite.width, 350 / sprite.height) * Utils.screenRatioTo43();
            sprite.x = this._objCenter.x + (i-1) * 200 * Utils.screenRatioTo43();
            sprite.y = this._objCenter.y;

            if (cc.rectGetMaxY(sprite.getBoundingBox()) > mostTopY) {
                sprite.scale = (mostTopY - this._objCenter.y) / sprite.height * 2;
            }

            this._objectNodes.push(sprite);
            this.addChild(sprite);

            this._animateObject(sprite, i);
            this._animateObjectIn(sprite, i);

            if (sprite.name == this._names[this._nameIdx]) {
                sprite.runAction(cc.sequence(
                    cc.delayTime(GAME_CONFIG.listeningTestWaitToShowHand || UPDATED_CONFIG.listeningTestWaitToShowHand),
                    cc.callFunc(function(sender) {
                        // cc.log("set finger tutorial");
                        if(self._tutorial)
                            self._tutorial.removeFromParent();
                        self._tutorial = new TutorialLayer([sender]);
                        self.addChild(self._tutorial, 999);
                    }),
                    cc.delayTime(GAME_CONFIG.listeningTestWaitToShowNextObj || UPDATED_CONFIG.listeningTestWaitToShowNextObj),
                    cc.callFunc(function(sender) {
                        if (self._tutorial) {
                            self._tutorial.removeFromParent();
                            self._tutorial = null;
                        }

                        self._nameIdx++;
                        if (self._nameIdx >= self._names.length) {
                            self.doCompletedScene();
                        } else {
                            self._displayCurrentName();
                            self._showObjects();
                        }
                    })
                ));
            }
        }
    },

    _displayCurrentName: function() {
        var self = this;
        this._objSoundPath = "";

        if (this._nameNode)
            this._nameNode.removeFromParent();

        var text = this._names[this._nameIdx];
        if (this._keyObject.length > 0)
            text = this._keyObject[this._currentKeyIndex];
        if (text.indexOf("color") > -1 || text.indexOf("btn") > -1) {
            text = text.substr(text.indexOf("_") + 1, text.length-1);
            this._objSoundPath = "res/sounds/colors/" + localize(text) + ".mp3";
        }
        text = (currentLanguage == "en") ? text : localizeForWriting(text);
        // cc.log("text ->>>" + text);
        this._nameNode = new cc.LabelBMFont(text, "hud-font.fnt");
        this._nameNode.x = this._objCenter.x
        if(this._nameNode.width > cc.winSize.width/2)
            this._nameNode.x = cc.winSize.width/2;
        this._nameNode.y = cc.winSize.height - 150;
        this._nameNode.scale = 1.5;
        this.addChild(this._nameNode);

        // cc.log("this._names: " + this._names);
        // cc.log("this._names: " + this._names[this._nameIdx]);
        var objName = this._names[this._nameIdx].toLowerCase();
        var d = this.getStoryTimeForListeningData();
        var bannerString;
        if (d) {
            this.storytimeCurrentDataIndex++;
            objName = d.voice[this.storytimeCurrentDataIndex];
            this._nameNode.setString((STORYTIME_VOICE_FOR_LISTENING[currentLanguage])[objName]);
            this._nameNode.scale = cc.winSize.width/2 / this._nameNode.width;
            objName = this._keyObject[this.storytimeCurrentDataIndex];
        }
            
        objName = localize(objName);
        if (!jsb.fileUtils.isFileExist(this._objSoundPath))
            this._objSoundPath = "res/sounds/words/" + objName + ".mp3";
        if (!jsb.fileUtils.isFileExist(this._objSoundPath))
            this._objSoundPath = "res/sounds/numbers/" + objName + ".mp3";
        if (!jsb.fileUtils.isFileExist(this._objSoundPath))
            this._objSoundPath = "res/sounds/alphabets/" + objName + ".mp3";
        if (!jsb.fileUtils.isFileExist(this._objSoundPath))
            this._objSoundPath = "res/sounds/shapes/" + objName + ".mp3";;
        if (!jsb.fileUtils.isFileExist(this._objSoundPath))
            this._objSoundPath = "";

        cc.log(this._objSoundPath);
        this.runAction(cc.sequence(
            cc.delayTime(ANIMATE_DELAY_TIME * 3 + 0.5),
            cc.callFunc(function() {
                self._playObjSound();
            }))); 
    },

    _playObjSound: function() {
        var self = this;
        cc.log("this._objSoundPath: " + self._objSoundPath);
        if (self._objSoundIsPlaying)
            return;

        self._objSoundIsPlaying = true;
        self._adiDog.adiTalk();
        if (self._objSoundPath) {
            self._soundEffect = jsb.AudioEngine.play2d(self._objSoundPath);
            jsb.AudioEngine.setFinishCallback(self._soundEffect, function(audioId, audioPath) {
                if (!self._adiDog)
                    return;

                self._adiDog.adiIdling();
                self._objSoundIsPlaying = false;
            });
        } else 
            self._objSoundIsPlaying = false;
        
    },

    _animateObjectIn: function(object, delay) {
        // cc.log("_animateObjectIn: ");
        var oldScale = object.scale;
        object.scale = 0;
        var self = this;
        object.runAction(
            cc.sequence(
                cc.delayTime(delay * ANIMATE_DELAY_TIME),
                cc.callFunc(function() {
                    jsb.AudioEngine.play2d("sounds/smoke.mp3"),
                    AnimatedEffect.create(object, "smoke", SMOKE_EFFECT_DELAY, SMOKE_EFFECT_FRAMES, false);
                }),
                cc.scaleTo(0.7, 1 * oldScale).easing(cc.easeElasticOut(0.9))
            )
        );
    },

    _animateObject: function(obj, delay) {
        // cc.log("_animateObject");
        var oldScale = obj.scale;
        obj.runAction(cc.sequence(
            cc.delayTime(3 + delay * ANIMATE_DELAY_TIME * 1.5),
            cc.callFunc(function() {
                obj.runAction(cc.repeatForever(cc.sequence(
                    cc.scaleTo(0.1, 0.7 * oldScale),
                    cc.scaleTo(0.3, 1.05 * oldScale),
                    cc.scaleTo(0.1, 1 * oldScale),
                    cc.delayTime(5)
                )))
            })
        ));     
    },

    _celebrateCorrectObj: function(correctedObj) {
        var self = this;
        self._blockTouch = true;
        this._nameIdx++;

        if (this._tutorial) {
            this._tutorial.removeFromParent();
            this._tutorial = null;
        }
        // cc.log("listeningTest_ _celebrateCorrectObj correctedObj.name: " + correctedObj.name);
        SegmentHelper.track(SEGMENT.TOUCH_TEST,
            {
                obj_name: correctedObj.name,
                correct: "true"
            });


        var effect = AnimatedEffect.create(correctedObj, "sparkles", SPARKLE_EFFECT_DELAY, SPARKLE_EFFECT_FRAMES, true);
        effect.scale = 3;

        this._correctAction();
        this._objectNodes.forEach(function(obj) {
            if (obj == correctedObj) {

                var targetPosY = Math.min(self._objCenter.y, self._nameNode.y - self._nameNode.height/2 - obj.height/2 * obj.scale * 1.5 - 20);
                // cc.log("targetPosY: " + targetPosY);
                // cc.log("self._objCenter.y: " + self._objCenter.y);
                obj.stopAllActions();
                obj.setLocalZOrder(10);
                obj.runAction(cc.sequence(
                    cc.spawn(
                        cc.moveTo(0.5, cc.p(self._objCenter.x, targetPosY)),
                        cc.scaleTo(0.5, obj.scale * 1.5)
                    ),
                    // cc.delayTime(0.5),
                    cc.delayTime(2.0),
                    cc.callFunc(function() {
                        self._blockTouch = false;
                        if (self._nameIdx >= self._names.length) {
                            self.doCompletedScene();
                        } else if (self._keyObject.length > 0 && self._currentKeyIndex >= self._keyObject.length) {
                            self.doCompletedScene();
                        } else {
                            self._displayCurrentName();
                            self._showObjects();
                        }
                    })
                ));
            } else {
                // cc.log("fadeOut incorrectedObj");
                obj.runAction(cc.fadeOut(0.5));
            }
        });
    },

    _correctAction: function() {
        var self = this;
        jsb.AudioEngine.play2d(res.Succeed_sfx);
        this.runAction(cc.sequence(
            cc.callFunc(function() {
                self._adiDog.adiJump();
            }),
            cc.delayTime(1),
            cc.callFunc(function() {
                self._adiDog.adiHifi();
            }),
            cc.delayTime(2),
            cc.callFunc(function() {
                self._adiDog.adiIdling();
            })
        ));
    },

    _incorrectAction: function(obj) {
        var self = this;
        AudioManager.getInstance().play(res.incorrect_word_mp3);
        this._adiDog.adiShakeHead();
        // cc.log("listeningTest_ _celebrateCorrectObj incorrectedObj.name: " + obj.name);
        SegmentHelper.track(SEGMENT.TOUCH_TEST,
            {
                obj_name: obj.name,
                correct: "false"
            });

        this.runAction(
            cc.sequence(
                cc.delayTime(4),
                cc.callFunc(function() {
                    self._adiDog.adiIdling();
                })        
            )
        );

        ConfigStore.getInstance().setBringBackObj(
            this._oldSceneName == "RoomScene" ? BEDROOM_ID : FOREST_ID, 
            this._names[this._nameIdx], 
            (this._oldSceneName == "RoomScene" ? Global.NumberRoomPlayed : Global.NumberForestPlayed)-1);
    },

    _fetchObjectData: function(data) {
        var dataForWriting = data;
        cc.log("LISTENING data before map \t \t " + JSON.stringify(data));        
        this._data = data;
        this._keyObject = [];
        if(typeof(data) != "object")
            data = JSON.parse(data);

        if (data && data.option) {
            this._keyObject = data.key;
            data = data.data;
            this._data = data;
        }
        var storyTimeData = this.getStoryTimeForListeningData();
        if (storyTimeData)
            this._keyObject = storyTimeData.key;

        // cc.log("_fetchObjectData data: " + data);
        if (data)
            this._names = data.map(function(id) {
                var o = GameObject.getInstance().findById(id);
                if (o[0])
                    return o[0].value;
                else
                    return id;
            });
        else
            this._data = [];
        var names = [];
        if(currentLanguage == "sw"){
            for (var i = 0; i < this._names.length; i ++){
                if(this._names[i] != "Q" && this._names[i] != "q" && this._names[i] != "X" && this._names[i] != "x" )
                    names.push(this._names[i]);
            } ;
            this._names = names;
        };
        this._totalGoals = (this._keyObject.length > 0) ? this._keyObject.length  : this._names.length;
        cc.log("listening names after map: " + JSON.stringify(this._names));
        // if (this._keyObject.length > 0)
        //     this.setData(this._keyObject);

        this._data = data;
    },

    onExit: function () {
        this.removeStoryTimeForListeningData();
        cc.eventManager.removeListener(this._eventTimeUp);
        this.removeCardGameData();

        this._super();
    },
    
});

var ListeningTestScene = cc.Scene.extend({
    ctor: function(data, duration) {
        this._super();
        // cc.log("listening: " + duration);
        var layer = new ListeningTestLayer(data, duration);
        this.addChild(layer);
    }
});