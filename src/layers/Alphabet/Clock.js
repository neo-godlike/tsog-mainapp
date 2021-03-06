var Clock = cc.Node.extend({
	_totalSeconds: 0,
	_countDownClock: null,
    _elapseSeconds: 0,
	callback: null,

	ctor: function(totalTimes, callback) {
		this._super();
		this._totalSeconds = totalTimes;
		this.callback = callback;
		this.createCountDownClockLabel();
		this.activeCountDownClock();
	},

    setClockScale: function(scale) {
        this._countDownClock.scale = scale;
    },

    activeCountDownClock: function() {
        this.schedule(this.countDownClockAction, CLOCK_INTERVAL, this._totalSeconds);
    },

    setIsClockInTalkingAdi: function(value) {
        if (value) {
            this.removeChild(this._countDownClock);

            var clock = new cc.Sprite("timer.png");
            // clock.x = -clock.width;
            clock.y = 20 + clock.height/2;
            this.addChild(clock);

            var text = this.getCurrentTime();
            var countDownClockLabel = new cc.LabelTTF(text, "Arial", 20);
            countDownClockLabel.color = cc.color.BLACK;
            this._countDownClock = countDownClockLabel;
            this.addChild(countDownClockLabel);
        }
    },

    createCountDownClockLabel: function() {
        font = res.HudFont_fnt;
        var text = this.getCurrentTime();
        var countDownClockLabel = new cc.LabelBMFont(text, font);

        // countDownClockLabel.color = cc.color("#ffd902");
        countDownClockLabel.y = this.height + 2;
        this._countDownClock = countDownClockLabel;
        this.addChild(countDownClockLabel);
    },

    countDownClockAction: function() {
        this._totalSeconds -= 1;
        this._elapseSeconds += 1;
        var currentTime = this.getCurrentTime();
        this._countDownClock.setString(currentTime);

        if (this.callback && this._totalSeconds == 0) {
            this.stopClock();
            this.callback();
        }
    },

    getCurrentTime: function() {
    	var minutes = Math.floor(this._totalSeconds/60);
        var seconds = this._totalSeconds % 60;
        var currentTime = "";
        if (seconds < 10) {
            currentTime = minutes + ":0" + seconds
        }
        else
            currentTime = minutes + ":" + seconds;

        return currentTime;
    },

    getElapseTime: function() {
        return this._elapseSeconds;
    },

    getRemainingTime: function() {
        return this._totalSeconds;
    },

    stopClock: function() {
        this.unschedule(this.countDownClockAction);
    },
})