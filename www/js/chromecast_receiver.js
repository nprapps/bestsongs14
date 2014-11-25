var CHROMECAST_RECEIVER = (function() {
    var obj = {};

    var MESSAGE_DELIMITER = 'NPRVIZ';
    var _messageHandlers = {};
    var _messageRegex = new RegExp('(\\S+)' + MESSAGE_DELIMITER + '(.+)$');
    var _senderID = null;
    var _castReceiverManager = null;
    var _customMessageBus = null;

    obj.setup = function() {
        _castReceiverManager = cast.receiver.CastReceiverManager.getInstance();
        _customMessageBus = _castReceiverManager.getCastMessageBus(APP_CONFIG.CHROMECAST_NAMESPACE);

        _castReceiverManager.onReady = onCastReceiverReady;
        _customMessageBus.onMessage = onReceiveMessage;

        _castReceiverManager.start();
    }

    var onCastReceiverReady = function(e) {
        _senderID = e.data.launchingSenderId;
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

    obj.sendMessage = function(messageType, message) {
        _customMessageBus.broadcast(
            messageType + MESSAGE_DELIMITER + message
        );
        console.log('message sent');
    }

    return obj;
}());
