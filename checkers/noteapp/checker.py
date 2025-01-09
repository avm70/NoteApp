#!/usr/local/bin/python3

import sys
import requests
import re
import string
import random
from names_generator import generate_name
from bs4 import BeautifulSoup

def generate_random_string():
    allowed_chars = string.ascii_uppercase + string.digits
    random_part = ''.join(random.choice(allowed_chars) for _ in range(31))
    return random_part + '='

def check():
    username = generate_name()
    session = requests.Session()
    data = {
        'username': username
    }
    response = session.post(url_reg, data=data)
    if response.status_code == 200:
        match = re.search(r"Your password: (\S+)", response.text)
        if match:
            password = match.group(1)
        else:
            print("No password.", file=sys.stderr)
            sys.exit(103)
    else:
        print("Registration failed.", file=sys.stderr)
        sys.exit(103)
    response = session.get(url, data="")
    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')
        li_elements = soup.find_all('li')
        li_texts = [li.get_text() for li in li_elements]
        if username in li_texts:
            login_data = {
                'username': username,
                'password': password
            }
        else:
            print("No username in list.", file=sys.stderr)
            sys.exit(103)
    else:
        print("Main page error.", file=sys.stderr)
        sys.exit(103)
    response = session.post(url_login, data=login_data)
    if response.status_code != 200:
        print("Login error.", file=sys.stderr)
        sys.exit(103)
    note = generate_random_string()
    note_data = {
        'note': note
    }
    store_response = session.post(url_store_note, data=note_data)
    if store_response.status_code != 200:
        print("Store note error.", file=sys.stderr)
        sys.exit(103)
    show_response = session.get(url_show_note)
    if show_response.status_code == 200:
        note_json = show_response.json()
        if note_json.get('success', False):
            if note_json.get('note') != note:
                print("Wrong note.", file=sys.stderr)
                sys.exit(103)
            else:
                sys.exit(101)
    else:
        print("Show note error.", file=sys.stderr)
        sys.exit(103)

def put(flag):
    username = generate_name()
    session = requests.Session()
    data = {
        'username': username
    }
    response = session.post(url_reg, data=data)
    if response.status_code == 200:
        match = re.search(r"Your password: (\S+)", response.text)
        if match:
            password = match.group(1)
        else:
            print("No password.", file=sys.stderr)
            sys.exit(103)
    else:
        print("Registration failed.", file=sys.stderr)
        sys.exit(103)
    login_data = {
        'username': username,
        'password': password
    }
    response = session.post(url_login, data=login_data)
    if response.status_code != 200:
        print("Login error.", file=sys.stderr)
        sys.exit(103)
    note_data = {
        'note': flag
    }
    store_response = session.post(url_store_note, data=note_data)
    if store_response.status_code == 200:
        print("flag is in")
        print(username + " " + password, file=sys.stderr)
        sys.exit(101)
    else:
        print("Store note error.", file=sys.stderr)
        sys.exit(103)
    
def get(username, password, flag):
    login_data = {
        'username': username,
        'password': password
    }
    session = requests.Session()
    response = session.post(url_login, data=login_data)
    if response.status_code != 200:
        print("Login error.", file=sys.stderr)
        sys.exit(103)
    show_response = session.get(url_show_note)
    if show_response.status_code == 200:
        note_json = show_response.json()
        if note_json.get('success', False):
            if note_json.get('note') != flag:
                print("Wrong flag.", file=sys.stderr)
                sys.exit(103)
            else:
                sys.exit(101)
    else:
        print("Show note error.", file=sys.stderr)
        sys.exit(103)

def info():
    print('{"vulns": 3, "timeout": 30, "attack_data": ""}', flush=True, end="")
    exit(101)

if __name__ == '__main__':
    regime = sys.argv[1]
    address = sys.argv[2]
    port = "3075"
    url_reg = "http://" + address + ":" + port + "/register"
    url_login = "http://" + address + ":" + port + "/login"
    url = "http://" + address + ":" + port + "/"
    url_store_note = "http://" + address + ":" + port + "/store_note"
    url_show_note = "http://" + address + ":" + port + "/show_note"
    if regime == "check":
        check()
    elif regime == "put":
        id = sys.argv[3]
        flag = sys.argv[4]
        put(flag)
    elif regime == "get":
        id = sys.argv[3]
        flag = sys.argv[4]
        data = id.split(" ")
        get(data[0], data[1], flag)
    elif regime == "info":
        info()
    else:
        sys.exit(110)
