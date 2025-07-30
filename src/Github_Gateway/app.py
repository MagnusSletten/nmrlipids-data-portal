# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import utils
import requests 
from requests.auth import HTTPBasicAuth
from github import Github, GithubException
import logging



app = Flask(__name__)
CORS(app)
logger = logging.getLogger('gunicorn.error')
logger.setLevel(logging.INFO)

#Constants

#Oauth-app credentials for nmrlipids-user-authenticator 
OAUTH_ID =  os.getenv("OAUTH_ID")
OAUTH_SECRET = os.getenv("OAUTH_SECRET")
gh = Github()
oauth_app = gh.get_oauth_application(OAUTH_ID, OAUTH_SECRET)

@app.route('/awake', methods=['GET'])
def awake():
    return "<h1> Server is awake!<h1>", 200


@app.route('/verifyCode', methods=['POST'])
def verify_code():
    """
    Exchange the OAuth code for a user token, fetch their GitHub username,
    and check push/admin access on the target repo.
    """
    try:
        code = request.get_json().get("code")
    except: 
        logger.error("Error parsing JSON")
        return jsonify({"error": "Error parsing JSON"}),400 
    if not code:
        return jsonify({"error": "Missing code parameter"}), 400

    try:
        access_token = oauth_app.get_access_token(code).token
        
        user_gh = Github(login_or_token=access_token)
        username = user_gh.get_user().login

    except GithubException as e:
        logger.error("OAuth exchange or user fetch failed: %s", e)
        return jsonify(error="GitHub OAuth exchange failed"), 502

    try:
        admin_status = utils.user_has_push_access(access_token)
    except Exception:
        logger.exception("Error checking push access")
        return jsonify(error="Authorization service error"), 500

    return jsonify({
        "authenticated": True,
        "token": access_token,
        "username": username,
        "admin_status": admin_status
    }), 200

@app.route('/user-admin-check', methods=['POST'])
def user_admin_check():
    """
    #Endpoint for checking whether user is authorized to access administration panel
    """
    auth = request.headers.get('Authorization','')
    if not auth.startswith('Bearer '):
        return jsonify(error="Missing token"), 401
    user_token = auth.split()[1]

    try:
        allowed = utils.user_has_push_access(user_token)
    except Exception as e:
        logger.exception("Admin check error")
        return jsonify(error="Authorization service error"), 500
    if not allowed:
        return jsonify(error="Insufficient privileges"), 403

    return jsonify(authorized=True), 200



def authorizeToken(access_token):
    """
    #Method for checking validity of user token. 
    """
    url = f"https://api.github.com/applications/{OAUTH_ID}/token"
    headers = {"Accept": "application/vnd.github+json"}
    data = {"access_token": access_token}

    try:
        response = requests.post(url, auth=HTTPBasicAuth(OAUTH_ID, OAUTH_SECRET), headers=headers, json=data,timeout=8)
        
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
    if error:
        return jsonify(error=error), err_code
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
        return jsonify({'error': 'Validation of info.yml failed, check required keys'}), 400

    try: 
        commit_branch = utils.push_to_repo_yaml(data,user_name)

        url = utils.create_pull_request_to_target(
            head_branch=commit_branch,
            title=f"Upload Portal: Simulation files from {user_name}",
            body=f"""\
This PR contains simulation files uploaded by {user_name} through the NMRlipids upload portal.

Processing of simulation data will happen after approval.
    """
    )
    except Exception as e:
        logger.exception("Failed to push or create PR")
        return jsonify(error="Failed to write to repository"), 500
    return jsonify(message="Uploaded!", pullUrl=url), 200
 

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)


