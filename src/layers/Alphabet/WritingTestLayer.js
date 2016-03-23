var RENDER_TEXTURE_WIDTH = 320;
var RENDER_TEXTURE_HEIGHT = 320;

var CHAR_SPACE = 10;
var MAX_AVAILABLE_WIDTH = 850;

var WritingTestLayer = cc.LayerColor.extend({

    _adiDog: null,

    _names: null,
    _nameNode: null,

    _characterNodes: [],
    _wordScale: 1,

    _currentCharConfig: null,
    _baseRender: null,
    _tmpRender: null,
    _emptyFillCharacter: null,
    _dashedLine: null,

    _nameIdx: -1,
    _charIdx: -1,
    _pathIdx: -1,

    _blockTouch: false,

    _nextSceneName: null,
    _oldSceneName: null,

    _objectsArray: null,

    ctor: function(objectsArray, oldSceneName) {
        this._super(cc.color(255, 255, 255, 255));

        this._objectsArray = objectsArray;
        this._names = objectsArray;
        // this._names = objectsArray.map(function(obj) {
        //     return obj.name.toUpperCase();
        // });
        this._oldSceneName = oldSceneName;
        this._nameIdx = this._charIdx = this._pathIdx = 0;

        // this._displayCurrentName();
        this._addAdiDog();
        this._displayWord();
        this._addRenderTextures();
        this._moveToNextCharacter();

        cc.eventManager.addListener({
                event: cc.EventListener.TOUCH_ONE_BY_ONE,
                swallowTouches: true,
                onTouchBegan: this.onTouchBegan.bind(this),
                onTouchMoved: this.onTouchMoved.bind(this),
                onTouchEnded: this.onTouchEnded.bind(this)
        }, this);
    },

    onTouchBegan: function(touch, event) {
        return !this._blockTouch;
    },

    onTouchMoved: function(touch, event) {
        var touchedPos = touch.getLocation();
        var prevPos = touch.getPreviousLocation();

        var renderPos = this.convertToRTSpace(touchedPos);
        var prevRenderPos = this.convertToRTSpace(prevPos);

        var distance = cc.pDistance(renderPos, prevRenderPos);
        var dif = cc.pSub(renderPos, prevRenderPos);

        // var convertedEmptyFillCharPos = this.convertToRTSpace(this._emptyFillCharacter.getPosition());
        // var emptyFillCharBoundingBox = cc.rect(
        //     convertedEmptyFillCharPos.x - this._emptyFillCharacter.width/2,
        //     convertedEmptyFillCharPos.y - this._emptyFillCharacter.height/2,
        //     this._emptyFillCharacter.width,
        //     this._emptyFillCharacter.height);

        this._tmpRender.begin();
        for (var i = 0; i < distance; i++) {
            var delta = i / distance;
            var newPos = cc.p(renderPos.x + (dif.x * delta), renderPos.y + (dif.y * delta));
            // if (cc.rectContainsPoint(emptyFillCharBoundingBox, newPos)) {
                var brush = new cc.Sprite("brush.png");  
                brush.scale = this._wordScale * 0.9;          
                brush.setPosition(renderPos.x + (dif.x * delta), renderPos.y + (dif.y * delta));
                brush.visit();
            // }
        }
        this._tmpRender.end();
        this._tmpRender.getSprite().color = cc.color("#333333");;
    },

    onTouchEnded: function(touch, event) {
        var self = this;

        var image = this._tmpRender.newImage(); 

        var pathCfg = this._currentCharConfig.paths[this._pathIdx];
        var matched = true;
        pathCfg.forEach(function(point) {
            var p = cc.pAdd(cc.pMult(point, self._wordScale), cc.p(RENDER_TEXTURE_WIDTH * (1 - self._wordScale) / 2, RENDER_TEXTURE_HEIGHT * (1 - self._wordScale) / 2))
            cc.log(JSON.stringify(p));
            matched &= !self.isSpriteTransparentInPoint(image, p);
        });

        // this._blockTouch = true;
        if (matched) {
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

                    self.checkChangingCharacter();
                    self._displayNewDashedLine();
                })
            ));
        } else {
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
                })
            ));
            this._incorrectAction();
        }
    },   

    convertToRTSpace: function(p) {
        return cc.pSub(p, cc.pSub(this._tmpRender.getPosition(), cc.p(RENDER_TEXTURE_WIDTH/2, RENDER_TEXTURE_HEIGHT/2)));
    },

    isSpriteTransparentInPoint: function(image, point) {
        return h102.Utils.isPixelTransparent(image, point.x, point.y);
    },

    fetchCharacterConfig: function() {
        this._currentCharConfig = WritingTestLayer.CHAR_CONFIG[this._names[this._nameIdx][this._charIdx]];
    },

    checkChangingCharacter: function() {
        if (this._pathIdx >= this._currentCharConfig.paths.length)
        {
            // next char
            // this._nameNode.getLetter(this._charIdx).opacity = 255;
            this._charIdx++;
            this._pathIdx = 0;
            if (this._charIdx >= this._names[this._nameIdx].length) {
                this._charIdx = 0;
                this._nameIdx++;
                if (this._nameIdx >= this._names.length) {
                    var self = this;
                    this.runAction(cc.sequence(cc.delayTime(0), cc.callFunc(function() {
                        self._nextScene();
                    })));
                    return;
                }
                this._displayWord();

                this._baseRender.clear(0,0,0,0);
            }
            
            this._moveToNextCharacter();
            this._correctAction();
        }
    },

    _nextScene: function() {
        var nextSceneName = SceneFlowController.getInstance().getNextSceneName();
        var scene;
        if (nextSceneName != "RoomScene" && nextSceneName != "ForestScene")
            scene = new window[nextSceneName](this._objectsArray, this._oldSceneName);
        else
            scene = new window[nextSceneName]();
        cc.director.runScene(new cc.TransitionFade(1, scene, cc.color(255, 255, 255, 255)));
    },

    _displayWord: function() {
        if (this._characterNodes.length > 0) {
            this._characterNodes.forEach(function(obj) {obj.removeFromParent();});
        }
        this._characterNodes = [];

        var objName = this._names[this._nameIdx];

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
        this._wordScale = 1;

        for (var i = 0; i < charsPerLine.length; i++) {
            var tempArr = [];
            var totalWidth = 0;

            for (var j = 0; j < charsPerLine[i]; j++) {
                var charIndex = i * charsPerLine[0] + j;
                if (charIndex > objName.length)
                    break;

                var s = new cc.Sprite("#" + objName.toUpperCase()[charIndex] + ".png");
                this.addChild(s);

                this._characterNodes.push(s);
                tempArr.push(s);

                totalWidth += s.width + CHAR_SPACE;
            }
            totalWidth -= CHAR_SPACE;
            totalWidths.push(totalWidth);
            if (totalWidth > cc.winSize.width * 0.7)
                this._wordScale = Math.min(this._wordScale, cc.winSize.width * 0.7/totalWidth);

            charArrays.push(tempArr);
        }

        cc.log("wordScale: " + this._wordScale);

        for (var i = 0; i < charArrays.length; i++) {
            charArrays[i][0].scale = this._wordScale;
            charArrays[i][0].x = cc.winSize.width * 0.65 - totalWidths[i]/2 * this._wordScale + charArrays[i][0].width/2 * this._wordScale - 10;
            charArrays[i][0].y = cc.winSize.height/2 - (i - lines/2 + 0.5) * 300 * this._wordScale;

            for (var j = 1; j < charArrays[i].length; j++) {
                charArrays[i][j].scale = this._wordScale;
                charArrays[i][j].x = charArrays[i][j-1].x + (charArrays[i][j-1].width/2 + CHAR_SPACE + charArrays[i][j].width/2) * this._wordScale;
                charArrays[i][j].y = cc.winSize.height/2 - (i - lines/2 + 0.5) * 300 * this._wordScale;
            }
        }
    },

    _moveToNextCharacter: function() {
        this._tmpRender.setPosition(this._characterNodes[this._charIdx].getPosition());

        this.fetchCharacterConfig();
        this._displayNewDashedLine();
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

    _displayCurrentName: function() {
        if (this._nameNode)
            this._nameNode.removeFromParent();

        this._nameNode = new cc.LabelBMFont(this._names[this._nameIdx], "hud-font.fnt");
        this._nameNode.x = cc.winSize.width/4;
        this._nameNode.y = cc.winSize.height - 50;
        this.addChild(this._nameNode);

        for (var i = 0; i < this._names[this._nameIdx].length; i++)
            this._nameNode.getLetter(i).opacity = 128;
    },

    _addAdiDog: function() {
        this._adiDog = new AdiDogNode();
        this._adiDog.scale = 0.8;
        this._adiDog.setPosition(cc.p(cc.winSize.width * 0.15, cc.winSize.height / 4));
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

    _incorrectAction: function() {
        var self = this;
        jsb.AudioEngine.play2d(res.Failed_sfx);
        this._adiDog.adiShakeHead();
        this.runAction(
            cc.sequence(
                cc.delayTime(4),
                cc.callFunc(function() {
                    self._adiDog.adiIdling();
                })        
            )
        );
    }
});

WritingTestLayer.CHAR_CONFIG = null;

var WritingTestScene = cc.Scene.extend({
    ctor: function(objectsArray, nextSceneName, oldSceneName){
        this._super();

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
                        var offsetY = (mapSize.height * tileSize.height - obj.y) * csf;

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

        var layer = new WritingTestLayer(objectsArray, nextSceneName, oldSceneName);
        this.addChild(layer);
    }
});