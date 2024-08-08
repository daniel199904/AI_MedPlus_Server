#!/bin/bash

#FanMax
sudo jetson_clocks --fan
#Start Node.js Server
cd /home/xavier/AI_MedPlus
node index.js -ip 0.0.0.0
