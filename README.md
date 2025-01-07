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
```
cd checker
pip install -r requirements.txt
python3 checker <arg1> <arg2> ...
```
### Exploits
```
cd exploits
pip install -r requirements.txt
python3 sql.py <hostname>
python3 pass.py <hostname>
python3 coockie.py <hostname>
```
