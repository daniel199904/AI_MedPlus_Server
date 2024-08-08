from flask import Flask, request
import Detection
import threading
import websocket
import cv2
import io
import json
import base64
import numpy as np

Mutex = threading.Lock()
App = Flask(__name__)
IsBootComplete = False

ModelPath = '/home/xavier/AI_MedPlus/Python/Model/20210309_4MED_NEWBOX'+'/saved_model'
LabelMapPath = '/home/xavier/AI_MedPlus/Python/Model/20210309_4MED_NEWBOX'+'/data.pbtxt'

def Base64ToImg(ImgBase64):
	ImgNP = np.fromstring(base64.b64decode(ImgBase64), np.uint8)
	Img = cv2.imdecode(ImgNP, cv2.IMREAD_COLOR)
	return Img

def ImgReSize(Img) :
	Rows,Cols,Channels = Img.shape
	ImgNewSize = min(Rows,Cols)
	ImgNew = np.zeros([ImgNewSize,ImgNewSize,3],np.uint8)
	ImgMove = int((Cols - Rows) / 2)
	ImgNew = Img[0:ImgNewSize,ImgMove:ImgNewSize + ImgMove]
	ImgNew = cv2.resize(ImgNew,(512,512),interpolation=cv2.INTER_AREA)
	return ImgNew

@App.route("/detection", methods=["POST"])
def detection():
	# Mutex:線程鎖定
	# IsBootComplete:辨識是否有啟動
	global Mutex, IsBootComplete
	try :
		print('[Web][Post Img]')
		if IsBootComplete is False:
			print('[Web Err][IsBootComplete not open]')
			JsonData = json.dumps({"status": False})
			return JsonData
		Mutex.acquire()
		# 改大寫
		imgBase64 = request.form["img"]
		Img = Base64ToImg(imgBase64)
		Img = ImgReSize(Img)
		JsonData = Detection.DetectionImg(Img)
		Mutex.release()
		return JsonData
	except Exception as Err :
		print('[Web Err]',Err)
		Mutex.release()
		return "Err"

DetectionState = 'Running'

@App.route("/info")
def info() :
	return DetectionState

def main() :
	# 設定Detection目錄
	Detection.SetDataPath(ModelPath,LabelMapPath)
	# 啟動Detection服務
	global IsBootComplete
	IsBootComplete = Detection.init()
	# 啟動Web服務
	App.run(host="0.0.0.0")

if __name__ == '__main__':
	main()
