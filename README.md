# VoximplantClient
Javascript клиент для звонков через сервис [voximplant.com](http://www.voximplant.com)

## Для каких задач подойдет?
Данный клиент разрабатывался для двух задач:
* звонки пользователям(например, с панели администратора)
* звонки с сайта на контактный номер   

Конечно же, это совершенно одна и та же задача. Единственное, в первом случае 
стоит инициализировать клиент для звонков только тогда, когда пользователь 
непосредственно решил позвонить(поскольку в этот момент появится диалоговое
окно браузера о подтверждении доступа к микрофону). Во втором же случае можно 
клиент инициализировать сразу, поскольку предполагается частое совершение звонков.   
**Присутствует ограничение:** нельзя совершать несколько параллельных звонков из одного клиента

## Как использовать?
### Сценарий 1
При загрузке страницы инициализируем клиент, передавая логин и пароль:
```
var voximplantClient = new VoximaplantClient('app_login', 'app_pw');
voximplantClient.init();
```
После, звоним по номеру:
```
voximplantClient.callToNumber('phone_number');
```
...и, когда надо, кладем трубку:
```
voximplantClient.hangUp();
```

### Сценарий 2
Как было уже сказано выше, инициализировать клиент лучше перед непосредственным
звонком. Поэтому, при загрузке страницы мы только создаем экземпляр класса клиента:
```
var voximplantClient = new VoximaplantClient('app_login', 'app_pw');
```
Потом, когда созрела необходимость звонка, небходимо добавить обработчик на окончание 
инициализации клиента и в этом обработчике уже звонить:
```
voximplantClient.onInitializationCompletedEvent = function () {
    if (voximplantClient.isCallingAllowed()) {
        voximplantClient.callToNumber('phone_number');
    } else {
        alert("Инициализация не завершилась корректным результатом. Позвонить не удастся");
    }
}
```
...и, когда надо, кладем трубку:
```
voximplantClient.hangUp();
```

### Улучшаем отказоустойчивость
В текущей реализации может произойти такая ситуация: мы соединились с серовером voximplant, но, по каким-то причинам, вскоре соединение прекратилось. В этом случае наш клиент не даст позвонить пользователю, но можно указать по какой причине. Это делается с помощью такого кода:
```
if (voximplantClient.isCallingAllowed()) {
		voximplantClient.callToNumber(callingNumber);
	} else {
		var msg_text = '';
		var voximplantStatus = voximplantClient.getStatus();
		switch (voximplantStatus) {
			case voximplantClient.INTIALIZED:
				msg_text = 'Не удается сделать звонок. Нет доступа к микрофону';
				break;
			case voximplantClient.MIC_VERIFIED:
				msg_text = 'Не удается сделать звонок. Нет соединения с сервером voximplant';
				break;
			case voximplantClient.CONNECTED:
				msg_text = 'Не удается сделать звонок. Не удалось авторизоваться на сервере voximplant';
				break;
			case voximplantClient.CONNECTION_CLOSED:
				msg_text = 'Не удается сделать звонок. Соединение с сервером voximplant закрыто. Пожалуйста, перезайдите в панель администратора и попробуйте снова.';
				break;
		}
		alert(msg_text);
	}
```