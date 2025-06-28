#!/bin/bash

set -e  # Exit on any error

echo "Building frontend..."
npm run build

echo "Removing old build on server..."
sudo rm -rf /var/www/frontend/build

echo "Moving new build to /var/www/frontend/..."
sudo mv build /var/www/frontend/

echo "Deployment to /var/www/frontend/build complete."