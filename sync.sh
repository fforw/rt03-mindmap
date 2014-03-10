#!/bin/sh

DEPLOY_SERVER=newweb
DEPLOY_PATH=/var/www/static/demo/mindmap

rsync -rvIz --delete --rsh=ssh --exclude=**/.git build/ $DEPLOY_SERVER:$DEPLOY_PATH

