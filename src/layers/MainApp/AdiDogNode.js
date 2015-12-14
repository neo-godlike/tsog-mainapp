var AdiDogNode = cc.Node.extend({
    _talkingAdi: null,

    listener: null,

    ctor: function() {
        this._super();

        this._createTalkingAdi();
    },

    _createTalkingAdi: function() {
        cc.log("before creating adi");
        this._talkingAdi = new sp.SkeletonAnimation("adidog/adidog.json", "adidog/adidog.atlas", 0.3);
        // this._talkingAdi.setPosition(cc.p(cc.winSize.width / 3, cc.winSize.height / 6));

        this._talkingAdi.setMix('adidog-idle', 'adidog-listeningstart', 0.2);
        // this._talkingAdi.setMix('adidog-listeningstart', 'adidog-listeningloop', 0.2);
        // this._talkingAdi.setMix('adidog-listeningloop', 'adidog-listeningfinish', 0.2);
        // this._talkingAdi.setMix('adidog-listeningfinish', 'adidog-talking', 0.2);
        // this._talkingAdi.setMix('adidog-talking', 'adidog-idle', 0.2);
        // this._talkingAdi.setMix('adidog-talking', 'adidog-listeningstart', 0.2);
        this._talkingAdi.setAnimation(0, 'adidog-idle', true);

        this.addChild(this._talkingAdi, 4);

        AudioListener.getInstance().setListener(this);
    },

    onStartedListening: function() {
        cc.log("onStartedListening");
        this._talkingAdi.setAnimation(0, 'adidog-listeningstart', false);
        this._talkingAdi.addAnimation(0, 'adidog-listeningloop', true, 0.2);
    },

    onStoppedListening: function() {
        cc.log("onStoppedListening");
        this._talkingAdi.setAnimation(0, 'adidog-listeningfinish', false);
    },

    adiTalk: function() {
        this._talkingAdi.addAnimation(0, 'adidog-talking', true, 0.3);
    },

    adiIdling: function() {
        this._talkingAdi.setAnimation(0, 'adidog-idle', true);
    }
});
