#!/bin/bash
logger -t DOCKER-OMV Stopping Docker service
DOCKERSERVICE=`ps aux | grep "/usr/bin/docker daemon" | grep -v grep | wc -l`

while [ $DOCKERSERVICE -gt 0 ]; do
    logger -t DOCKER-OMV Waiting for Docker service to stop
    service docker stop
    sleep 1
    DOCKERSERVICE=`ps aux | grep "/usr/bin/docker daemon" | grep -v grep | wc -l`
done
logger -t DOCKER-OMV Docker service stopped
mount -o remount,bind,defaults /var/lib/docker/openmediavault
logger -t DOCKER-OMV Mounted /var/lib/docker/openmediavault
service docker start
logger -t DOCKER-OMV Docker service started

exit 0
