workers = 1
bind = "0.0.0.0:5001"

# Merge worker stdout/stderr into Gunicorn logs
capture_output = True

# Set the log level for both Gunicorn and captured output
loglevel = "info"

# Gunicorn Configuration for Nginx
forwarded_allow_ips = "*"  # Allow requests from Nginx
proxy_protocol = True      # Enable proxy support