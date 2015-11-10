/**
 * @constructor
 * @param {String} aLogin_str Логин для приложения voximplant. Обязательный параметр
 * @param {String} aPassword_str Пароль для приложения voximplant. Обязательный параметр
 * @param {Object} aOptOptions_obj Набор необязательных параметров, которые принимаются для метода VoxImplant.getInstance().init(). Список параметров тут: http://voximplant.com/docs/references/websdk/VoxImplant.Config.html
 * 
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

    /**
     * Статус, указывающий, что VoximaplantClient еще не выполнял метод init()
     */
    this.NOT_INTIALIZED = 0;
	
	/**
     * Статус, указывающий, что VoximaplantClient уже выполнил метод init()
     */
    this.INTIALIZED = 1;
	
	/**
     * Статус, указывающий, что у пользователя доступен микрофон. Если микрофон не доступен, статус будет INTIALIZED
     */
    this.MIC_VERIFIED = 2;
	
	/**
     * Статус, указывающий, что клиент подключился к серверу voximplant. Если по каким-то причинам подключиться не удалось, статус будет: MIC_VERIFIED
     */
    this.CONNECTED = 3;
	
	/**
     * Статус, указывающий, что клиент успешно авторизовался на сервере voximplant. 
	 * Если по каким-то причинам авторизоваться не удалось, статус будет: CONNECTED
	 * Единственный статус, при котором возможно совершать звонки
     */
    this.LOGGED_IN = 4;
	
	/**
     * Статус, указывающий, что у клиента подключился к серверу voximplant, но по каким-то причинам подключение разорвалось.
     */
    this.CONNECTION_CLOSED = 5;
    
    /**
     * При начале обработки звонка воксимплантом, обрабатывается эта функция, если ей присвоили значение
     */
    this.onCallingStartedEvent = null;
    
    /**
     * При завершении звонка, обрабатывается эта функция, если ей присвоили значение
     */
    this.onCallingCompletedEvent = null;
    
    /**
     * При окончании работы функции VoximplantClient::init(), обрабатывается эта функция, если ей присвоили значение
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
    
    /**
     * Получить текущий статус VoximplantClient. 
	 * Доступные статусы: NOT_INTIALIZED, INTIALIZED, MIC_VERIFIED, CONNECTED, LOGGED_IN, CONNECTION_CLOSED
	 * @return {Integer}
     */
    this.getStatus = function() {
        return lStatus_int;
    };
    
    /**
     * Проверяем, разрешен ли звонок
	 * @return {Boolean}
     */
    this.isCallingAllowed = function() {
        return lStatus_int === self.LOGGED_IN;
    };
    
    /**
     * Звоним на номер
	 * 
	 * @param{String} aNumber телефонный номер на который звоним
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
                lCall_vx_obj.hangup();
            }
            lCall_vx_obj = null;

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
    
    /**
     * Завершить звонок
     */
    this.hangUp = function() {
        if (!this.isCallingAllowed() || lCall_vx_obj === null) {
            return;
        }
        lCall_vx_obj.hangup();
    };
}