var AudioListener = cc.Class.extend({
    _talkingAdi: null,
    _playbackLength: 0,

    setAdi: function(adi) {
        if (adi == undefined || adi == null)
            return;

        this._talkingAdi = adi;
        cc.log("adi: " + this._talkingAdi);
    },

    onStartedListening: function() {
        cc.log("onStartedListening");
        this._talkingAdi.setAnimation(0, 'adidog-listeningstart', false);
        this._talkingAdi.addAnimation(0, 'adidog-listeningloop', true, 1);
    },

    // fileName: str
    // playbackLength: long (milisecond)
    onStoppedListening: function(fileName, playbackLength) {
        cc.log("onStoppedListening: " + fileName + " " + playbackLength);
        this._playbackLength = playbackLength;

        cc.eventManager.dispatchCustomEvent("chipmunkify");
    },

    onAudioChipmunkified: function(fileName) {
        var self = this;
        cc.log("onAudioChipmunkified: " + fileName);

        cc.audioEngine.setEffectsVolume(1);

        cc.director.getRunningScene().runAction(cc.sequence(
            cc.delayTime(0),
            cc.callFunc(function() {
                if (self._playbackLength > 0) {
                    cc.audioEngine.unloadEffect(fileName);
                    var audio = cc.audioEngine.playEffect(fileName);

                    self._talkingAdi.setAnimation(0, 'adidog-listeningfinish', false);
                    self._talkingAdi.addAnimation(0, 'adidog-talking', true, 0.2);
                }
                else {
                    self._talkingAdi.setAnimation(0, 'adidog-listeningfinish', false);
                    self._talkingAdi.addAnimation(0, 'adidog-idle', true, 1);
                }
            }),
            cc.delayTime(self._playbackLength),
            cc.callFunc(function() {
                NativeHelper.callNative("startBackgroundSoundDetecting");
                self._talkingAdi.setAnimation(0, 'adidog-idle', true);
            })));
    }
});

AudioListener._instance = null;

AudioListener.getInstance = function () {
  return AudioListener._instance || AudioListener.setupInstance();
};

AudioListener.setupInstance = function () {
    AudioListener._instance = new AudioListener();
    return AudioListener._instance;
}