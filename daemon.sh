#!/bin/bash

NODE=/opt/node/bin/node
APP=/home/pi/live/app.js
USER=pi
OUT=/home/pi/live/logs/out.log

PORT=8080 # note this is just local port.

case "$1" in

start)
	echo "starting node: $NODE $APP"
	sudo iptables -A PREROUTING -t nat -i eth0 -p tcp --dport 80 -j REDIRECT --to-port $PORT
	sudo -u $USER env PORT=$PORT $NODE $APP > $OUT 2>$OUT &
	;;

stop)
	killall $NODE
	sudo iptables -D PREROUTING -t nat -i eth0 -p tcp --dport 80 -j REDIRECT --to-port $PORT
	;;

*)
	echo "usage: $0 (start|stop)"
esac

exit 0
