workers = 2  
bind = "0.0.0.0:5001"
# Gunicorn Configuration for Nginx
forwarded_allow_ips = "*"  # Allow requests from Nginx
proxy_protocol = True  # Enable proxy support
