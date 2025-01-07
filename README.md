# NoteApp

Приложение позволяет пользователям регистрироваться и сохранять записи на сервере.

## Уязвимости
1. Уязвимая генерация пароля зависимая от времени регистрации.
2. SQL инъекция на функции входа в приложение.
3. Подмена coockie файлов из-за неправильного хранения.

## Запуск
### App
```
cd app
docker-compose up
```
### Checker
При запуске режиме "put" после успешного выполнения в stdout выводится новый id для флага вида "username password". Режим "get" работает с использованием изменённого в режиме "put" id.
```
cd checker
pip install -r requirements.txt
python3 checker <regime> <hostname> ...
```
### Exploits
```
cd exploits
pip install -r requirements.txt
python3 sql.py <hostname>
python3 pass.py <hostname>
python3 coockie.py <hostname>
```
