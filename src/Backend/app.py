# app.py
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import utils
from utils import get_composition_names,refresh_composition_file,user_has_push_access, update_databank
import json
import requests 
import jwt
from requests.auth import HTTPBasicAuth
import base64
from github import Github
from github import Auth

app = Flask(__name__)
CORS(app)

# Constants

ClientID =  "Ov23liS8svKowq4uyPcG"
ClientSecret = os.getenv("clientsecret")
jwt_key = os.getenv("jwtkey")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
authentication_repository="MagnusSletten/Databank"


@app.route('/app/awake', methods=['GET','OPTIONS'])
def awake():
    return "<h1> Server is awake!<h1>", 200

@app.route('/app/verifyCode', methods=['POST', 'OPTIONS'])
def verifyCode():

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
    admin_status = user_has_push_access(
        access_token,
        authentication_repository
    )

    return jsonify({
        "authenticated": True,
        "token": access_token,
        "username": username,
        "admin_status": admin_status
    })

@app.route('/app/refresh-composition', methods=['POST'])
def updateCompositionList():
    update_databank()
    auth = request.headers.get('Authorization','')
    if not auth.startswith('Bearer '):
        return jsonify(error="Missing token"), 401
    user_token = auth.split()[1]

    if not user_has_push_access(user_token, authentication_repository):
        return jsonify(error="Insufficient privileges"), 403

    # now safe to refresh…
    count = refresh_composition_file(os.path.join(os.path.dirname(__file__), 'static'))
    return jsonify(success=True, count=count), 200



@app.route('/app/molecules', methods=['GET'])
def list_molecules_root():
    return jsonify(get_composition_names()), 200


def authorizeToken(access_token):
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
 
@app.route('/app/upload', methods=['POST'])
def upload_file():
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
    base_branch = data.pop('branch',   None)
    if not user_name or not base_branch:
        return jsonify({'error': 'Missing userName or branch in JSON'}), 400

    if not utils.is_input_valid(data):
        return jsonify({'error': 'Validation failed'}), 400

    commit_url,commit_branch = utils.push_to_repo_yaml(data,user_name)

    url = utils.create_pull_request_to_target(
        head_ref=commit_branch,
        title= f"Simulation files from {user_name}",
        body=f"Processing of simulation data will happen after approval")

    return jsonify(message="Uploaded!", pullUrl=url), 200
 

if __name__ == '__main__':
    if not ClientSecret:
        raise ValueError("Missing client secret in environment!")
    utils.git_setup()
    utils.git_pull()
    # point at the real static folder
    static_dir = os.path.join(os.path.dirname(__file__), 'static')
    refresh_composition_file(static_dir)
    app.run(host='0.0.0.0', port=5001, debug=False)


