# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import utils
import requests 
from requests.auth import HTTPBasicAuth
import logging



app = Flask(__name__)
CORS(app)
logger = logging.getLogger('gunicorn.error')
logger.setLevel(logging.INFO)

#Constants

#Oauth-app credentials for nmrlipids-user-authenticator 
ClientID =  os.getenv("OAUTH_ID")
ClientSecret = os.getenv("OAUTH_SECRET")


@app.route('/awake', methods=['GET','OPTIONS'])
def awake():
    return "<h1> Server is awake!<h1>", 200


@app.route('/verifyCode', methods=['POST', 'OPTIONS'])
def verifyCode():
    """
    Endpoint to check users permissions with Github, runs after user has logged  in.
    """

    if request.method == 'OPTIONS':
       return '', 200

    code = request.get_json().get("code")
    if not code:
        return jsonify({"error": "Missing code parameter"}), 400

    url = "https://github.com/login/oauth/access_token"

    payload = {
        "client_id": ClientID,
        "client_secret": ClientSecret,
        "code": code
    }

    headers = {"Accept": "application/json"}
    response = requests.post(url, data=payload, headers=headers)
    data = response.json()
    access_token = data.get("access_token")

    if not access_token:
        return jsonify({"authenticated": False}), 401

    # Get user info
    user_info = requests.get(
        "https://api.github.com/user",
        headers={"Authorization": f"Bearer {access_token}"}
    ).json()
    username = user_info.get("login")

    # Check their push/admin access on the repo
    admin_status = utils.user_has_push_access(access_token)

    return jsonify({
        "authenticated": True,
        "token": access_token,
        "username": username,
        "admin_status": admin_status
    })


@app.route('/user-admin-check', methods=['POST'])
def user_admin_check():
    """
    #Endpoint for refreshing molcule lists for compositions
    """
    auth = request.headers.get('Authorization','')
    if not auth.startswith('Bearer '):
        return jsonify(error="Missing token"), 401
    user_token = auth.split()[1]

    if not utils.user_has_push_access(user_token):
        return jsonify(error="Insufficient privileges"), 403

    return jsonify(authorized=True), 200



def authorizeToken(access_token):
    """
    #Method for checking validity of user token. 
    """
    url = f"https://api.github.com/applications/{ClientID}/token"
    headers = {"Accept": "application/vnd.github+json"}
    data = {"access_token": access_token}

    try:
        response = requests.post(url, auth=HTTPBasicAuth(ClientID, ClientSecret), headers=headers, json=data)
        
        if response.status_code == 200:
            return response.json(), None, 200
        elif response.status_code == 404:
            return None, "Token not found or invalid", 404
        elif response.status_code == 401:
            return None, "Bad credentials (check client_id and client_secret)", 401
        else:
            return None, f"Unexpected error: {response.text}", response.status_code

    except Exception as e:
        return None, str(e), 500

@app.route('/upload', methods=['POST'])
def upload_file():
    """
    #Endpoint to upload info.yml file to repository 
    """
    token_pre = request.headers.get('authorization')
    token = token_pre.split(' ')[1] if token_pre and " " in token_pre else None

    if not token:
        return jsonify({'error': 'Missing or malformed Authorization header'}), 400

    response,error,err_code = authorizeToken(token)
    if(error):
        return error,err_code 
    if not request.is_json:
        return jsonify({'error': 'Content-Type must be application/json'}), 400

    data = request.get_json()
    if data is None:
        return jsonify({'error': 'Malformed or empty JSON body'}), 400

    user_name   = data.pop('userName', None)
    logger.info(f"User name: {user_name}")
    base_branch = data.pop('branch',   None)
    if not user_name or not base_branch:
        return jsonify({'error': 'Missing userName or branch in JSON'}), 400

    if not utils.is_input_valid(data):
        return jsonify({'error': 'Validation of info.yml failed, check required keys'}), 400

    commit_url,commit_branch = utils.push_to_repo_yaml(data,user_name)

    url = utils.create_pull_request_to_target(
        head_branch=commit_branch,
        title=f"Upload Portal: Simulation files from {user_name}",
        body=f"""\
This PR contains simulation files uploaded by {user_name} through the NMRlipids upload portal.

Processing of simulation data will happen after approval.
"""
)
    return jsonify(message="Uploaded!", pullUrl=url), 200
 

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)


