# app.py
import os, yaml, time
import requests 
from github import Github,GithubIntegration
from github.Repository import Repository
from flask import current_app as app 
import logging
from datetime import datetime, timedelta,timezone

#Constants:
# Base URL for Databank API which is reference to running container
databank_api_url = os.getenv("DATABANK_API_URL", "http://databank_api:8000")

WORK_REPO_NAME = os.getenv('WORK_REPO_NAME') #Where data is originally uploaded
WORK_BASE_BRANCH = 'main' # A branch will be created based on this branch
PULL_REQUEST_TARGET_REPO = os.getenv('PULL_REQUEST_TARGET_REPO')
APP_ID      = int(os.getenv("GITHUB_APP_ID"))
PRIVATE_KEY = os.getenv("GITHUB_APP_PRIVATE_KEY_PEM")  
integration = GithubIntegration(APP_ID, PRIVATE_KEY)


logger = logging.getLogger('gunicorn.error')

#Caching the tokens which are valid for 1 hour
token_cache = {
    WORK_REPO_NAME: {
        "token":   None,
        "expires": datetime.min.replace(tzinfo=timezone.utc),
        "client":  None,
        "repo":    None
    },
    PULL_REQUEST_TARGET_REPO: {
        "token":   None,
        "expires": datetime.min.replace(tzinfo=timezone.utc),
        "client":  None,
        "repo":    None
    },
}

def get_github_client_and_repo(repo_full_name: str):
    """
    Returns (client, repo) for repo_full_name, caching both until just
    before the token expires (5-minute buffer). Mints a fresh token 
    and repo object only when needed.
    """
    cache = token_cache[repo_full_name]
    now   = datetime.now(timezone.utc)
    
    if cache["token"] is None or now + timedelta(minutes=5) >= cache["expires"]:
        owner, repo = repo_full_name.split("/", 1)
        installation = integration.get_installation(owner, repo)
        tok          = integration.get_access_token(installation.id)
        
        client = Github(tok.token)
        repo_obj = client.get_repo(repo_full_name)
        
        cache.update({
            "token":   tok.token,
            "expires": tok.expires_at,
            "client":  client,
            "repo":    repo_obj
        })
        logger.info(f"Refreshed token for {repo_full_name}")
    else:
        logger.info(f"Reusing cached client for {repo_full_name}. Remaining lifetime: {cache['expires']-now}")

    return cache["client"], cache["repo"]



def get_gh_work() -> Github:
    "Returns a GitHub client for the work repo"
    client, _ = get_github_client_and_repo(WORK_REPO_NAME)
    return client

def get_repo_work() -> Repository:
    "Return Github repo object for the work repo"
    _, repo = get_github_client_and_repo(WORK_REPO_NAME)
    return repo

def get_gh_target() -> Github:
    "Returns a GitHub client for the target repo"
    client, _ = get_github_client_and_repo(PULL_REQUEST_TARGET_REPO)
    return client

def get_repo_target() -> Repository:
    "Return Github repo object for the work repo"
    _, repo = get_github_client_and_repo(PULL_REQUEST_TARGET_REPO)
    return repo


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
    try:
        err = resp.json().get("error", resp.text)
    except ValueError:
        err = resp.text
    logger.error(f"Validation failed: {err}")

    return False

def branch_out(base_branch: str) -> str:
    ts         = time.strftime("%Y%m%d%H%M%S", time.gmtime())
    new_branch = f"bot/info_yaml_{ts}"

    repo = get_repo_work()
    source = repo.get_branch(base_branch)
    sha    = source.commit.sha
    repo.create_git_ref(ref=f"refs/heads/{new_branch}", sha=sha)

    return new_branch

def sync_and_branch(base_branch: str = WORK_BASE_BRANCH) -> str:
    """
    Fast-forwards the work repo's `base_branch` to match its upstream,
    then creates and returns a new timestamped branch off that tip.
    """
    ts         = time.strftime("%Y%m%d%H%M%S", time.gmtime())
    new_branch = f"bot/info_yaml_{ts}"
    repo_work = get_repo_work()
    try:
        get_gh_work()._Github__requester.requestJson(
            "POST",
            f"/repos/{WORK_REPO_NAME}/merge-upstream",
            input={"branch": base_branch}
        )
    except Exception as e:
        logger.error(f"Failed to sync upstream for {WORK_REPO_NAME}: {e}")
        raise
    
    sha = repo_work.get_branch(base_branch).commit.sha
    repo_work.create_git_ref(ref=f"refs/heads/{new_branch}", sha=sha)
    logger.info(f"Synced {base_branch} and created branch {new_branch}")

    return new_branch

def push_to_repo_yaml(data: dict, username: str) -> tuple[str, str]:
    logger.info(f"Pushing to repository with data from {username}")
    new_branch = sync_and_branch(WORK_BASE_BRANCH)
    yaml_text  = yaml.safe_dump(data, sort_keys=False, width=120)
    path       = f"UserData/info.yml"
    message    = f"Add info.yml from {username}"

    response = get_repo_work().create_file(
        path=path,
        message=message,
        content=yaml_text,
        branch=new_branch
    )

    content_file = response['content']
    commit_html_url = content_file.html_url
    return commit_html_url, new_branch

def create_pull_request_to_target(head_branch: str, title: str, body: str = "") -> str:
    """
    Creates a pull request from WORK_REPO_NAME:head_branch 
    into PULL_REQUEST_TARGET_REPO:WORK_BASE_BRANCH.
    Returns the URL of the new PR.
    """
    # Build the fully-qualified head ref
    source_owner = WORK_REPO_NAME.split("/", 1)[0]
    fq_head      = f"{source_owner}:{head_branch}"

    # Get the target repo via the App installation
    repo = get_repo_target()

    # Create the PR (no maintainer-can-modify handshake)
    pr = repo.create_pull(
        title                 = title,
        body                  = body,
        head                  = fq_head,
        base                  = WORK_BASE_BRANCH,
        maintainer_can_modify = False
    )
    return pr.html_url


def user_has_push_access(user_token: str) -> bool:
    """
    Given a user's OAuth token, verify they have write/admin rights
    on the pull request target repo by checking collaborator permissions.
    """
    #Get username from their token
    try:
        gh_user = Github(user_token)
        username = gh_user.get_user().login
    except Exception:
        return False

    #Use GitHub to check permission
    try:
        repo    = get_repo_target()
        logger.info(f"Repository name for permission check: {repo} ")
        perm    = repo.get_collaborator_permission(username)  # "read","write","admin","none"
        logger.info(f"User {username} has permissions: {perm}")
    except Exception:
        return False

    return perm in ("write", "admin")