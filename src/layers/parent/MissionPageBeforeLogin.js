var MissionPageBeforeLogin = cc.Layer.extend({
    _loggedIn: false,

    _contentTextScale: 0.35,
    _contentTextOffSetY: 5,

    _buttonOffSetY: 10,

    _backgroundZOrder: 1,
    _childrenZOrder: 3,
    _cloudZOrder: 2,
    _grownupCheckDialogZOrder: 5,

    _childrenOffSetY: 0,

    _childrenImg: null,

    ctor: function() {
        this._super();

        this._childrenOffSetY = 50;

        this._addBackground();
        this._addMissionContent();
        this._addButtons();
        this._addPrivacyPolicyText();
        // AnalyticsManager.getInstance().logCustomEvent("EVENT_MISSION_PAGE_1");
    },

    _addBackground: function() {
        var background = new cc.Sprite(res.Mission_Page_bg);
        background.x = cc.winSize.width/2;
        background.y = cc.winSize.height/2;
        this.addChild(background);

        var children = new cc.Sprite("#children.png");
        children.scale = 0.9;
        children.x = cc.winSize.width/2;
        children.y = cc.winSize.height/2 + this._childrenOffSetY;
        this.addChild(children, this._childrenZOrder);
        this._childrenImg = children;
    },

    _addButtons: function() {
        var b = new ccui.Button("btn_empty.png", "", "", ccui.Widget.PLIST_TEXTURE);
        b.name = "pay";
        b.x = cc.winSize.width/2 - b.width/2 - 30;
        b.y = b.height - this._buttonOffSetY;
        b.scaleX = 1.2;
        this.addChild(b);

        b.addClickEventListener(this._payBtnPressed.bind(this));

        var lb = new cc.LabelBMFont("Pay what's in your", res.HomeFont_fnt);
        lb.scale = 0.4;
        lb.textAlign = cc.TEXT_ALIGNMENT_CENTER;
        lb.x = cc.winSize.width/2 - b.width/2 - 50;
        lb.y = b.height - this._buttonOffSetY + 10;
        this.addChild(lb);

        var iconHeart = new cc.Sprite("#icon_heart.png");
        iconHeart.x = lb.width + 80;
        iconHeart.y = lb.height/2 - 10;
        iconHeart.scale = 1/0.4;
        lb.addChild(iconHeart);

        b = new ccui.Button("btn_empty.png", "", "", ccui.Widget.PLIST_TEXTURE);
        b.name = "play";

        var lb = new cc.LabelBMFont("Play for free", res.HomeFont_fnt);
        lb.scale = 0.4;
        lb.textAlign = cc.TEXT_ALIGNMENT_CENTER;
        lb.x = b.width/2;
        lb.y = b.height/2 + 10;
        b.addChild(lb);
        
        b.x = cc.winSize.width/2 + b.width/2 + 30;
        b.y = b.height - this._buttonOffSetY;
        this.addChild(b);

        b.addClickEventListener(this._playBtnPressed.bind(this));

    },

    _addLaterBtn: function() {
        var b = new ccui.Button(res.Pay_button_normal_png, res.Pay_button_pressed_png);
        b.x = cc.winSize.width/2 - b.width/2 - 20;
        b.y = b.height/2;
        this.addChild(b, this._childrenZOrder);
        b.addClickEventListener(function() {
            AudioManager.getInstance().play(res.ui_click_mp3_2, false, null);
            cc.director.replaceScene(new GrownUpMenuScene());
        }.bind(this));

        var content = "Maybe later!";
        var lb = new cc.LabelBMFont(content, res.HomeFont_fnt);
        lb.scale = 0.3;
        lb.textAlign = cc.TEXT_ALIGNMENT_CENTER;
        lb.x = b.width/2;
        lb.y = b.height/2 + this._contentTextOffSetY;
        b.addChild(lb);

        b = new ccui.Button(res.Pay_button_normal_png, res.Pay_button_pressed_png);
        b.x = cc.winSize.width/2 + b.width/2 + 20;
        b.y = b.height/2;
        this.addChild(b, this._childrenZOrder);
        b.addClickEventListener(function() {
            AudioManager.getInstance().play(res.ui_click_mp3_2, false, null);
            cc.director.replaceScene(new HomeScene());
        }.bind(this));

        content = "Back to Home";
        lb = new cc.LabelBMFont(content, res.HomeFont_fnt);
        lb.scale = 0.3;
        lb.textAlign = cc.TEXT_ALIGNMENT_CENTER;
        lb.x = b.width/2;
        lb.y = b.height/2 + this._contentTextOffSetY;
        b.addChild(lb);
    },

    _addMissionContent: function() {
        var lCloud = new cc.Sprite("#left_cloud.png");
        lCloud.setAnchorPoint(0, 1);
        lCloud.y = cc.winSize.height;
        this.addChild(lCloud, this._cloudZOrder);

        var content = "Equal education for every child";
        var lContent = new cc.LabelBMFont(content, res.Grown_Up_fnt);
        lContent.scale = this._contentTextScale + 0.1;
        lContent.textAlign = cc.TEXT_ALIGNMENT_CENTER;
        lContent.x = lCloud.width/2;
        lContent.y = lCloud.height/2 + this._contentTextOffSetY + 10;
        lContent.boundingWidth = lCloud.width * 2;
        lCloud.addChild(lContent);

        var rCloud = new cc.Sprite("#right_cloud.png");
        rCloud.setAnchorPoint(1, 1);
        rCloud.x = cc.winSize.width;
        rCloud.y = cc.winSize.height;
        this.addChild(rCloud, this._cloudZOrder);

        content = "When you pay what's in your       we educate a child in need";
        var rContent = new cc.LabelBMFont(content, res.Grown_Up_fnt);
        rContent.scale = this._contentTextScale;
        rContent.textAlign = cc.TEXT_ALIGNMENT_CENTER;
        rContent.x = rCloud.width/2 - 4;
        rContent.y = rCloud.height/2 + this._contentTextOffSetY + 10;
        rContent.boundingWidth = rCloud.width * 2.3;
        rCloud.addChild(rContent);

        var iconHeart = new cc.Sprite("#icon_heart.png");
        iconHeart.scale = 0.6;
        iconHeart.x = rCloud.width * 0.33;
        iconHeart.y = rCloud.height * 0.59;
        rCloud.addChild(iconHeart);
    },

    _grownUpCheckCallback: function() {
        SceneFlowController.getInstance().setSceneGoAfterRewardScene("welcome");
        AnalyticsManager.getInstance().logCustomEvent(EVENT_PAY_PAGE_1);
        cc.director.replaceScene(new PayScene(function() {
            cc.director.replaceScene(new MissionPageBeforeLoginScene());
        }));
    },

    _payBtnPressed: function() {
        AudioManager.getInstance().play(res.ui_click_mp3_2, false, null);
        FirebaseManager.getInstance().authenticate(function(authenticated, isLinked) {
            this.addChild(new GrownUpCheckDialog(this._grownUpCheckCallback), this._grownupCheckDialogZOrder);
        }.bind(this));
    },

    _playBtnPressed: function() {
        AudioManager.getInstance().play(res.ui_click_mp3_2, false, null);
        FirebaseManager.getInstance().authenticate(function(authenticated, isLinked) {
            AnalyticsManager.getInstance().logCustomEvent(EVENT_PLAY_FREE);
            cc.director.replaceScene(new WelcomeScene());
        });

    },

    _addPrivacyPolicyText: function() {
        cc.eventManager.addListener({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,
            swallowTouches: true,
            onTouchBegan: this.onTouchBegan.bind(this)
        }, this);
        
        var str = "By continuing you are accepting our privacy policy"; 
        var link = "http://www.theschoolofgames.ai/privacy-policy/";
        var config = {
            "color": "#292A68",
            "shadowColor": [167, 90, 0, 127],
            "shadowSize": 0,
            "shadowRadius": 6,
            "fontSize": 18,
            "outlineSize": 1,
            "boundingWidthRatio": 1,
            "boundingHeightRatio": 0.3
        };

        var text = CustomLabel.createWithTTF(res.HELVETICARDBLK_ttf.srcs[0], 
                                                config.fontSize, 
                                                cc.color(config.color), 
                                                config.outlineSize,
                                                localizeForWriting(str));
        text.enableShadow(cc.color(config.shadowColor[0], 
                                config.shadowColor[1],
                                config.shadowColor[2],
                                config.shadowColor[3]
                            ),
                            cc.size(0, -config.shadowSize)
        );
        text.x = cc.winSize.width/2;
        text.y = cc.rectGetMinY(this._childrenImg.getBoundingBox()) - text.height/2;

        text.setUserData(link);

        this.addChild(text);

        this._privacyPolicyText = text;

        var underline = CustomLabel.createWithTTF(res.HELVETICARDBLK_ttf.srcs[0], 18, cc.color("#ffffff"), 1,"____________");
        underline.setColor(cc.color("#ffc73a"));
        underline.anchorX = 1;
        underline.x = text.width;
        underline.y = text.height/2;

        text.addChild(underline);
    },

    onTouchBegan: function(touch, event) {
        var touchLoc = touch.getLocation();
        var self = event.getCurrentTarget();

        var privacyPolicyTextBBox = self._privacyPolicyText.getBoundingBox();
        privacyPolicyTextBBox = cc.rect(privacyPolicyTextBBox.x, privacyPolicyTextBBox.y, privacyPolicyTextBBox.width, privacyPolicyTextBBox.height*1.5);

        if (cc.rectContainsPoint(privacyPolicyTextBBox, touchLoc)) {
            cc.sys.openURL(self._privacyPolicyText.getUserData().toString());
        }

        return true;
    },
});

var MissionPageBeforeLoginScene = cc.Scene.extend({
    ctor: function() {
        this._super();

        this.addChild(new MissionPageBeforeLogin());
    }
});