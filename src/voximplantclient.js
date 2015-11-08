/**
 * VoximaplantClient constructor
 * */
function VoximaplantClient(aLogin_str, aPassword_str, aOptOptions_obj) {
    var lLogin_str = aLogin_str;
    var lPassword_str = aPassword_str;
    var lOptions_obj = {
        micRequired: true,
        progressTone: true,
        progressToneCountry: "RU",
        showDebugInfo: false
    };
    if (aOptOptions_obj && aOptOptions_obj instanceof Object) {
        for (var i in aOptOptions_obj) {
            lOptions_obj[i] = aOptOptions_obj[i];
        }
    }

    /*
     * VoximplantClient aviable statuses
     */
    this.NOT_INTIALIZED = 0;
    this.INTIALIZED = 1;
    this.MIC_VERIFIED = 2;
    this.CONNECTED = 3;
    this.LOGGED_IN = 4;
    this.CONNECTION_CLOSED = 5;
    
    /*
     * Event fires when calling started
     */
    this.onCallingStartedEvent = null;
    
    /*
     * Event fires when calling completed
     */
    this.onCallingCompletedEvent = null;
    
    /*
     * Event fires when VoximplantClient::init() method will be completed
     */
    this.onInitializationCompletedEvent = null;
    var self = this;
    var tryToExecuteInitializationCompletedEventHandler = function() {
        if (self.onInitializationCompletedEvent && typeof self.onInitializationCompletedEvent === 'function') {
            self.onInitializationCompletedEvent();
        }
    };

    var lStatus_int = this.NOT_INTIALIZED;
    var lInstance_vx_obj = null;
    var lCall_vx_obj = null;
    
    this.init = function () {
        if (lStatus_int < this.INTIALIZED) {
            lInstance_vx_obj = VoxImplant.getInstance();
            var self = this;
            lInstance_vx_obj.addEventListener(VoxImplant.Events.SDKReady, function() {
                lStatus_int = self.INTIALIZED;
                lInstance_vx_obj.addEventListener(VoxImplant.Events.MicAccessResult, function(e) {
                    if (e.result) {
                        lStatus_int = self.MIC_VERIFIED;
                    } else {
                        tryToExecuteInitializationCompletedEventHandler();
                    }
                });
                if (!lInstance_vx_obj.connected()) {
                    lInstance_vx_obj.addEventListener(VoxImplant.Events.ConnectionEstablished, function() {
                        lStatus_int = self.CONNECTED;
                        lInstance_vx_obj.addEventListener(VoxImplant.Events.AuthResult, function(e) {
                            if (e.result) {
                                lStatus_int = self.LOGGED_IN;
                            }
                            tryToExecuteInitializationCompletedEventHandler();
                        });
                        lInstance_vx_obj.login(lLogin_str, lPassword_str);
                    });
                    lInstance_vx_obj.addEventListener(VoxImplant.Events.ConnectionClosed, function() {
                        lStatus_int = self.CONNECTION_CLOSED;
                    });
                    lInstance_vx_obj.addEventListener(VoxImplant.Events.ConnectionFailed, function() {
                        lStatus_int = self.CONNECTION_CLOSED;
                        tryToExecuteInitializationCompletedEventHandler();
                    });
                    lInstance_vx_obj.connect();
                }
            });
            lInstance_vx_obj.init(lOptions_obj);
        }
    };
    
    /*
     * get current status of VoximplantClient
     */
    this.getStatus = function() {
        return lStatus_int;
    };
    
    /*
     * checks is calling allowed
     */
    this.isCallingAllowed = function() {
        return lStatus_int === self.LOGGED_IN;
    };
    
    /*
     * call to number
     */
    this.callToNumber = function(aNumber) {
        if (!this.isCallingAllowed() || lCall_vx_obj !== null) {
            return;
        }
        aNumber = aNumber.replace(/[^0-9]/g, '');
        lCall_vx_obj = lInstance_vx_obj.call(aNumber);
        var self = this;
        var closeCallFunc = function() {
            lCall_vx_obj.removeEventListener(VoxImplant.CallEvents.Failed, closeCallFunc);
            lCall_vx_obj.removeEventListener(VoxImplant.CallEvents.Disconnected, closeCallFunc);
            if (lCall_vx_obj.state() !== 'ENDED') {
                llCall_vx_obj.hangup();
            }
            llCall_vx_obj = null;

            if (self.onCallingCompletedEvent && typeof self.onCallingCompletedEvent === 'function') {
                self.onCallingCompletedEvent();
            }
        };
        lCall_vx_obj.addEventListener(VoxImplant.CallEvents.Failed, closeCallFunc);
        lCall_vx_obj.addEventListener(VoxImplant.CallEvents.Disconnected, closeCallFunc);

        if (this.onCallingStartedEvent && typeof this.onCallingStartedEvent === 'function') {
            this.onCallingStartedEvent();
        }
    };
    
    /*
     * hang up
     */
    this.hangUp = function() {
        if (!this.isCallingAllowed() || lCall_vx_obj === null) {
            return;
        }
        lCall_vx_obj.hangup();
    };
}