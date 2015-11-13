#!/bin/bash
DOCKERMOUNTED=`grep /var/lib/docker/openmediavault /etc/fstab | wc -l`
if [ $DOCKERMOUNTED -eq 1 ]; then
    mount -o remount,bind,defaults /var/lib/docker/openmediavault
fi
exit 0
