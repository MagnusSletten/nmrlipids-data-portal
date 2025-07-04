# app.py
import subprocess
import os, yaml, time
import sys 
import requests 
from github import Github
from github import Auth
from flask import current_app as app 
import logging

# Base URL for Databank API which is reference to running container
databank_api_url = os.getenv("DATABANK_API_URL", "http://databank_api:8000")

WORK_REPO_NAME = 'MagnusSletten/BilayerData' #Where data is originally uploaded
WORK_BASE_BRANCH = 'main' # A branch will be created based on this branch
PULL_REQUEST_TARGET_REPO = 'MagnusPriv/BilayerData' 
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_TARGET_TOKEN = os.getenv("GITHUB_TARGET_TOKEN")
GITHUB_SERVER_AUTH_TOKEN = os.getenv("GITHUB_SERVER_AUTH_TOKEN")

gh_work   = Github(GITHUB_TOKEN)
repo_work = gh_work.get_repo(f"{WORK_REPO_NAME}")
gh_target= Github(GITHUB_TARGET_TOKEN)
logger = logging.getLogger('gunicorn.error')

def get_composition_names():
    """
    Fetches the list of composition names from the Databank API.
    """
    resp = requests.get(f"{databank_api_url}/compositions")
    resp.raise_for_status()
    return resp.json()


def refresh_composition_file():
    """
    Triggers a refresh of the molecules.json via the Databank API and returns the refreshed count.
    """
    resp = requests.post(f"{databank_api_url}/refresh-compositions")
    resp.raise_for_status()
    data = resp.json()
    return data.get("refreshed")


def is_input_valid(info_yaml_dict: dict) -> bool:
    """
    Validates the provided YAML dict via the Databank API.
    Returns True if valid, False otherwise.
    """
    logger.info(f"Validating info yml")
    resp = requests.post(
        f"{databank_api_url}/info-valid-check", json=info_yaml_dict
    )
    if resp.status_code == 200:
        return True
    return False


def run_command(command, error_message="Command failed", working_dir=None):
    try:
        subprocess.run(command, shell=True, check=True, cwd=working_dir)
    except subprocess.CalledProcessError:
        print(error_message)
        sys.exit(1)



def git_setup(name="NMRlipids_File_Upload", email="nmrlipids_bot@github.com"):
    """
    Configures Git with a specific user name and email.
    """
    try:
        # Set Git user name
        subprocess.run(["git", "config", "--global", "user.name", name], check=True)
        
        # Set Git user email
        subprocess.run(["git", "config", "--global", "user.email", email], check=True)
        
        print("Git configuration set successfully.")
    except subprocess.CalledProcessError as e:
        print(f"An error occurred while setting Git configuration: {e}")

def git_pull():
    try:
        subprocess.run(["git", "pull"], check=True)
    except subprocess.CalledProcessError as e:
        print(f"An error occurred while updating Git: {e}")

def update_databank():
    """
    Pulls the latest changes in the Databank repo,
    based on the DATABANK_PATH environment variable.
    """
    path = os.getenv("DATABANK_PATH")
    if not path:
        print("Error: DATABANK_PATH environment variable not set", file=sys.stderr)
        sys.exit(1)

    run_command(
        "git pull --recurse-submodules",
        error_message="Failed to pull updates for Databank",
        working_dir=path
    )

def branch_out(base_branch: str) -> str:
    ts         = time.strftime("%Y%m%d%H%M%S", time.gmtime())
    new_branch = f"bot/info_yaml_{ts}"

    # 1) Get the commit SHA of the base branch
    source = repo_work.get_branch(base_branch)
    sha    = source.commit.sha

    # 2) Create the new branch ref
    repo_work.create_git_ref(ref=f"refs/heads/{new_branch}", sha=sha)

    return new_branch


def push_to_repo_yaml(data: dict, username: str) -> tuple[str, str]:
    logger.info(f"Pushing to repository with data from {username}")
    new_branch = branch_out(WORK_BASE_BRANCH)
    yaml_text  = yaml.safe_dump(data, sort_keys=False, width=120)
    path       = f"UserData/info.yml"
    message    = f"Add info.yml from {username}"

    response = repo_work.create_file(
        path=path,
        message=message,
        content=yaml_text,
        branch=new_branch
    )

    # Extract the ContentFile object and its HTML URL
    content_file = response['content']
    commit_html_url = content_file.html_url
    return commit_html_url, new_branch

def create_pull_request(
    gh,                      # Authenticated Github client with write permissions to the target repository
    head_ref: str,           # Fully qualified head ref, e.g. "owner:branch"
    title: str,
    body: str = "",
    base_branch: str = WORK_BASE_BRANCH,
    target_owner: str = "", # Owner or org of the target repo
    target_repo: str = ""   # Name of the target repository
) -> str:
    """
    Create a pull request from head_ref into target_owner/target_repo:base_branch.
    The provided `gh` client must be authenticated with a token that has push and pull request
    creation privileges on the target repository.
    Returns the URL of the new PR.
    """
    # Construct full repository name
    target_fullname = f"{target_owner}/{target_repo}"

    # Get the target repository object
    repo_obj = gh.get_repo(target_fullname)

    # Create the pull request
    pr = repo_obj.create_pull(
        title=title,
        body=body,
        head=head_ref,
        base=base_branch
    )

    return pr.html_url

def create_pull_request_to_target(
    head_ref: str,
    title: str,
    body: str = '',
    base_branch: str = WORK_BASE_BRANCH
) -> str:
    # Parse owner/repo for target
    target_owner, target_repo = PULL_REQUEST_TARGET_REPO.split('/')

    # Parse the owner of your fork/work repo
    source_owner = WORK_REPO_NAME.split('/')[0]

    # Fully qualified head: "MagnusSletten:bot/info_yaml_…"
    fq_head = f"{source_owner}:{head_ref}"

    # Delegate to the generic helper
    return create_pull_request(
        gh=gh_target,
        head_ref=fq_head,
        title=title,
        body=body,
        base_branch=base_branch,
        target_owner=target_owner,
        target_repo=target_repo
    )



def user_has_push_access(user_token: str, repo_full_name: str) -> bool:
    """
    Given a user’s OAuth token, verify they have write/admin rights
    on `repo_full_name` by checking collaborator permissions.
    """
    # 1) get the username from their token
    try:
        gh_user = Github(user_token)
        username = gh_user.get_user().login
    except Exception:
        return False

    # 2) ask GitHub (with our server token) about their permission
    try:
        gh_srv = Github(GITHUB_SERVER_AUTH_TOKEN)
        repo    = gh_srv.get_repo(repo_full_name)
        logger.info(f"Repository name for permission check: {repo} ")
        perm    = repo.get_collaborator_permission(username)  # "read","write","admin","none"
        logger.info(f"User {username} has permissions: {perm}")
    except Exception:
        return False

    return perm in ("write", "admin")