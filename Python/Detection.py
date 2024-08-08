import numpy as np
import tensorflow as tf
import cv2
import time
import json
from object_detection.utils import label_map_util
from object_detection.utils import visualization_utils as viz_utils
import base64

ModelPath = ''
LabelMapPath = ''
MinScore = 0.8

DebugWindow = 0  # 0->沒有 1->相機畫面 2->1+辨識結果

Timer = time.time()

def SetDataPath(SetModelPath,SetLabelMapPath) :
	global ModelPath,LabelMapPath
	ModelPath = SetModelPath
	LabelMapPath = SetLabelMapPath
	print('[TF][Set ModelPath]',ModelPath)
	print('[TF][Set LabelMapPath]',LabelMapPath)
	return

# 計算藥物數量
# 2021/10/28 移除原第三參數：QR_data
def countMed(Detections, CategoryIndex, MinScore) :
	MedCount = {}
	for i in range(0, Detections['num_detections']):
		Score = Detections['detection_scores'][i]
		ScoreRange = MinScore
		if Score >= ScoreRange:
			ClassName = CategoryIndex[Detections['detection_classes'][i]]['name']
			if MedCount.__contains__(ClassName) :
				MedCount[ClassName] += 1
			else :
				MedCount[ClassName] = 1
	return MedCount

def paintLabel(Frame, Detections, CategoryIndex, MinScore) :
	CopyFrame = Frame.copy()
	viz_utils.visualize_boxes_and_labels_on_image_array(
		CopyFrame,
		Detections['detection_boxes'],
		Detections['detection_classes'],
		Detections['detection_scores'],
		CategoryIndex,
		use_normalized_coordinates=True,
		max_boxes_to_draw=50,
		min_score_thresh=MinScore,
		agnostic_mode=False)
	return CopyFrame

# 辨識
def DetectionImg(Frame) :
	global Timer, DetectFunction, CategoryIndex
	Timer = time.time()
	input_tensor = tf.convert_to_tensor(Frame)
	input_tensor = input_tensor[tf.newaxis, ...]
	Detections = DetectFunction(input_tensor)
	num_detections = int(Detections.pop('num_detections'))
	Detections = {key: value[0, :num_detections].numpy()
				  for key, value in Detections.items()}
	Detections['num_detections'] = num_detections
	Detections['detection_classes'] = Detections['detection_classes'].astype(np.int64)
	MedCount = countMed(Detections, CategoryIndex, MinScore)
	LabelImg = paintLabel(Frame, Detections, CategoryIndex, MinScore)
	print('[TF][Detection ', MedCount, ']')
	print("[TF][Time " + str(round(time.time() - Timer, 2)) + "s]")
	if DebugWindow > 0:
		cv2.imshow("camera", Frame)
	if DebugWindow > 1:
		cv2.imshow("result", LabelImg)
	ImgBase64 = cv2.imencode('.jpg', LabelImg)[1].tostring()
	ImgBase64 = base64.b64encode(ImgBase64)
	SendStr = {"img": str(ImgBase64)[2:-1], "Meds": MedCount, "status": True}
	JsonData = json.dumps(SendStr)
	return JsonData

# 預載模組
DetectFunction = lambda x: x + 1
CategoryIndex = {}

def LoadTensor() :
	# 設定TF使用GPU辨識
	print('[TF][Set GPU]')
	GPUs = tf.config.experimental.list_physical_devices('GPU')
	for GPU in GPUs:
		tf.config.experimental.set_memory_growth(GPU, True)
	print('[TF][Loading...]')
	global Timer, DetectFunction, CategoryIndex
	DetectFunction = tf.saved_model.load(ModelPath)
	CategoryIndex = label_map_util.create_category_index_from_labelmap(
		LabelMapPath, 
		use_display_name=True)
	# 預先辨識，用意是讓模組載入
	Frame = np.zeros((5, 5, 3), np.uint8)
	input_tensor = tf.convert_to_tensor(Frame)
	input_tensor = input_tensor[tf.newaxis, ...]
	print('[TF][Booting...]')
	DetectFunction(input_tensor)
	print('[TF][Boot finish,in Time ' + str(time.time() - Timer) + 's]')

def init() :
	LoadTensor()
	return True