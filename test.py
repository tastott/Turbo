import RPi.GPIO as GPIO
import socket
import sys
import os
from time import time

#Configure input pin
GPIO.setmode(GPIO.BOARD)
GPIO.setup(7, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)

#(Delete and re-)create socket
#server_address = './socket'

#try:
#    os.unlink(server_address)
#except OSError:
#    if os.path.exists(server_address):
#        raise

#_sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
#_sock.bind(server_address)
#_sock.connect(server_address)

#def makeInputCallback(sock):
#	def onInput(sock):
#		now = time()
#		print now
#		_sock.send('{:.2f}'.format(now))
#
#	return onInput

def onInput(channel):
	now = time()
	sys.stdout.write('{:.2f}'.format(now))
	sys.stdout.flush()


GPIO.add_event_detect(7, GPIO.RISING, callback=onInput, bouncetime=20)

sys.stdin.read(1)