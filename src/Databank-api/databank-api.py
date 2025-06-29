from flask import Flask, jsonify, request, abort
import os, json, subprocess, yaml, time
from DatabankLib.databankLibrary import parse_valid_config_settings, YamlBadConfigException
from DatabankLib.settings.molecules import lipids_set, molecules_set

app = Flask(__name__)
# Paths and filenames
DATABANK_PATH = os.getenv("DATABANK_PATH", "/app/Databank")
# Local static folder for this service, avoids writing back to the Databank repo
LOCAL_STATIC = os.getenv("LOCAL_STATIC", "/app/static")
MOLECULE_FILE = os.path.join(LOCAL_STATIC, "molecules.json")

# Ensure local static folder exists
os.makedirs(LOCAL_STATIC, exist_ok=True)


# Refresh composition file utility
def refresh_composition_file():
    all_ids = sorted(lipids_set.names.union(molecules_set.names))
    out_path = MOLECULE_FILE
    tmp_path = out_path + ".tmp"

    with open(tmp_path, 'w') as f:
        json.dump(all_ids, f, indent=2)
    os.replace(tmp_path, out_path)
    return len(all_ids)

# Pull latest changes from Databank
def pull_latest():
    try:
        subprocess.run([
            "git", "pull", "--recurse-submodules"
        ], cwd=DATABANK_PATH, check=True)
    except subprocess.CalledProcessError:
        abort(500, description="Failed to update Databank repository")

@app.route('/compositions', methods=['GET'])
def list_compositions():
    """
    GET /compositions - returns local list of compositions.
    """
    with open(MOLECULE_FILE, 'r') as f:
        names = json.load(f)
    return jsonify(names), 200

@app.route('/refresh-compositions', methods=['POST'])
def refresh_endpoint():
    """
    POST /refresh-compositions - regenerates local molecules.json and returns count.
    """
    count = refresh_composition_file()
    return jsonify(refreshed=count), 200

@app.route('/info-valid-check', methods=['POST'])
def is_input_valid():
    """
    POST /info-valid-check - validates provided YAML dict.
    """
    data = request.get_json()
    if not data:
        abort(400, description="Invalid or missing JSON payload")
    try:
        parse_valid_config_settings(data)
        return jsonify(valid=True), 200
    except YamlBadConfigException as e:
        return jsonify(valid=False, error=str(e)), 400
    except Exception:
        return jsonify(valid=False, error="Validation error"), 400

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify(status="ok"), 200

if __name__ == '__main__':
    # On startup: configure Git, update and refresh data
    pull_latest()
    refresh_composition_file()

    app.run(host='0.0.0.0', port=8000, debug=False)
