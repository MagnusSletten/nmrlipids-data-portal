from flask import Flask, jsonify, request, abort
import os, json, subprocess
from DatabankLib.databankLibrary import parse_valid_config_settings
from DatabankLib import NMLDB_MOL_PATH
import DatabankLib.settings.molecules as molecules
import importlib
import logging 
import requests

app = Flask(__name__)
# Paths and filenames
DATABANK_PATH = os.getenv("DATABANK_PATH", "/app/Databank")
# Local static folder for this service
LOCAL_STATIC = os.getenv("LOCAL_STATIC", "/app/static")
MOLECULE_FILE = os.path.join(LOCAL_STATIC, "molecules.json")
MAPPING_FILE = os.path.join(LOCAL_STATIC,"mapping-files.json")
GITHUB_GATEWAY_URL = os.getenv("GITHUB_GATEWAY_URL", "http://github_gateway:5001")


# Ensure local static folder exists
os.makedirs(LOCAL_STATIC, exist_ok=True)


lipids_set    = molecules.lipids_set
molecules_set = molecules.molecules_set

logger = logging.getLogger('gunicorn.error')

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("gunicorn.error")


def pull_latest():
    "Pulls latest changes from the Databank repository and updates submodules."
    logger.info("Pulling latest Databank repo and submodules")
    try:
        subprocess.run([
            "git", "pull"
        ], cwd=DATABANK_PATH, check=True)
        subprocess.run([
            "git", "submodule", "update",
            "--remote", "--recursive"
        ], cwd=DATABANK_PATH, check=True)
    except subprocess.CalledProcessError as e:
        logger.error("Failed to update Databank repository or its submodules: %s", e)
        abort(500, description="Failed to update Databank repository or its submodules")

def refresh_molecule_file():
    "Refreshes the local molecules.json file with updated molecule names."
    logger.info("Refreshing molecule file")
    pull_latest()
    importlib.reload(molecules)

    global lipids_set, molecules_set
    lipids_set = molecules.lipids_set
    molecules_set = molecules.molecules_set

    all_ids = sorted(lipids_set.names.union(molecules_set.names))
    out_path = MOLECULE_FILE
    tmp_path = out_path + ".tmp"

    with open(tmp_path, 'w') as f:
        json.dump(all_ids, f, indent=2)
    os.replace(tmp_path, out_path)

    logger.info("Wrote %d molecules to %s", len(all_ids), MOLECULE_FILE)
    return len(all_ids)

# Build and persist mapping dict
def build_mapping_dict(base_path=NMLDB_MOL_PATH):
    logger.info("Building mapping dict from %s", base_path)
    mapping_dict = {}
    lipid_path = os.path.join(base_path, "membrane")
    non_lipid_path = os.path.join(base_path, "solution")
    for base_dir in (lipid_path, non_lipid_path):
        for molecule in os.listdir(base_dir):
            mol_dir = os.path.join(base_dir, molecule)
            for fname in os.listdir(mol_dir):
                if "mapping" in fname:
                    mapping_dict.setdefault(molecule, []).append(fname)
    for mapping_list in mapping_dict.values():
        mapping_list.sort()

    tmp = MAPPING_FILE + ".tmp"
    with open(tmp, "w") as fp:
        json.dump(mapping_dict, fp, indent=2)
    os.replace(tmp, MAPPING_FILE)

    logger.info("Wrote %d mappings to %s", len(mapping_dict), MAPPING_FILE)
    return len(mapping_dict)

@app.route("/mapping-files", methods=["GET"])
def list_mappings():
    """Return cached mapping files from mapping-files.json."""
    try:
        with open(MAPPING_FILE, "r") as fp:
            mapping_dict = json.load(fp)
    except FileNotFoundError as e:
        logger.error("Mapping file not found: %s", MAPPING_FILE)
        return jsonify({"error": "Mapping file not available"}), 404
    return jsonify(mapping_dict), 200

@app.route("/refresh-mapping-files", methods=["POST"])
def refresh_mapping_files():
    """
    POST /refresh-mapping-files, regenerates local mapping-files.json and returns count.
    """
    err = admin_check()
    if err:
        return err
   
    count = build_mapping_dict()
    return jsonify(refreshed=count), 200

@app.route('/molecules', methods=['GET'])
def list_molecules():
    """
    GET /molecules - returns local list of molecules.
    """
    with open(MOLECULE_FILE, 'r') as f:
        names = json.load(f)
    return jsonify(names), 200

@app.route('/refresh-molecules', methods=['POST'])
def refresh_molecules():
    """
    POST /refresh-molecules - regenerates local molecules.json and returns count.
    """
    err = admin_check()
    if err:
        return err
   
    logger.info("User authorized to refresh molecules")
    count = refresh_molecule_file()
    return jsonify(refreshed=count), 200

def admin_check():
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return jsonify(error="Missing token"), 401

    headers = {'Authorization': auth}
    logger.info("Checking user admin status")
    resp = requests.post(f"{GITHUB_GATEWAY_URL}/user-admin-check", headers=headers)
    try:
        resp.raise_for_status()
    except requests.HTTPError as e:
        logger.error(f"User admin check failed, error: {e}")
        return jsonify(error=resp.json().get("error", str(e))), resp.status_code

    data = resp.json()  
    if not data.get("authorized", False):
        return jsonify(error="Insufficient privileges"), 403
    return None

@app.route('/info-valid-check', methods=['POST'])
def info_valid_check():
    """
    POST /info-valid-check - validates provided YAML dict.
    """
    data = request.get_json()
    if not data:
        abort(400, description="Invalid or missing JSON payload")
    try:
        parse_valid_config_settings(data)
        return jsonify(valid=True), 200
    except Exception as e:
        logger.error("Validation failed: %s", e)
        return jsonify(valid=False, error=str(e)), 400

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify(status="ok"), 200

# Initial setup, runs when gunicorn imports this app:
pull_latest()
refresh_molecule_file()
build_mapping_dict(NMLDB_MOL_PATH)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=False)
