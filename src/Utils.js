var Utils = Utils || {};

Utils.callOpenScheme = function(scheme, data) {
    if (cc.sys.isNative) {
        if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod("H102Wrapper",
                                            "openScheme:withData:",
                                            scheme,
                                            data);
        }

        if (cc.sys.os == cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity",
                                            "openScheme",
                                            "(Ljava/lang/String;Ljava/lang/String;)Z",
                                            scheme,
                                            data);   
        }
    }
}

Utils.segmentIdentity = function(userId, userName, schoolId, schoolName) {
    traits = {
        userName: userName,
        schoolName: schoolName,
        schoolId: schoolId
    };

    if (cc.sys.isNative) {
        if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod("H102Wrapper",
                                            "segmentIdentity:traits:",
                                            userId,
                                            JSON.stringify(traits));
        }

        if (cc.sys.os == cc.sys.OS_ANDROID) {
            // jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity",
            //                                 "openScheme",
            //                                 "(Ljava/lang/String;Ljava/lang/String;)Z",
            //                                 scheme,
            //                                 data);   
        }
    }
}

Utils.segmentTrack = function(event, properties) {
    if (cc.sys.isNative) {
        if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod("H102Wrapper",
                                            "segmentTrack:properties:",
                                            event,
                                            JSON.stringify(properties));
        }

        if (cc.sys.os == cc.sys.OS_ANDROID) {
            // jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity",
            //                                 "openScheme",
            //                                 "(Ljava/lang/String;Ljava/lang/String;)Z",
            //                                 scheme,
            //                                 data);   
        }
    }
}

Utils.getUDID = function() {
  if (cc.sys.os == cc.sys.OS_IOS)
    return jsb.reflection.callStaticMethod("H102Wrapper", 
                                           "getUniqueDeviceId");
  else if (cc.sys.os == cc.sys.OS_ANDROID)
    return jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity", "getId", "()Ljava/lang/String;");
}

Utils.addLoadingIndicatorLayer = function(block) {
    var currentScene = cc.director.getRunningScene();

    if (currentScene.getChildByTag(TAG_LOADING_INDICATOR_LAYER) != null)
        return;

    var loadingLayer = new LoadingIndicatorLayer(block);
    currentScene.addChild(loadingLayer, 1000);
    return loadingLayer;
}

Utils.removeLoadingIndicatorLayer = function() {
    var currentScene = cc.director.getRunningScene();

    var layer = currentScene.getChildByTag(TAG_LOADING_INDICATOR_LAYER);
    if (layer)
        layer.removeFromParent();    
}

Utils.loadImg = function(imgUrl, spriteNode, cb) {
    if (!spriteNode) return;

    var oldWidth = spriteNode.getBoundingBox().width;

    if (imgUrl) {
        var self = this;

        if (imgUrl.startsWith('/'))
            imgUrl = BACKEND_ADDRESS + imgUrl.slice(1, imgUrl.length);

        if (imgUrl.startsWith('https'))
            imgUrl = "http" + imgUrl.substring(5);

        var fileName = imgUrl.substring(imgUrl.lastIndexOf('/')+1);

        var frame = cc.spriteFrameCache.getSpriteFrame(fileName);
        if (!frame) {
            Utils.loadSavedTexture(fileName);
            frame = cc.spriteFrameCache.getSpriteFrame(fileName);
        }
        if (frame) {
            if (spriteNode instanceof ccui.Button) {
                spriteNode.loadTextureNormal(fileName, ccui.Widget.PLIST_TEXTURE);
            }
            if (spriteNode instanceof cc.Sprite) {
                spriteNode.setSpriteFrame(frame);
            }

            spriteNode.scale = oldWidth / (spriteNode.getBoundingBox().width / spriteNode.scale);

            return;
        }        

        cc.loader.loadImg(imgUrl, function(target, texture) {

            if (texture instanceof cc.Texture2D) {
                // cc.log(texture.pixelsWidth + " " + texture.pixelsHeight);
                // self._avatarTexture[fbid] = texture;

                texture.setAntiAliasTexParameters();
                var spriteFrame = new cc.SpriteFrame(texture, cc.rect(0, 0, texture.width, texture.height));
                cc.spriteFrameCache.addSpriteFrame(spriteFrame, fileName);

                if (spriteNode instanceof ccui.Button) {
                    spriteNode.loadTextureNormal(fileName, ccui.Widget.PLIST_TEXTURE);
                }
                if (spriteNode instanceof cc.Sprite) {
                    spriteNode.setSpriteFrame(spriteFrame);
                }

                spriteNode.scale = oldWidth / (spriteNode.getBoundingBox().width / spriteNode.scale);

                Utils.writeTexture(fileName);
            }
        });
    }
}

Utils.writeTexture = function(fileName) {
    jsb.fileUtils.createDirectory(jsb.fileUtils.getWritablePath() + 'games/');

    var sprite = new cc.Sprite("#" + fileName);
    sprite.anchorX = sprite.anchorY = 0;

    var renderTexture = new cc.RenderTexture(sprite.width, sprite.height);
    renderTexture.begin();
    sprite.visit();
    renderTexture.end();
    renderTexture.saveToFile("games/" + fileName, 1);
}

Utils.loadSavedTexture = function(fileName) {
    var fullName = jsb.fileUtils.getWritablePath() + 'games/' + fileName;
    if (jsb.fileUtils.isFileExist(fullName)) {
        var sprite = new cc.Sprite(fullName);
        sprite.texture.setAntiAliasTexParameters();
        var spriteFrame = new cc.SpriteFrame(sprite.getTexture(), cc.rect(0, 0, sprite.width, sprite.height));
        cc.spriteFrameCache.addSpriteFrame(spriteFrame, fileName);

        return true;
    }

    return false;
}