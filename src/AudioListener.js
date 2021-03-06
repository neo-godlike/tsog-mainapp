var AudioListener = cc.Class.extend({
    _talkingAdi: null,
    _pauseListening: false,
    _playbackLength: 0,

    _playingAudioId: null,

    setListener: function(adi) {
        if (adi == undefined || adi == null)
            return;

        this._talkingAdi = adi;
        cc.log("adi: " + this._talkingAdi);
    },

    removeListener: function() {
        this._talkingAdi = null;
        jsb.AudioEngine.stop(this._playingAudioId);
    },

    pauseListening: function() {
        cc.log("pauseListening");
        this._pauseListening = true;
    },

    resumeListening: function() {
        cc.log("resumeListening");
        this._pauseListening = false;
    },

    onStartedListening: function() {
        cc.log("this._pauseListening: " + this._pauseListening);
        if (!this._talkingAdi || this._pauseListening)
            return;

        this._talkingAdi.onStartedListening();
    },

    // fileName: str
    // playbackLength: long (second)
    onStoppedListening: function(fileName, playbackLength) {
        if (!this._talkingAdi || this._pauseListening)
            return;

        cc.log("onStoppedListening: " + fileName + " " + playbackLength);
        this._playbackLength = playbackLength;

        cc.eventManager.dispatchCustomEvent("chipmunkify");
    },

    onAudioChipmunkified: function(fileName) {
        if (!this._talkingAdi)
            return;

        var self = this;
        cc.log("onAudioChipmunkified: " + fileName);

        this._playingAudioId = jsb.AudioEngine.play2d(fileName);
        this._talkingAdi.onStoppedListening();
        this._talkingAdi.adiTalk();
        jsb.AudioEngine.setFinishCallback(this._playingAudioId, function(audioId, audioPath) {
            if (!self._talkingAdi)
                return;

            NativeHelper.callNative("startFetchingAudio");
            self._talkingAdi.adiIdling();
        });

        // cc.director.getRunningScene().runAction(cc.sequence(
        //     // cc.delayTime(0),
        //     cc.callFunc(function() {
        //         self._talkingAdi.onStoppedListening();
        //         if (self._playbackLength > 0) {
        //             cc.log("_playbackLength: " + self._playbackLength);
        //             jsb.AudioEngine.play2d(fileName);
        //             self._talkingAdi.adiTalk();
        //         }
        //         else
        //             self._talkingAdi.adiIdling();
        //     }),
        //     cc.delayTime(self._playbackLength),
        //     cc.callFunc(function() {
        //         NativeHelper.callNative("startFetchingAudio");
        //         self._talkingAdi.adiIdling();
        //     })));
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