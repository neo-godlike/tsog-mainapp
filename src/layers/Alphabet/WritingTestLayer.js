var RENDER_TEXTURE_WIDTH = 320;
var RENDER_TEXTURE_HEIGHT = 320;

var CHAR_SPACE = 10;
var MAX_AVAILABLE_WIDTH = 850;

var WritingTestLayer = TestLayer.extend({
    _writingWords: null,

    _characterNodes: [],
    _finger: null,
    _wordScale: 1,

    _currentCharConfig: null,
    _baseRender: null,
    _tmpRender: null,
    _emptyFillCharacter: null,
    _dashedLine: null,

    _nameIdx: -1,
    _charIdx: -1,
    _pathIdx: -1,

    _writeFailCount: 0,

    _blockTouch: false,

    _nextSceneName: null,
    _oldSceneName: null,
    _data: null,

    _currentChar: "",

    ctor: function(data, oldSceneName, isTestScene, timeForScene) {
        this._super();

        this._setIsTestScene(isTestScene);
        // var obj = GameObject.getInstance().findById("hat");
        // cc.log("obj -> " + JSON.stringify(obj));
        // cc.log("data: " + JSON.stringify(data));
        // cc.log("oldSceneName: " + oldSceneName);
        cc.log("WritingTestLayer ctor");
        // if(this.getCardGameData())
        //     data = this.getCardGameData();
        this._fetchObjectData(data);
        this._duration = timeForScene;
        // this._names = data.map(function(obj) {
        //     if (obj !== null && (typeof obj === 'object'))
        //         return obj.name.toUpperCase();
        //     else {
        //         // cc.log(obj);
        //         var o = GameObject.getInstance().findById(obj);
        //         return o[0].value.toUpperCase();
        //     }
        // });
        // cc.log(JSON.stringify(this._names));
        // this._oldSceneName = oldSceneName;
        this._nameIdx = this._charIdx = this._pathIdx = 0;
        cc.log("CardgameWriting: " + JSON.stringify(this.getCardGameData()));
        
        // this._writingWords = this._names.map(function(obj) {
        //     cc.log(obj);
        //     return WRITING_TEST_CONFIG[obj.toLowerCase()].toUpperCase();
        // });

        // cc.log(JSON.stringify(this._writingWords));

        // this._displayCurrentName();
        this._addAdiDog();
        this._displayWord();
        this._addRenderTextures();

        cc.eventManager.addListener({
                event: cc.EventListener.TOUCH_ONE_BY_ONE,
                swallowTouches: true,
                onTouchBegan: this.onTouchBegan.bind(this),
                onTouchMoved: this.onTouchMoved.bind(this),
                onTouchEnded: this.onTouchEnded.bind(this)
        }, this);
    },
    _addHudLayer: function(){
        this._super(this._duration);
    },

    onEnterTransitionDidFinish: function() {
        this._super();
        this.playBeginSound();
        this.runAction(cc.sequence(cc.delayTime(0.1),cc.callFunc(function() {Utils.startCountDownTimePlayed();})))
        this._hudLayer.setTotalGoals(this._names.length);
    },

    playBeginSound: function() {
        var self = this;
        this._blockTouch = true;
        this._adiDog.adiTalk();
        this.playBackGroundMusic();
        var count = KVDatabase.getInstance().getInt("timesPlaySound",0);
        if(count >= 3)
            count = 0;
        
        if(count == 0) {
            var beginSoundPath = "res/sounds/sentences/" + localize("begin-writing") + ".mp3";
            this._super(beginSoundPath, function() {
                self._blockTouch = false;
                if (!self._adiDog)
                    return;

                self._adiDog.adiIdling();
                self._moveToNextCharacter();
            });
        }
        else {
            self._blockTouch = false;
            if (!self._adiDog)
                return;

            self._adiDog.adiIdling();
            self._moveToNextCharacter();
        };
        count = count + 1;
        KVDatabase.getInstance().set("timesPlaySound",count)
    },

    onTouchBegan: function(touch, event) {
        if (this._blockTouch)
            return false;

        this._finger.stopAllActions();
        this._finger.opacity = 0;
        return true;
    },

    onTouchMoved: function(touch, event) {
        var touchedPos = touch.getLocation();
        var prevPos = touch.getPreviousLocation();

        var renderPos = this.convertToRTSpace(touchedPos);
        var prevRenderPos = this.convertToRTSpace(prevPos);

        var distance = cc.pDistance(renderPos, prevRenderPos);
        var dif = cc.pSub(renderPos, prevRenderPos);

        this._tmpRender.begin();
        for (var i = 0; i < distance; i++) {
            var delta = i / distance;
            var newPos = cc.p(renderPos.x + (dif.x * delta), renderPos.y + (dif.y * delta));
            var brush = new cc.Sprite("brush_large.png");  
            brush.scale = this._wordScale * 0.9;          
            brush.setPosition(newPos);
            brush.visit();
        }
        this._tmpRender.end();
        this._tmpRender.getSprite().color = cc.color("#333333");
    },

    onTouchEnded: function(touch, event) {
        var self = this;

        var image = this._tmpRender.newImage(); 

        this._blockTouch = true;
        if (this.imageMatched(image)) {
            this._pathIdx++;

            this._tmpRender.getSprite().runAction(cc.sequence(
                cc.tintTo(0.3, 0, 255, 0),
                cc.callFunc(function() {
                    self._blockTouch = false;

                    var sprite = new cc.Sprite(self._tmpRender.getSprite().getTexture());
                    sprite.flippedY = true;
                    sprite.setPosition(self._tmpRender.getPosition());

                    self._tmpRender.getSprite().color = cc.color.WHITE;
                    self._baseRender.begin();
                    sprite.visit();
                    self._baseRender.end();

                    self._tmpRender.clear(0,0,0,0);
                    self._tmpRender.getSprite().color = cc.color("#333333");
                    if (self.checkChangingCharacter()) {
                        var correctedCharacter = self._currentChar;
                        if (self.checkChangingWord()){
                            self._changeWord();
                            self._touchCounting++;
                            self.updateProgressBar();
                        }
                        else {
                            self._moveToNextCharacter();
                        }
                        self._correctAction(correctedCharacter);
                    } else {
                        self._displayFinger();
                    }
                })
            ));
        } else {
            this._writeFailCount++;
            this._displayFinger();
            var failTimes = GAME_CONFIG.writingTestFailTimesToNextCharacter || UPDATED_CONFIG.writingTestFailTimesToNextCharacter;
            
            this._tmpRender.getSprite().runAction(cc.sequence(
                cc.tintTo(0.15, 255, 0, 0),
                cc.tintTo(0.15, 255, 255, 255),
                cc.tintTo(0.15, 255, 0, 0),
                cc.tintTo(0.15, 255, 255, 255),
                cc.tintTo(0.15, 255, 0, 0),
                cc.tintTo(0.15, 255, 255, 255),
                cc.callFunc(function() {
                    self._blockTouch = false;
                    self._tmpRender.clear(0,0,0,0);

                    if (self._writeFailCount >= failTimes) {
                        self._segmentTracking("false");
                        self._finishAndMoveToNextChar();
                    }
                })
            ));
            this._incorrectAction();
        }
    },  

    imageMatched: function(image) {
        var self = this;

        var includedCoverPercentage = GAME_CONFIG.writingTestIncludedCoverPercentage || UPDATED_CONFIG.writingTestIncludedCoverPercentage;
        var excludedCoverPercentage = GAME_CONFIG.writingTestExcludedCoverPercentage || UPDATED_CONFIG.writingTestExcludedCoverPercentage;

        for (var i = 0; i < this._currentCharConfig.paths.length; i++) {
            var pathCfg = this._currentCharConfig.paths[i];

            var matchedCount = 0;
            pathCfg.forEach(function(point) {
                var p = self.convertScaledPath(point);
                if (!self.isSpriteTransparentInPoint(image, p))
                    matchedCount++;
            });

            var coverPercentage = matchedCount / pathCfg.length * 100;

            if (((i == this._pathIdx) && (coverPercentage < includedCoverPercentage)) ||    // Included Point
                ((i != this._pathIdx) && (coverPercentage > excludedCoverPercentage)))      // Excluded Point
                return false;
        }
        
        return true;
    },
    updateProgressBar: function() {

        this.popGold(this._tmpRender.getPosition());

        cc.log("updateProgressBar");
        var percent = this._touchCounting / this._names.length;
        cc.log("percent: " + percent);
        var percent = this._touchCounting / this._names.length;
        this.setHUDProgressBarPercentage(percent);
        this.setHUDCurrentGoals(this._touchCounting);

        this._super();

    },

    convertToRTSpace: function(p) {
        return cc.pSub(p, cc.pSub(this._tmpRender.getPosition(), cc.p(RENDER_TEXTURE_WIDTH/2, RENDER_TEXTURE_HEIGHT/2)));
    },

    convertToWSpace: function(p) {
        return cc.pAdd(p, cc.pSub(this._tmpRender.getPosition(), cc.p(RENDER_TEXTURE_WIDTH/2, RENDER_TEXTURE_HEIGHT/2)));
    },

    convertScaledPath: function(p) {
        return cc.pAdd(cc.pMult(p, this._wordScale), cc.p(RENDER_TEXTURE_WIDTH * (1 - this._wordScale) / 2, RENDER_TEXTURE_HEIGHT * (1 - this._wordScale) / 2));
    },

    isSpriteTransparentInPoint: function(image, point) {
        return h102.Utils.isPixelTransparent(image, point.x, point.y);
    },

    fetchCharacterConfig: function() {
        var currentName = this._writingWords[this._nameIdx];
        this._currentChar = currentName[this._charIdx];
        this._currentCharConfig = WritingTestLayer.CHAR_CONFIG[this._currentChar];
        cc.log ("_currentChar: " + this._currentChar);
        cc.log ("this._currentCharConfig: " + JSON.stringify(this._currentCharConfig));
    },

    _finishAndMoveToNextChar: function() {
        var self = this;
        ConfigStore.getInstance().setBringBackObj(
            this._oldSceneName == "RoomScene" ? BEDROOM_ID : FOREST_ID, 
            this._names[this._nameIdx], 
            (this._oldSceneName == "RoomScene" ? Global.NumberRoomPlayed : Global.NumberForestPlayed)-1);
        
        this._finger.stopAllActions();
        this._finger.opacity = 0;

        this._characterNodes[this._charIdx].runAction(cc.fadeTo(0.5, 64));
        this._charIdx++;
        this._pathIdx = 0;
        this._writeFailCount = 0;

        if (self.checkChangingWord())
            self._changeWord();
        else
            self._moveToNextCharacter();

        // this._tmpRender.begin();
        // while (this._pathIdx < this._currentCharConfig.paths.length) {
        //     var pathCfg = this._currentCharConfig.paths[this._pathIdx];
        //     // cc.log(JSON.stringify(pathCfg));
        //     // var prevPoint = self.convertScaledPath(pathCfg[pathCfg.length-1]);
        //     var prevPoint = self.convertScaledPath(pathCfg[0]);

        //     for (var j = 1; j < pathCfg.length; j++) {
        //     // for (var j = pathCfg.length-1; j >= 0; j--) {
        //         var p = self.convertScaledPath(pathCfg[j]);

        //         var distance = cc.pDistance(p, prevPoint);
        //         var dif = cc.pSub(p, prevPoint);

        //         for (var i = 0; i < distance; i++) {
        //             var delta = i / distance;
        //             var newPos = cc.p(p.x + (dif.x * delta), p.y + (dif.y * delta));
        //             var brush = new cc.Sprite("brush.png");  
        //             brush.color = cc.color.GREEN;
        //             brush.scale = self._wordScale * 0.9;          
        //             brush.setPosition(newPos);
        //             brush.visit();
        //         }

        //         prevPoint = p;
        //     }

        //     // for (var j = 0; j < pathCfg.length; j++) {
        //     //     var p = self.convertScaledPath(pathCfg[j]);

        //     //     var brush = new cc.Sprite("brush.png");  
        //     //     brush.color = cc.color.RED;
        //     //     brush.scale = self._wordScale * 0.1;          
        //     //     brush.setPosition(p);
        //     //     brush.visit();
        //     // }

        //     this._pathIdx++;
        // }
        // this._tmpRender.end();

        // this.runAction(cc.sequence(
        //     cc.delayTime(0),
        //     cc.callFunc(function() {
        //         var sprite = new cc.Sprite(self._tmpRender.getSprite().getTexture());
        //         // sprite.color = cc.color.GREEN;
        //         sprite.flippedY = true;
        //         sprite.setPosition(self._tmpRender.getPosition());
                
        //         self._baseRender.begin();
        //         sprite.visit();
        //         self._baseRender.end();

        //         self._tmpRender.clear(0,0,0,0);
        //         self._tmpRender.getSprite().color = cc.color("#333333");

        //         self.checkChangingCharacter();
        //         if (self.checkChangingWord())
        //             self._changeWord();
        //         else
        //             self._moveToNextCharacter();
        //     })
        // ))
    },

    checkChangingCharacter: function() {
        if (this._pathIdx >= this._currentCharConfig.paths.length)
        {
            this._segmentTracking("true");
            // next char
            this._charIdx++;
            this._pathIdx = 0;
            this._writeFailCount = 0;
            return true;
        }

        return false;
    },

    checkChangingWord: function() {
        if (this._charIdx >= this._writingWords[this._nameIdx].length) {
            this._charIdx = 0;
            this._nameIdx++;
            return true;
        }
        return false;
    },

    _changeWord: function() {
        var self = this;
        var sprite, objName;
        self._blockTouch = true;

        this.runAction(cc.sequence(
            cc.delayTime(1),
            cc.callFunc(function() {
                self._characterNodes.forEach(function(obj) {
                    obj.runAction(cc.fadeOut(0.5));
                });

                self._baseRender.getSprite().runAction(cc.fadeOut(0.5));
            }),
            cc.delayTime(0.25),
            cc.callFunc(function() {
                sprite = self._addObjImage(self._names[self._nameIdx-1]);
                sprite.runAction(cc.spawn(
                    cc.fadeIn(0.5),
                    cc.scaleTo(0.5, 1.5)
                ));

                objName = self._addObjName(self._writingWords[self._nameIdx-1], self._writingWords[self._nameIdx-1].length);
                objName.opacity = 0;
                objName.runAction(cc.fadeIn(0.5));
            }),
            cc.delayTime(0.5),
            cc.callFunc(function() {
                self._playObjSound(self._names[self._nameIdx-1], function() {
                    self.runAction(cc.sequence(
                        cc.delayTime(1.2),
                        cc.callFunc(function() {
                            sprite.runAction(cc.sequence(
                                cc.fadeOut(0.3),
                                cc.callFunc(function() {
                                    if (self._nameIdx >= self._writingWords.length) {
                                        self.doCompletedScene();
                                        return;
                                    }

                                    sprite.removeFromParent();
                                    objName.removeFromParent();
                                    self._baseRender.getSprite().opacity = 128;

                                    self._displayWord();
                                    self._baseRender.clear(0,0,0,0);
                                    self._moveToNextCharacter();

                                    self._blockTouch = false;
                                })
                            ));
                        })
                    ));
                });
            })
        ));
    },

    _addObjImage: function(name) {
        cc.log("name: " + name);
        var spritePath = "objects/" + name.toLowerCase() + ".png";
        var secondNumberPath = null;
        if (!jsb.fileUtils.isFileExist(spritePath)) {
            spritePath = "animals/" + name.toLowerCase() + ".png";
            if (!jsb.fileUtils.isFileExist(spritePath)) {

                if (!isNaN(name.toLowerCase())) { // number case
                    var number = parseInt(name.toLowerCase());
                    spritePath = "#" + number + ".png";
                    if (number > 9) {
                        var firstNumber = Math.floor(number/10);
                        secondNumberPath = "#" + (number-firstNumber*10) + ".png";
                        spritePath = "#" + firstNumber + ".png";
                    }
                } else { // word case
                    var option = "";
                    if (name == name.toLowerCase()) {
                        option = "_lowercase";
                    }
                    spritePath = "#" + name.toUpperCase() + option + ".png";
                }
            }
        }
        cc.log("_addObjImage");
        // Only support two digit number for now, update later if needed
        cc.log("spritePath: " + spritePath);
        var s = new cc.Sprite(spritePath);
        s.x = cc.winSize.width * 0.65;
        s.y = cc.winSize.height * 0.5;
        s.opacity = 0;
        s.setCascadeOpacityEnabled(true);
        this.addChild(s, 2);

        if (secondNumberPath) {
            s.x = s.x - s.width/2;
            var s2 = new cc.Sprite(secondNumberPath);
            s2.x = s.width + s2.width/2;
            s2.y = s.height/2;
            s.addChild(s2);
        }

        return s;
    },

    _addObjName: function(name, writingLength) {
        var nameNode = new cc.LabelBMFont(name, "hud-font.fnt");
        nameNode.x = cc.winSize.width * 0.65
        nameNode.y = cc.winSize.height - 120;
        nameNode.scale = 1.5;
        this.addChild(nameNode);

        for (var i = writingLength; i < name.length; i++) {
            nameNode.getLetter(i).opacity = 128;
        }

        return nameNode;
    },

    _playObjSound: function(name, cb) {
        var localizedName = localize(name.toLowerCase());
        var soundPath = "sounds/words/" + localizedName + ".mp3";

        if (!jsb.fileUtils.isFileExist("res/" + soundPath)) {
            soundPath = "sounds/alphabets/" + localizedName + ".mp3";
            if (!isNaN(name))
                soundPath = "sounds/numbers/" + localizedName + ".mp3";
        }

        if (jsb.fileUtils.isFileExist(soundPath)) {
            var audioId = jsb.AudioEngine.play2d(soundPath, false);
            jsb.AudioEngine.setFinishCallback(audioId, function(audioId, audioPath) {
                cb && cb();
            });
        } else {
            cb && cb();
        }
        
    },

    _displayWord: function() {
        if (this._characterNodes.length > 0) {
            this._characterNodes.forEach(function(obj) {obj.removeFromParent();});
        }
        this._characterNodes = [];

        var objName = this._writingWords[this._nameIdx];
        // cc.log("objName: " + objName);
        var lines = Math.ceil(objName.length / 5);
        var maxCharsPerLine = Math.ceil(objName.length / lines);
        var charsPerLine = [];

        var nameLength = objName.length;
        while(nameLength > maxCharsPerLine) {
            charsPerLine.push(maxCharsPerLine);
            nameLength -= maxCharsPerLine;
        }
        charsPerLine.push(nameLength);

        var charArrays = [];
        var totalWidths = [];
        this._wordScale = 0.8;

        for (var i = 0; i < charsPerLine.length; i++) {
            var tempArr = [];
            var totalWidth = 0;

            for (var j = 0; j < charsPerLine[i]; j++) {
                var charIndex = i * charsPerLine[0] + j;
                if (charIndex > objName.length)
                    break;
                var option = "";
                if(objName.toUpperCase() != objName)
                    option = "_lowercase"
                var s = new cc.Sprite("#" + objName.toUpperCase()[charIndex] + option + ".png");
                this.addChild(s);
                s.anchorY = 0;
                this._characterNodes.push(s);
                tempArr.push(s);

                totalWidth += s.width + CHAR_SPACE;
            }
            totalWidth -= CHAR_SPACE;
            totalWidths.push(totalWidth);
            if (totalWidth > cc.winSize.width * 0.7)
                this._wordScale = Math.min(this._wordScale, cc.winSize.width * 0.7 /totalWidth);

            charArrays.push(tempArr);
        }

        for (var i = 0; i < charArrays.length; i++) {
            charArrays[i][0].scale = this._wordScale;
            charArrays[i][0].x = cc.winSize.width * 0.65 - totalWidths[i]/2 * this._wordScale + charArrays[i][0].width/2 * this._wordScale - 10;
            charArrays[i][0].y = cc.winSize.height/2 - (i - lines/2 + 0.5) * 280 * this._wordScale - 150;

            for (var j = 1; j < charArrays[i].length; j++) {
                charArrays[i][j].scale = this._wordScale;
                charArrays[i][j].x = charArrays[i][j-1].x + (charArrays[i][j-1].width/2 + CHAR_SPACE + charArrays[i][j].width/2) * this._wordScale;
                charArrays[i][j].y = cc.winSize.height/2 - (i - lines/2 + 0.5) * 280 * this._wordScale - 150;
            }
        }
    },

    _moveToNextCharacter: function() {
        cc.log("this._wordScale: " +this._wordScale);
        var pos = this._characterNodes[this._charIdx].getPosition();
        pos.y = this._characterNodes[this._charIdx].y + this._characterNodes[this._charIdx].height/2 * this._wordScale;
        this._tmpRender.setPosition(pos);

        this.fetchCharacterConfig();
        this._displayNewDashedLine();
        this._displayFinger();
    },

    _displayNewDashedLine: function() {
        return;
        if (this._dashedLine) {
            this._dashedLine.removeFromParent();
            this._dashedLine = null;
        }

        var dashCfg = this._currentCharConfig.dashedLines[this._pathIdx];
        if (!dashCfg)
            return;

        this._dashedLine = new cc.Sprite("#" + dashCfg.sprite);
        this._dashedLine.x = dashCfg.x + this._emptyFillCharacter.x - this._emptyFillCharacter.width/2;
        this._dashedLine.y = dashCfg.y + this._emptyFillCharacter.y - this._emptyFillCharacter.height/2;
        this._dashedLine.scaleX = dashCfg.w / this._dashedLine.width;
        this._dashedLine.scaleY = dashCfg.h / this._dashedLine.height;
        this._dashedLine.rotation = dashCfg.rotation;
        this._dashedLine.anchorX = this._dashedLine.anchorY = 0;
        this.addChild(this._dashedLine, 1);
    },

    _addAdiDog: function() {
        this._adiDog = new AdiDogNode();
        this._adiDog.scale = Utils.screenRatioTo43() * 0.5;
        this._adiDog.setPosition(cc.p(cc.winSize.width * 0.15, cc.winSize.height/2 - 150 * this._adiDog.scale));
        this.addChild(this._adiDog);
    },

    _addRenderTextures: function() {
        this._baseRender = new cc.RenderTexture(cc.winSize.width, cc.winSize.height);
        // this._baseRender.retain();
        this._baseRender.x = cc.winSize.width/2;
        this._baseRender.y = cc.winSize.height/2;
        this._baseRender.getSprite().color = cc.color.GREEN;
        this._baseRender.getSprite().opacity = 128;
        this.addChild(this._baseRender, 2);

        this._tmpRender = new cc.RenderTexture(RENDER_TEXTURE_WIDTH, RENDER_TEXTURE_HEIGHT);
        // this._tmpRender.setPosition(this._baseRender.getPosition());
        this._tmpRender.getSprite().opacity = 128;
        this._tmpRender.getSprite().color = cc.color("#333333");
        this.addChild(this._tmpRender, 3);        
    },

    _displayFinger: function() {
        if (!this._finger) {
            this._finger = new cc.Sprite("#finger-1.png");
            this._finger.anchorX = 0.26;
            this._finger.anchorY = 0.77; 
            this.addChild(this._finger, 5);
        }

        this._finger.stopAllActions();
        this._finger.opacity = 0;

        var pathCfg = this._currentCharConfig.paths[this._pathIdx];

        var actions = [];

        actions.push(cc.moveTo(0, this.convertToWSpace(this.convertScaledPath(pathCfg[0]))));
        actions.push(cc.fadeIn(0.15));
        for (var i = 1; i < pathCfg.length; i++) {
            var distToPrevPoint = cc.pDistance(this.convertScaledPath(pathCfg[i]), this.convertScaledPath(pathCfg[i-1]));
            actions.push(cc.moveTo(distToPrevPoint * 0.005, this.convertToWSpace(this.convertScaledPath(pathCfg[i]))));
        }
        actions.push(cc.fadeOut(0.15));
        actions.push(cc.delayTime(0.3));

        this._finger.runAction(cc.repeatForever(cc.sequence(actions)));
    },

    _correctAction: function(correctedCharacter) {
        var self = this;
        jsb.AudioEngine.play2d(res.Succeed_sfx);
        cc.log("correct: " + correctedCharacter);

        jsb.AudioEngine.play2d("res/sounds/alphabets/" + localize(correctedCharacter) + ".mp3");
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

    _incorrectAction: function() {
        var self = this;
        AudioManager.getInstance().play(res.incorrect_word_mp3);
        this._adiDog.adiShakeHead();
        this.runAction(
            cc.sequence(
                cc.delayTime(4),
                cc.callFunc(function() {
                    self._adiDog.adiIdling();
                })        
            )
        );
    },

    _segmentTracking: function(correct) {
        var charName = this._writingWords[this._nameIdx][this._charIdx];
        // cc.log("writingTest charname correct: " + charName + " " + correct);
        SegmentHelper.track(SEGMENT.WRITE_TEST,
            {
                char_name: charName,
                correct: correct
            });
    },

    _fetchObjectData: function(data) {
        this._data = data;
        // if(typeof(data) != "object")
        //     data = JSON.parse(data);
        // cc.log(typeof data);
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
        // if(!dataForWriting[0].dataWriting)
        //     dataForWriting  = this._data;
        // this.setData(this._data);
        this._writingWords = this._names;
        this._writingWords = this._writingWords.map(function(obj) {
            return localizeForWriting(obj);  
        }); 
        cc.log("this._writingWords: " + JSON.stringify(this._writingWords));
    },
});

WritingTestLayer.CHAR_CONFIG = null;
WritingTestLayer.prepareData = function() {
    if (WritingTestLayer.CHAR_CONFIG == null) {
        WritingTestLayer.CHAR_CONFIG = {};

        var csf = cc.director.getContentScaleFactor();
        var tiledMap = new cc.TMXTiledMap();
        tiledMap.initWithTMXFile(res.ABC_TMX);

        var mapSize = tiledMap.getMapSize();
        var tileSize = tiledMap.getTileSize();

        tiledMap.getObjectGroups().forEach(function(group) {
            var config = {
                paths: [],
                dashedLines: [],
                includedPoints: []
            };

            group.getObjects().forEach(function(obj) {
                if (obj.name.startsWith("Path")) {
                    var pathIdx = parseInt(obj.name.substring(4));
                    config.paths[pathIdx-1] = [];

                    var offsetX = obj.x * csf;
                    var offsetY = mapSize.height * tileSize.height - obj.y * csf;

                    for (var i = 0; i < obj.polylinePoints.length; i++) {
                        var x = obj.polylinePoints[i].x * csf + offsetX;
                        var y = mapSize.height * tileSize.height - (obj.polylinePoints[i].y * csf + offsetY);

                        config.paths[pathIdx-1].push(cc.p(x, y));
                    }
                }

                if (obj.name.startsWith("Dash")) {
                    var dashIdx = parseInt(obj.name.substring(4));

                    var dashCfg = {};

                    dashCfg.x = obj.x * csf;
                    dashCfg.y = (obj.y + obj.height) * csf; 
                    dashCfg.w = obj.width;
                    dashCfg.h = obj.height;
                    dashCfg.sprite = obj.sprite;
                    dashCfg.rotation = obj.rotation || 0;

                    config.dashedLines[dashIdx-1] = dashCfg;
                }
            });

            WritingTestLayer.CHAR_CONFIG[group.getGroupName()] = config;
        });
    }
}

var WritingTestScene = cc.Scene.extend({
    ctor: function(data, oldSceneName, isTestScene, timeForScene){
        this._super();

        WritingTestLayer.prepareData();
        // cc.log("WritingTestLayer.CHAR_CONFIG: " + JSON.stringify(WritingTestLayer.CHAR_CONFIG));
        var layer = new WritingTestLayer(data, oldSceneName, isTestScene, timeForScene);
        this.addChild(layer);

    }
});