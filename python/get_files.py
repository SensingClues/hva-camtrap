import asyncio
import time

import requests

# bearer = ""

def fetch_token():
    url = "https://test.upload.sensingclues.org/oauth2/token/"
    username = 'HvA'
    password = 'AlleDagenZonneschijn2020'
    scope = 'list upload'
    client_id = r'a9467c4ae808fb8522e44b8e79a1ca85'
    client_secret = r'dLyEGsMHZouOousVEhPzjmDtRTvzqxTlT8UOF5y5'

    payload = {'username': username, 'password': password, 'scope': scope,
               'client_id': client_id,
               'client_secret': client_secret, 'redirect_uri': 'https://localhost',
               'grant_type': 'password'}

    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    response = requests.post(url, data=payload, json=headers)

    print(response.json())
    return response.json()


async def print_time():
    await asyncio.sleep(0.1)
    print(f"started at {time.strftime('%X')}")


async def sleep(delay, callback):
    global bearer
    # await asyncio.sleep(int(delay))
    # await asyncio.sleep(1)
    await asyncio.sleep(delay)
    print("FETCHING NEW TOKEN")
    response = await callback()
    await sleep(response['expires_in'], fetch_token)


async def get_files(bearer):
    # global bearer
    """"
    GET /filerun/api.php/account/info HTTP/1.1
    Authorization: Bearer 8vDeNtzJ8Nf1P0fH1YsvIubOMGttXpqOmupl3oD1
    Host: www.your-site.com
    """
    while bearer == "":
        print("bearer: ", bearer)
        await asyncio.sleep(0.1)
    url = "https://test.upload.sensingclues.org/api.php/files/browse/"
    client_id = r'a9467c4ae808fb8522e44b8e79a1ca85'
    client_secret = r'dLyEGsMHZouOousVEhPzjmDtRTvzqxTlT8UOF5y5'

    headers = {
        'Authorization': "Bearer {}".format(bearer),
        'path':'/',
        'itemType':'any',
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    response = requests.post(url, json=headers)

    print(response.json())


async def main():
    response = fetch_token()
    """wait for token exipration"""
    await asyncio.gather(
        sleep(response['expires_in'], fetch_token),
        get_files(response['access_token']),
        print_time()
    )
    print("DONE!")


if __name__ == "__main__":
    asyncio.run(main())
