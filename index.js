const Express = require(`express`);
const App = Express();
const WebSocket = require(`ws`);
const Axios = require(`axios`);
const Fs = require(`fs`);
const FormData = require(`form-data`);
const MD5 = require(`md5`);
const Argv = require(`./Lib/argv.js`);
const DateToStr = require(`./Lib/datetostr.js`);
// 取得帶入參數
// API IP
const ArgvIP = Argv.Inq(`ip`) || `0.0.0.0`;
// API Port
const ArgvPort = Argv.Inq(`port`) || `8001`;
// 辨識Python IP
const ArgvDeepIP = Argv.Inq(`dip`) || `127.0.0.1`;
const ArgvDeepPort = Argv.Inq(`dport`) || `5000`;
// Demo、DeBug
const ArgvDemo = Argv.Inq(`demo`) || false;
const ArgvDeBug = Argv.Inq(`debug`) || false;
Argv.Help.Add(`-ip      Service IP address`);
Argv.Help.Add(`-port    Service Port`);
Argv.Help.Add(`-dip     Deep Service IP address`);
Argv.Help.Add(`-dport   Deep Service Port`);
Argv.Help.Add(`-demo    Demo Mode`);
Argv.Help.Add(`-debug   DeBug Mode`);
Argv.Help.Show();

const WebServer = App.listen(ArgvPort, ArgvIP, () => {
	const DateStr = DateToStr(new Date(), `yyyy-MM-dd-hh:mm:ss`);
	console.log(DateStr, `Web Server Start`);
})

App.set('trust proxy', true);
App.set(`view engine`, `jade`);
App.set(`views`, `${__dirname}/Views`);

const RouterTest = require(`./Routes/test.js`);

let FlagDemoMode,FlagDeBug;
// FlagDemoMode = true;
FlagDemoMode = ArgvDemo == `true`;
// FlagDeBug = true;
FlagDeBug = ArgvDeBug == `true`;
if (FlagDemoMode) console.log(`Demo Mode`);
if (FlagDeBug) console.log(`DeBug Mode`);

// 編寫測試頁面Router，並且把Router掛接至/test
App.use(`/test`, RouterTest);

const WsServer = new WebSocket.Server({ server: WebServer, path: `/api` });

WsServer.on(`connection`, (Ws) => {
	Ws.on(`message`, (Msg) => WsMsg(Ws, Msg));
	Ws.on(`close`, (Msg) => WsClose(Ws, Msg));
});

// API Function
let DemoDB = {
	PatientDatas: [
		{
			PatientID: `E123456789`,
			Name: `病人1`,
			Age: 22,
			AdmissionDate: DateToStr(new Date(), `yyyy-MM-dd-hh:mm:ss`),
			DischargeDate: DateToStr(new Date(), `yyyy-MM-dd-hh:mm:ss`),
			Disease: [],
			Sickbed: `A01`,
			Work: `長照`,
			History: `2021/10/08 18:30 翻身拍背`
		},
		{
			PatientID: `F123456789`,
			Name: `病人2`,
			Age: 22,
			AdmissionDate: DateToStr(new Date(), `yyyy-MM-dd-hh:mm:ss`),
			DischargeDate: DateToStr(new Date(), `yyyy-MM-dd-hh:mm:ss`),
			Disease: [],
			Sickbed: `A02`,
			Work: `長照`,
			History: `2021/10/08 18:45 翻身拍背`
		}
	],
	Prescriptions: [
		{
			PatientID: `E123456789`,
			PrescriptionID: `0`,
			MedList: [
				{ MedName: `MEDRHI`, MedNum: 1 },
				{ MedName: `MEDCOU`, MedNum: 1 }
			],
			MedListMD5: ``
		},
		{
			PatientID: `F123456789`,
			PrescriptionID: `1`,
			MedList: [
				{ MedName: `MEDRHI`, MedNum: 1 }
			],
			MedListMD5: ``
		}
	]
};


const APIConnect = require(`./API/Connect.js`);
const WsMsg = async (Ws, Msg) => {
	try {
		const DateStr = DateToStr(new Date(), `yyyy-MM-dd-hh:mm:ss`);
		const Data = JSON.parse(Msg);
		if (FlagDeBug && Data.function != `ImgMed` &&  Data.function != `Detection`) console.log(`DeBug`, `Msg:`, `${Msg}`);
		console.log(DateStr, `API`, Data.function);
		switch (Data.function) {
			case `Test`:
				return;
			case `NodeRegister`:
				ResData = await APIConnect.NodeRegister(Data, Ws);
				break;
			case `GetNodeList`:
				ResData = await APIConnect.GetNodeList(Data, Ws);
				break;
			case `NodeSelect`:
				ResData = await APIConnect.NodeSelect(Data, Ws);
				break;
			case `GetPatientData`:
				ResData = await GetPatientData(Data, Ws);
				break;
			case `GetPrescription`:
				ResData = await GetPrescription(Data, Ws);
				break;
			case `ImgMed`:
				ResData = await ImgMed(Data);
				break;
			case `Detection`:
				ResData = await Detection(Data, Ws);
				break;
			case `Ping`:
				ResData = { function: `Pong` };
				break;
			default:
				ResData = { function: Data.function, status: false };
				console.log(DateStr, `API Error`, `NotFunction`);
		}
		if (FlagDeBug && Data.function != `ImgMed` &&  Data.function != `Detection`) console.log(`DeBug`, `Msg:`, JSON.stringify(ResData));
		Ws.send(JSON.stringify(ResData));
		return;
	} catch (Err) {
		console.error(Err);
	}
}

const WsClose = async (Ws, Msg) => {
	try {
		APIConnect.NodeClear(Ws);
	} catch (Err) {
		console.error(Err);
	}
};

const GetPatientData = (Data, Ws) => {
	const PatientID = Data.data.PatientID;
	const DateStr = DateToStr(new Date(), `yyyy-MM-dd-hh:mm:ss`);
	let ResData;
	// 使用臨時資料庫
	let PatientData = DemoDB.PatientDatas.find(PatientData => PatientData.PatientID == PatientID);
	if (PatientData) {
		ResData = {
			function: `GetPatientData`,
			status: true,
			data: PatientData
		};
	} else {
		ResData = {
			function: `GetPatientData`,
			status: false
		};
	}
	// Demo Mode 資料寫死
	if (FlagDemoMode) {
		ResData = {
			function: `GetPatientData`,
			status: true,
			data: {
				PatientID: `E123456789`,
				Name: `王大明`,
				Age: 22,
				AdmissionDate: DateStr,
				DischargeDate: DateStr,
				Disease: [],
				Sickbed: `A01`,
				Work: `長照`,
				History: `2021/10/08 18:30 翻身拍背`
			}
		};
	}
	// 取得此次連線設備的Client
	const Client = APIConnect.WsServerClientList().find((Client) => Client.Ws == Ws);
	// 如果請節的設備有綁定，觸發轉發程式
	if (Client.SelectID) {
		Repost(ResData, Client);
	}
	return ResData;
};

const GetPrescription = (Data, Ws) => {
	const PatientID = Data.data.PatientID;
	const DateStr = DateToStr(new Date(), `yyyy-MM-dd-hh:mm:ss`);
	let ResData;
	// 使用臨時資料庫
	let Prescription = DemoDB.Prescriptions.find(Prescription => Prescription.PatientID == PatientID);
	if (Prescription) {
		if (Prescription.MedList.length != 0)
			Prescription.MedList = Prescription.MedList.sort((A, B) => { return A.MedName > B.MedName ? 1 : -1; });
		Prescription.MedListMD5 = MD5(JSON.stringify(Prescription.MedList));
		ResData = {
			function: `GetPrescription`,
			status: true,
			data: Prescription
		};
	} else {
		ResData = {
			function: `GetPrescription`,
			status: false
		};
	}
	// Demo Mode 資料寫死
	if (FlagDemoMode) {
		let MedList = [
			{ MedName: `MEDCOL`, MedNum: 1 },
			{ MedName: `MEDRHI`, MedNum: 1 }
		];
		if (MedList.length != 0)
			MedList = MedList.sort((A, B) => { return A.MedName > B.MedName ? 1 : -1; });
		let MedListMD5 = MD5(JSON.stringify(MedList));
		ResData = {
			function: `GetPrescription`,
			status: true,
			data: {
				PatientID: `E123456789`,
				PrescriptionID: `0`,
				MedList: MedList,
				MedListMD5: MedListMD5
			}
		};
	}
	return ResData;
}

/**
 * PostImgDetection
 * @param  {Srt}	Url			Deep Server Url
 * @param  {Str} 	Imgbase64	Imgbase64 Star
 * @param  {bool}	SaveImg		Save
 * @return {Object} 			Res Object
 */
const PostImgDetection = async (Url, Imgbase64, SaveImg) => {
	const Form = new FormData();
	Form.append(`img`, Imgbase64);
	return await Axios.post(Url, Form, { headers: Form.getHeaders() })
		.then((Res) => {
			// Res.data.img:圖片Base64資訊
			// Res.data.Meds:辨識結果
			SaveImg && Fs.writeFileSync(`./Img/Img_Out.png`, Res.data.img, `base64`);
			return Res.data;
		})
		.catch((Err) => console.error(Err));
};

const ImgMed = async (Data) => {
	// 相容於目前的Python，未來會跟TF2.0 Py放在同一台機器上
	// 要調整回傳的格式，會少掉For in的部分，並且img改成Img
	let ResData;
	// 藥物清單、藥物清單MD5、Imgbase64
	let Imgbase64;
	let MedList = [];
	let MedListMD5;
	// DemoMode
	if (FlagDemoMode) {
		// 讀取照片作為Demo用照片
		Imgbase64 = Fs.readFileSync(`./Img/Img_01_Out.png`, `base64`);
		MedList = [
			{ MedName: `MEDCOL`, MedNum: 1 },
			{ MedName: `MEDRHI`, MedNum: 1 }
		];
		if (MedList.length != 0)
			MedList = MedList.sort((A, B) => { return A.MedName > B.MedName ? 1 : -1; });
		MedListMD5 = MD5(JSON.stringify(MedList));
		ResData = {
			function: `ImgMed`,
			status: true,
			data: {
				Img: Imgbase64,
				MedList: MedList,
				MedListMD5: MedListMD5
			}
		};
		return ResData;
	}
	const DeepServerIP = ArgvDeepIP;
	const DeepServerPort = ArgvDeepPort;
	const ImgMedRes = await PostImgDetection(`http://${DeepServerIP}:${DeepServerPort}/detection`, Data.data.Img);
	Imgbase64 = ImgMedRes.img;
	for (let Med in ImgMedRes.Meds) { MedList.push({ MedName: Med, MedNum: ImgMedRes.Meds[Med] }) }
	if (MedList.length != 0)
		MedList = MedList.sort((A, B) => { return A.MedName > B.MedName ? 1 : -1; });
	MedListMD5 = MD5(JSON.stringify(MedList));
	ResData = {
		function: `ImgMed`,
		status: true,
		data: {
			Img: Imgbase64,
			MedList: MedList,
			MedListMD5: MedListMD5
		}
	};
	return ResData;
};

const Detection = (Data, Ws) => {
	const PatientID = Data.data.Prescription.PatientID;
	const DateStr = DateToStr(new Date(), `yyyy-MM-dd-hh:mm:ss`);
	// 目前僅轉發
	let ResData;
	// 測試用，需調整
	if (PatientID == `E123456789` || PatientID == `F123456789`) {
		ResData = {
			function: `Detection`,
			status: true,
			data: Data.data
		};
	}
	// 取得此次連線設備的Client
	const Client = APIConnect.WsServerClientList().find((Client) => Client.Ws == Ws);
	// 如果請節的設備有綁定，觸發轉發程式
	if (Client.SelectID) {
		Repost(ResData, Client);
	}
	// 需要改成只轉給UI
	return ResData;
}

const Repost = (ResData, Client) => {
	const SelectClients = APIConnect.NodeSelectMeshList().find((Select) => Select.SelectID == Client.SelectID);
	SelectClients.MeshList.forEach((SelectClient) => {
		if (Client.ID == SelectClient.ID) return;
		SelectClient.Ws.send(JSON.stringify(ResData));
	});
};