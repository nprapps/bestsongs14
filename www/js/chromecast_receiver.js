var CHROMECAST_RECEIVER = (function() {
    var obj = {};

    var MESSAGE_DELIMITER = 'NPRVIZ';
    var _messageHandlers = {};
    var _messageRegex = new RegExp('(\\S+)' + MESSAGE_DELIMITER + '(.+)$');

    obj.setup = function() { 
        var castReceiverManager = cast.receiver.CastReceiverManager.getInstance();
        var customMessageBus = castReceiverManager.getCastMessageBus(APP_CONFIG.CHROMECAST_NAMESPACE);

        customMessageBus.onMessage = onReceiveMessage; 

        castReceiverManager.start();
    }

    var onReceiveMessage = function(e) {
        var match = e.data.match(_messageRegex);

        var messageType = match[1];
        var message = match[2];

        _fire(messageType, message);
    }

    var _fire = function(messageType, message) {
        if (messageType in _messageHandlers) {
            for (var i = 0; i < _messageHandlers[messageType].length; i++) {
                _messageHandlers[messageType][i](message);
            }
        }
    };

    obj.onMessage = function(messageType, callback) {
        if (!(messageType in _messageHandlers)) {
            _messageHandlers[messageType] = [];
        }

        _messageHandlers[messageType].push(callback);
    }

    return obj;
}());
