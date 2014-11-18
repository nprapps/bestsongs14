var CHROMECAST_SENDER = (function() {
    var obj = {};

    var MESSAGE_DELIMITER = 'NPRVIZ';
    var _session = null;
    var _readyCallback = null;
    var _startedCallback = null;
    var _stoppedCallback = null;

    /*
     * Initialize chromecast environment.
     */
    obj.setup = function(readyCallback, startedCallback, stoppedCallback) {
        _readyCallback = readyCallback;
        _startedCallback = startedCallback;
        _stoppedCallback = stoppedCallback;

        var sessionRequest = new chrome.cast.SessionRequest(APP_CONFIG.CHROMECAST_APP_ID);

        var apiConfig = new chrome.cast.ApiConfig(
            sessionRequest,
            sessionListener,
            receiverListener,
            chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
        );

        chrome.cast.initialize(apiConfig, onInitSuccess, onInitError);
    }

    /*
     * Listen for existing sessions with the receiver.
     */
    var sessionListener = function(session) {
        _session = session;
        _session.addUpdateListener(sessionUpdateListener);

        if (_startedCallback) {
            _startedCallback();
        }
    }

    /*
     * Listen for changes to the session status.
     */
    var sessionUpdateListener = function(isAlive) {
        if (!isAlive) {
            if (_stoppedCallback) {
                _stoppedCallback();
            }
        }
    }

    /*
     * Listen for receivers to become available.
     */
    var receiverListener = function(e) {
        if (e === chrome.cast.ReceiverAvailability.AVAILABLE) {
            if (_readyCallback) {
                _readyCallback();
            }
        }
    }

    /*
     * Environment successfully initialized.
     */
    var onInitSuccess = function(e) {}

    /*
     * Error initializing.
     */
    var onInitError = function(e) {}

    /*
     * Start casting.
     */
    obj.startCasting = function() {
        chrome.cast.requestSession(onRequestSessionSuccess, onRequestSessionError);
    }

    /*
     * Casting session begun successfully.
     */
    var onRequestSessionSuccess = function(session) {
        _session = session;
        _session.addUpdateListener(sessionUpdateListener);

        if (_startedCallback) {
            _startedCallback();
        }
    }

    /*
     * Casting session failed to start.
     */
    var onRequestSessionError = function(e) {}

    /*
     * Stop casting.
     */
    obj.stopCasting = function() {
        _session.stop(onSessionStopSuccess, onSessionStopError);
    }

    /*
     * Inform client the session has stopped.
     */
    var onSessionStopSuccess = function() {
        if (_stoppedCallback) {
            _stoppedCallback();
        }
    }

    var onSessionStopError = function() {}

    /*
     * Send a message to the receiver.
     */
    obj.sendMessage = function(messageType, message) {
        _session.sendMessage(
            APP_CONFIG.CHROMECAST_NAMESPACE,
            messageType + MESSAGE_DELIMITER + message,
            onSendSuccess,
            onSendError
        );
    }

    /*
     * Successfully sent message to receiver.
     */
    var onSendSuccess = function(message) {}

    /*
     * Error sending message to receiver.
     */
    var onSendError = function(message) {}

    return obj;
}());
