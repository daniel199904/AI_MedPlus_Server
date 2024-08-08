# 智慧巡房眼鏡/智慧藥盒/智慧抽屜 API說明文件 V0.5.1

###### tags: `AIOT Lab` `node.js` `Tensorflow` `競賽` `Deep Learning`

```
更新日期：2021/12/17
```

## 0. 閱讀注意事項

### 1. 資料填入的規則

格式中的 `{{變數:型態}}` 是代表要送出/回傳哪些資料

#### 格式
```json=
{
    "function": "UserID",
    "data": "{{病患ID:str}}"
}
```

#### 範例

假設**病患ID**是「A123456789」，則應照格式送出：
```json=
{
    "function": "UserID",
    "data": "A123456789"
}
```

### 2. 資料型態

#### 說明

|   型態縮寫    |      型態說明      |                備註                |
| :-----------: | :----------------: | :--------------------------------: |
|      str      |        字串        |                                    |
|      int      |        整數        |                                    |
|    base64     | 經base64編碼的資料 |         API中用作圖片編碼          |
|     date      |        時間        |      格式 yyyy-MM-dd-hh:mm:ss      |
|     bool      |        布林        |             true/false             |
|      md5      |  經MD5編碼的資料   |        取出資料時已經過加密        |
| ({{name}})md5 |  需MD5編碼的資料   | 對API送出請求時該項資料需以MD5編碼 |

### 3. API運作時序圖（根據開發進度更新/修正）

1. [API時序圖 眼鏡部分](https://i.imgur.com/glHs7OX.png) (https://reurl.cc/5rjaVV)

![](https://i.imgur.com/glHs7OX.png)

2. [API時序圖 藥盒部分](https://i.imgur.com/ZuTxwAD.png) (https://reurl.cc/820N3b)

![](https://i.imgur.com/ZuTxwAD.png)

### 4. 連線資訊

#### 格式
```shell=
ws://{{IP}}:{{Port}}{{Path}}
```

#### 說明
|   項目   |     資訊      |        備註        |
| :------: | :-----------: | :----------------: |
| 通訊協定 |   Websocket   |     ws://開頭      |
|    IP    | API Server IP | 需注意區域網路問題 |
|   Port   |     8001      |                    |
|   Path   |     /api      |                    |

#### 範例

```shell=
ws://192.168.10.1:8001/api
```

---

## 1. 各項API服務

> 由於涵蓋設備眾多，請參閱API時序圖說明  
> 以下排序以智慧藥盒/智慧抽屜順序為主，眼鏡接入功能較為單一

> 每項服務開頭適用的設備節點  
> 如果有不同設備間轉發也會用Req(發出設備) => Res(接收設備)標明

### 1. NodeRegister：建立連線時的設備登記

```
對應設備：藥盒、抽屜、MedEye、眼鏡、UI
```

> 註解：Node的意思是節點，不是Node.js  
> 這樣命名的原因是將不同服務視為不同節點

**注意事項：設備登記功能每次連線(Ws斷線後重連也算)皆需要執行一次，可搭配Ping Pong功能偵測是否斷線**

**注意事項：同一個ID只能登記一個設備，測試時請特別注意**

Request
```json=
{
    "function": "NodeRegister",
    "data" : {
        "Type": "{{設備種類:int}}",
        "ID": "{{(MAC address):md5}}"
    }
}
```

Response：True
```json=
{
    "function": "NodeRegister",
    "status": true,
    "data" : {
        "Type": "{{設備種類:int}}",
        "ID": "{{(MAC address):md5}}"
    }
}
```

Response：False
```json=
{
    "function": "NodeRegister",
    "status": false
}
```

#### data.Type 說明

| data.Type |   Description    |
| :-------: | :--------------: |
|     0     |       藥盒       |
|     1     | 藥物辨識抽屜儀器 |
|     2     |      MedEye      |
|     3     |     智慧眼鏡     |
|     4     |      Web UI      |

### 2. GetNodeList：取得目前線上設備清單

```
對應設備：藥盒、抽屜、MedEye、眼鏡、UI
```

> 註解：此功能能夠列出目前透過WS連線並且已登記ID的設備  
> 可以用於設備對設備的綁定

Request
```json=
{
    "function": "GetNodeList",
    "data" : {}
}
```

Response：True
```json=
{
    "function": "GetNodeList",
    "status": true,
    "data" : {
        "NodeList": [
            {
                "Type": "{{設備種類:int}}"
                "ID": "{{(MAC address):md5}}"
            },
            ...
        ]
    }
}
```

Response：False

```json=
{
    "function": "GetNodeList",
    "status": false
}
```

#### data.NodeList.Type 說明

| data.NodeList.Type |   Description    |
| :----------------: | :--------------: |
|         0          |       藥盒       |
|         1          | 藥物辨識抽屜儀器 |
|         2          |      MedEye      |
|         3          |     智慧眼鏡     |
|         4          |      Web UI      |

### 3. NodeSelect：綁定其他設備節點
```
對應設備：藥盒、抽屜、MedEye、眼鏡、UI
```

> 綁定後只要Ws斷線，就會解除綁定，多設備綁定也會解除

Request
```json=
{
    "function": "NodeSelect",
    "data": {
        "SelectID": "{{(MAC address):md5}}"
    }
}
```


Response：True
```json=
{
    "function": "NodeSelect",
    "status": true,
    "data": {
        "SelectID": "{{(Mesh ID):md5}}"
    }
}
```

Response：False
```json=
{
    "function": "NodeSelect",
    "status": false
}
```

### 3.1. NodeSelectClose：綁定其他設備節點的狀態結束時

> 只要綁定的List有一個連線中斷則直接移除綁定List，需重新綁定

Request
```json=
(NULL)
```


Response：True
```json=
{
    "function": "NodeSelectClose",
    "status": true,
    "data": {
        "SelectID": "{{Mesh ID:md5}}"
    }
}
```

### 4. GetPatientData：取得病患資料
```
對應設備：藥盒、抽屜、MedEye、眼鏡、UI
```
#### 跨設備
```
跨設備：
1. Req:藥盒，Res:UI.病患資料
2. Req:藥盒，Res:病患資料
3. Req:眼鏡，Res:UI.病患資料
```

Request
```json=
{
    "function": "GetPatientData",
    "data": {
        "PatientID": "{{病患ID:str}}"
    }
}
```

Response：True
```json=
{
    "function": "GetPatientData",
    "status": true,
    "data": {
        "PatientID": "{{病患ID:str}}",
        "Name": "{{病患名稱:str}}",
        "Age": "{{病患年齡:int}}",
        "AdmissionDate": "{{入院日期:date}}",
        "DischargeDate": "{{出院日期:date}}",
        "ExpectedDischargeDate": "{{預計出院日期:date}}",
        "Disease": [
            "{{疾病名稱:str}}",
            "{{疾病名稱:str}}",
            "{{疾病名稱:str}}",
            ...
        ],
        "Sickbed": "{{病床ID:str}}",
        "Work": "{{照護工作內容:str}}",
        "History": "{{照護歷史:str}}"
    }
}
```

Response：False
```json=
{
    "function": "GetPatientData",
    "status": false
}
```

### 5. GetPrescription：取得病患藥單
```
對應設備：藥盒、抽屜、MedEye、眼鏡、UI
```

> 註解：GetPrescription.data.MedListMD5為API將辨識結果依照順序串接後進行MD5運算  
> 可以與ImgMed.data.MedListMD5比對兩者是否相同，相同則代表兩者結果相同  
> 兩者相同可應用於UI設計"辨識正確/錯誤"相關功能  

Request
```json=
{
    "function": "GetPrescription",
    "data": {
        "PatientID": "{{病患ID:str}}"
    }
}
```

Response：True
```json=
{
    "function": "GetPrescription",
    "status": true,
    "data": {
        "PatientID": "{{病患ID:str}}",
        "PrescriptionID": "{{藥單編號:int}}",
        "MedList": [
            {
                "MedName": "{{藥物名稱:str}}",
                "MedNum": "{{藥物數量:int}}"
            },
            {
                "MedName": "{{藥物名稱:str}}",
                "MedNum": "{{藥物數量:int}}"
            },
            {
                "MedName": "{{藥物名稱:str}}",
                "MedNum": "{{藥物數量:int}}"
            },
            ...
        ],
        "MedListMD5" : "{{藥單結果MD5:md5}}"
    }
}
```

Response：False
```json=
{
    "function": "GetPrescription",
    "status": false
}
```

### 6. ImgMed：傳送拍攝的圖片用於藥物辨識
```
對應設備：藥盒、眼鏡
```

> 註解：ImgMed.data.MedListMD5為API將辨識結果依照順序串接後進行MD5運算  
> 可以與GetPrescription.data.MedListMD5比對兩者是否相同，相同則代表兩者結果相同  
> 兩者相同可應用於UI設計"辨識正確"之相關功能

Request
```json=
{
    "function": "ImgMed",
    "data": {
        "Img": "{{要辨識的圖片:base64}}"
    }
}
```

Response：True
```json=
{
    "function": "ImgMed",
    "status": true,
    "data": {
        "Img": "{{辨識結果圖片:base64}}",
        "MedList": [
            {
                "MedName": "{{藥物名稱:str}}",
                "MedNum": "{{藥物數量:int}}"
            },
            {
                "MedName": "{{藥物名稱:str}}",
                "MedNum": "{{藥物數量:int}}"
            },
            {
                "MedName": "{{藥物名稱:str}}",
                "MedNum": "{{藥物數量:int}}"
            },
            ...
        ],
        "MedListMD5" : "{{藥單結果MD5:md5}}"
    }
}
```

Response：False
```json=
{
    "function": "ImgMed",
    "status": false
}
```

### 7. Detection：傳送藥物辨識與病人藥單比對的結果
```
對應設備：藥盒、UI

多設備傳遞
```

Request
```json=
{
    "function": "Detection",
    "data": {
        "Prescription": {
            "PatientID": "{{病患ID:str}}",
            "PrescriptionID": "{{藥單編號:int}}",
            "MedList": [
                {
                    "MedName": "{{藥物名稱:str}}",
                    "MedNum": "{{藥物數量:int}}"
                },
                ...
            ],
            "MedListMD5" : "{{藥單結果MD5:md5}}"
        },
        "ImgMed": {
            "Img": "{{辨識結果圖片:base64}}",
            "MedList": [
                {
                    "MedName": "{{藥物名稱:str}}",
                    "MedNum": "{{藥物數量:int}}"
                },
                ...
            ],
            "MedListMD5" : "{{藥單結果MD5:md5}}"
        }
    }
}
```

Response：True
```json=
{
    "function": "Detection",
    "status": true,
    "data": {
        "Prescription": {
            "PatientID": "{{病患ID:str}}",
            "PrescriptionID": "{{藥單編號:int}}",
            "MedList": [
                {
                    "MedName": "{{藥物名稱:str}}",
                    "MedNum": "{{藥物數量:int}}"
                },
                ...
            ],
            "MedListMD5" : "{{藥單結果MD5:md5}}"
        },
        "ImgMed": {
            "Img": "{{辨識結果圖片:base64}}",
            "MedList": [
                {
                    "MedName": "{{藥物名稱:str}}",
                    "MedNum": "{{藥物數量:int}}"
                },
                ...
            ],
            "MedListMD5" : "{{藥單結果MD5:md5}}"
        }
    }
}
```

----

## API:MedEye

> 應該是不會建置了

----

## API:藥盒(Med+)

----

## API:抽屜(Med+)

### 1.登記抽屜資訊

Request
```json=
{
    "function": "DrawerRegister",
    "data": {
        "DrawerList": [
            {
                "DrawerID": "{{抽屜流水號:int}}",
                "DrawerMed": "{{抽屜裝藥:str}}"
            },
            {
                "DrawerID": "{{抽屜流水號:int}}",
                "DrawerMed": "{{抽屜裝藥:str}}"
            },
            {
                "DrawerID": "{{抽屜流水號:int}}",
                "DrawerMed": "{{抽屜裝藥:str}}"
            },
            ...
        ]
    }
}
```

Response：True
```json=
{
    "function": "DrawerRegister",
    "status": true
}
```

Response：False
```json=
{
    "function": "DrawerRegister",
    "status": false
}
```

### 2.抽屜燈光控制

> 辨識完成後3秒會送關燈訊號，抽屜的程式也可以自己先提前關燈  
> 此功能抽屜只會接收Server傳來的資料

建置中...

----

## API:UI(Med+)

----

## API:管理員頁面(Med+)