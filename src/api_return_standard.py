from flask import jsonify

def api_return(payload=None, error=None, status=200):
    """
    Wrap API responses in a consistent JSON structure. 
    If no errors occur the payload is returned directly, otherwise error information is returned.

    Args:
        payload (dict | list | str | None): If data is to be returned, it should be provided here.
        error   (str | None):   Human-readable error message, if any.
        status  (int):          HTTP status code to send back.

    Returns:
        (flask.Response, int):  Flask JSON response + status code.
    """
    if error is None:
        return jsonify(payload),status 
    else:
        body = {
            "error":   error,
            "status":  status
        }
    return jsonify(body), status