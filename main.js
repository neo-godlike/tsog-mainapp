/**
 * A brief explanation for "project.json":
 * Here is the content of project.json file, this is the global configuration for your game, you can modify it to customize some behavior.
 * The detail of each field is under it.
 {
    "project_type": "javascript",
    // "project_type" indicate the program language of your project, you can ignore this field

    "debugMode"     : 1,
    // "debugMode" possible values :
    //      0 - No message will be printed.
    //      1 - cc.error, cc.assert, cc.warn, cc.log will print in console.
    //      2 - cc.error, cc.assert, cc.warn will print in console.
    //      3 - cc.error, cc.assert will print in console.
    //      4 - cc.error, cc.assert, cc.warn, cc.log will print on canvas, available only on web.
    //      5 - cc.error, cc.assert, cc.warn will print on canvas, available only on web.
    //      6 - cc.error, cc.assert will print on canvas, available only on web.

    "showFPS"       : true,
    // Left bottom corner fps information will show when "showFPS" equals true, otherwise it will be hide.

    "frameRate"     : 60,
    // "frameRate" set the w19ed frame rate for your game, but the real fps depends on your game implementation and the running environment.

    "id"            : "gameCanvas",
    // "gameCanvas" sets the id of your canvas element on the web page, it's useful only on web.

    "renderMode"    : 0,
    // "renderMode" sets the renderer type, only useful on web :
    //      0 - Automatically chosen by engine
    //      1 - Forced to use canvas renderer
    //      2 - Forced to use WebGL renderer, but this will be ignored on mobile browsers

    "engineDir"     : "frameworks/cocos2d-html5/",
    // In debug mode, if you use the whole engine to develop your game, you should specify its relative path with "engineDir",
    // but if you are using a single engine file, you can ignore it.

    "modules"       : ["cocos2d"],
    // "modules" defines which modules you will need in your game, it's useful only on web,
    // using this can greatly reduce your game's resource size, and the cocos console tool can package your game with only the modules you set.
    // For details about modules definitions, you can refer to "../../frameworks/cocos2d-html5/modulesConfig.json".

    "jsList"        : [
    ]
    // "jsList" sets the list of js files in your game.
 }
 *
 */

var expectDynamicLink = false;

cc.game.onStart = function(){
    if(!cc.sys.isNative && document.getElementById("cocosLoading")) //If referenced loading.js, please remove it
        document.body.removeChild(document.getElementById("cocosLoading"));

    cc.log(jsb.fileUtils.getWritablePath());

    // Pass true to enable retina display, disabled by default to improve performance
    cc.view.enableRetina(false);
    // Adjust viewport meta
    cc.view.adjustViewPort(true);

    // Setup the resolution policy and design resolution size
    var mediumResource = { size: cc.size(960, 640), directory: "res/SD" };
    var largeResource = { size: cc.size(2730, 1536), directory: "res/HD" };
    var designResolutionSize = cc.size(960, 640);
    var frameSize = cc.director.getOpenGLView().getFrameSize();

    cc.view.setDesignResolutionSize(
        designResolutionSize.width,
        designResolutionSize.height,
        cc.ResolutionPolicy.FIXED_HEIGHT);

    if (cc.sys.isNative) {
        var searchPaths = jsb.fileUtils.getSearchPaths();

        // if (frameSize.height >= largeResource.size.height) {
        //     searchPaths.push(largeResource.directory);
        //     cc.director.setContentScaleFactor(largeResource.size.height/designResolutionSize.height);
        //     cc.log("Use largeResource");
        // } else {//if (frameSize.height >= mediumResource.size.height) {
            searchPaths.push(mediumResource.directory);
            cc.director.setContentScaleFactor(mediumResource.size.height/designResolutionSize.height);
        //     cc.log("Use mediumResource");
        // } else {
        //     searchPaths.push(smallResource.directory);
        //     cc.director.setContentScaleFactor(smallResource.size.height/designResolutionSize.height);
        //     cc.log("Use smallResource");
        // }
        searchPaths.push("res");
        jsb.fileUtils.setSearchPaths(searchPaths);
    }
    else {
        // web html5
        cc.view.setDesignResolutionSize(designResolutionSize.width,
            designResolutionSize.height,
            cc.ResolutionPolicy.SHOW_ALL);

        jsb.fileUtils.setSearchPaths("res/SD");
    }
    cc.log(cc.winSize.width + " - " + cc.winSize.height);

    // The game will be resized when browser size change
    cc.view.resizeWithBrowserSize(true);
    //load resources
    cc.LoaderScene.preload(g_resources, function () {
        KVDatabase.setupInstance(CocosKVImpl);

        setLanguage();

        GameObject.setupInstance();
        RequestsManager.setupInstance();
        ConfigStore.setupInstance(true);
        AudioListener.setupInstance();
        SpeechRecognitionListener.setupInstance();
        GameListener.setupInstance();
        IAPManager.setupInstance();
        CharacterManager.setupInstance();
        AudioManager.setupInstance();
        // GameObjectsProgress.setupInstance();
        CustomLabel.setupInstance();
        // AssetManager.setupInstance();
        // SceneFlowController.setupInstance();

        // start new session, reset trophiesEarned
        // KVDatabase.getInstance().set("trophiesEarned", 0);

        Global.restoreCachedState();

        input.SingleTouch.setEnable(true);

        // NativeHelper.callNative("startRestClock", [GAME_CONFIG.timeToPauseGame]);

        cc.spriteFrameCache.addSpriteFrames(res.Forest_plist);
        cc.spriteFrameCache.addSpriteFrames(res.Smoke_effect_plist);
        cc.spriteFrameCache.addSpriteFrames(res.Sparkle_effect_plist);
        cc.spriteFrameCache.addSpriteFrames(res.Hud_plist);
        cc.spriteFrameCache.addSpriteFrames(res.Tutorial_plist);
        cc.spriteFrameCache.addSpriteFrames(res.School_plist);
        cc.spriteFrameCache.addSpriteFrames(res.Abc_plist);
        cc.spriteFrameCache.addSpriteFrames(res.Account_plist);
        cc.spriteFrameCache.addSpriteFrames(res.NewAccount_Plist);
        cc.spriteFrameCache.addSpriteFrames(res.Figure_Game_Plist);
        cc.spriteFrameCache.addSpriteFrames(res.Card_game_plist);
        cc.spriteFrameCache.addSpriteFrames(res.Train_game_plist);
        cc.spriteFrameCache.addSpriteFrames(res.Tree_game_plist);
        cc.spriteFrameCache.addSpriteFrames(res.Map_Plist);
        cc.spriteFrameCache.addSpriteFrames(res.Level_Dialog_plist);
        cc.spriteFrameCache.addSpriteFrames(res.AR_Lands_plist);
        cc.spriteFrameCache.addSpriteFrames(res.AR_Obstacles_plist);
        cc.spriteFrameCache.addSpriteFrames(res.AR_Boosters_plist);
        cc.spriteFrameCache.addSpriteFrames(res.Homescreen_plist);
        cc.spriteFrameCache.addSpriteFrames(res.AlpharacingBG_plist);
        cc.spriteFrameCache.addSpriteFrames(res.Mission_Page_Plist);
        cc.spriteFrameCache.addSpriteFrames(res.Features_Menu_Plist);

        AudioManager.getInstance().preload(res.alpha_racing_mp3);
        AudioManager.getInstance().preload(res.back_sound_mp3);
        AudioManager.getInstance().preload(res.balloon_pop_mp3);
        AudioManager.getInstance().preload(res.collect_coin_mp3);
        AudioManager.getInstance().preload(res.collect_diamond_mp3);
        AudioManager.getInstance().preload(res.home_click_mp3);
        AudioManager.getInstance().preload(res.incorrect_word_mp3);
        AudioManager.getInstance().preload(res.level_mp3);
        AudioManager.getInstance().preload(res.map_mp3);
        AudioManager.getInstance().preload(res.mega_win_level_finish_mp3);
        AudioManager.getInstance().preload(res.ui_close_mp3);
        AudioManager.getInstance().preload(res.you_win_mp3);
        
        cc.audioEngine.setMusicVolume(1);

        // TEST
            // cc.director.runScene(new WelcomeScene());
            // cc.director.runScene(new HomeScene());
            // cc.director.runScene(new TalkingAdiScene());
            // cc.director.runScene(new MapScene());
            // cc.director.runScene(new AlphaRacingScene([]));
            // cc.director.runScene(new FirebaseScene());
            // cc.director.runScene(new RewardScene(200,300));
            // cc.director.runScene(new GrownUpMenuScene());
            // cc.director.runScene(new MissionPageAfterLoginScene());
        // END TEST
        cancelLocalNotificationsWithTag(kTagDailyLocalNotif);
        cancelLocalNotificationsWithTag(kTagTwoDaysLocalNotif);
        if (TSOG_DEBUG)
            startNewDailyLocalNotif();

        if (KVDatabase.getInstance().getString("game_first_session", false) !== false) {
            KVDatabase.getInstance().set("game_first_session", false);
            expectDynamicLink = true;
        } else 
            KVDatabase.getInstance().set("game_first_session", true);

        KVDatabase.getInstance().set("game_new_session", true);

        var authenticateUID = KVDatabase.getInstance().getString("authenticateUID", "");
        debugLog("authenticateUID: " + authenticateUID);
        if (authenticateUID) {
            FirebaseManager.getInstance().authenticate(function(succeed, linked) {
                if  (succeed) {
                    if (User.getCurrentUser().isSubscriptionValid()) {
                        cc.director.runScene(new WelcomeScene());
                    } else {
                        cc.director.runScene(new MonthlySubscriptionScene());
                    }
                }
            });    
        } else {
            // AnalyticsManager.getInstance().logCustomEvent(EVENT_MISSION_PAGE_1);
            // cc.director.runScene(new MissionPageBeforeLoginScene());
            cc.director.runScene(new MonthlySubscriptionScene());
        }

        AnalyticsManager.getInstance().logEventAppOpen();

        cc.eventManager.addCustomListener(cc.game.EVENT_SHOW, function () {
            cc.spriteFrameCache.addSpriteFrames(res.Forest_plist);
            cc.spriteFrameCache.addSpriteFrames(res.Smoke_effect_plist);
            cc.spriteFrameCache.addSpriteFrames(res.Sparkle_effect_plist);
            cc.spriteFrameCache.addSpriteFrames(res.Hud_plist);
            cc.spriteFrameCache.addSpriteFrames(res.Tutorial_plist);
            cc.spriteFrameCache.addSpriteFrames(res.School_plist);
            cc.spriteFrameCache.addSpriteFrames(res.Abc_plist);
            cc.spriteFrameCache.addSpriteFrames(res.Account_plist);
            cc.spriteFrameCache.addSpriteFrames(res.NewAccount_Plist);
            cc.spriteFrameCache.addSpriteFrames(res.Figure_Game_Plist);
            cc.spriteFrameCache.addSpriteFrames(res.Card_game_plist);
            cc.spriteFrameCache.addSpriteFrames(res.AR_Obstacles_plist);
            cc.spriteFrameCache.addSpriteFrames(res.AR_Boosters_plist);
            cc.spriteFrameCache.addSpriteFrames(res.Character_plist);
            cc.spriteFrameCache.addSpriteFrames(res.Homescreen_plist);
            cc.spriteFrameCache.addSpriteFrames(res.Mission_Page_Plist);
            cc.spriteFrameCache.addSpriteFrames(res.Features_Menu_Plist);
        });
    }, this);
};
cc.game.run();