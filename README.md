# NoteApp

Приложение позволяет пользователям регистрироваться и сохранять записи на сервере.

## Уязвимости
1. Уязвимая генерация пароля зависимая от времени регистрации.
2. SQL инъекция на функции входа в приложение.
3. Подмена coockie файлов из-за неправильного хранения.

## Запуск
### App
```
cd services/noteapp
docker build -t node-app .
docker-compose up
```
### Checker
При запуске в режиме "put" после успешного выполнения в stdout выводится новый id для флага вида "username password". Режим "get" работает с использованием изменённого в режиме "put" id.
```
cd checkers/noteapp
python3 noteapp.checker.py <regime> <hostname> ...
```
### Exploits
```
cd sploits/noteapp
python3 sql.py <hostname>
python3 pass.py <hostname>
python3 coockie.py <hostname>
```
