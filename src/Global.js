var Global = Global || {};

Global.NumberItems = null;
Global.NumberGamePlayed = 0;
Global.NumberRoomPlayed = 0;
Global.NumberForestPlayed = 0;

Global.saveCurrentState = function() {
    Global.cacheData();
    ConfigStore.getInstance().cacheData();
    SceneFlowController.getInstance().cacheData();
}

Global.restoreCachedState = function() {
    Global.populateData();
    ConfigStore.getInstance().populateData();
    SceneFlowController.getInstance().populateData();
}

Global.clearCachedState = function() {
    Global.clearData();
    ConfigStore.getInstance().clearData();
    SceneFlowController.getInstance().clearData();
}

Global.cacheData = function() {
    KVDatabase.getInstance().set("globalCache", JSON.stringify({
        numberItems: Global.NumberItems,
        numberGamePlayed: Global.NumberGamePlayed,
        numberRoomPlayed: Global.NumberRoomPlayed,
        numberForestPlayed: Global.NumberForestPlayed
    }));
}

Global.populateData = function() {
    var data = KVDatabase.getInstance().getString("globalCache");
    if (data == null || data == "")
        return;

    data = JSON.parse(data);

    Global.NumberItems = data.numberItems || GAME_CONFIG.objectStartCount;
    Global.NumberGamePlayed = data.numberGamePlayed || 0;
    Global.NumberRoomPlayed = data.numberRoomPlayed || 0;
    Global.NumberForestPlayed = data.numberForestPlayed || 0;
}

Global.clearData = function() {
    Global.NumberItems = GAME_CONFIG.objectStartCount;
    Global.NumberGamePlayed = 0;
    Global.NumberRoomPlayed = 0;
    Global.NumberForestPlayed = 0;

    KVDatabase.getInstance().remove("globalCache");
}
