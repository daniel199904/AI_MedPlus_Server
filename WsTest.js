const WebSocket = require(`ws`);
const Fs = require(`fs`);
const DateToStr = require(`./Lib/datetostr.js`);

const WsConnect = (WsUrl, Type, ID, ConnectName, RunFunction, OnMessage) => {
	try {
		const DateStr = DateToStr(new Date(), `yyyy-MM-dd-hh:mm:ss`);
		const Ws = new WebSocket(WsUrl);
		Ws.on(`open`, () => {
			console.log(DateStr, `API Ws Open`, ConnectName);
			let Data = {
				function: `NodeRegister`,
				data: { Type: Type, ID: ID }
			};
			Ws.send(JSON.stringify(Data));
			OnMessage && Ws.on(`message`, (Msg) => OnMessage(Msg, ConnectName));
			RunFunction && RunFunction(Ws);
		});
		Ws.on(`close`, (Msg) => {
			// console.log(DateStr, `API Ws Close`, ConnectName, Msg);
			// setTimeout(() => {
			// 	WsConnect(WsUrl, Type, ID, ConnectName, RunFunction, OnMessage);
			// }, 5000);
		});
		Ws.on(`error`, (Err) => {console.error(`Err Log`,Err.code)});
		return Ws;
	} catch (Err) {
		console.error(Err);
	}
}

let DeBug1, DeBug2, DeBug3;
DeBug1 = true;
// DeBug2 = true;
// DeBug3 = true

if (DeBug1) {
	// let IP = `192.168.50.142`;
	// let IP = `192.168.10.200`;
	let IP = `127.0.0.1`;
	WsConnect(`ws://${IP}:8001/api`, 0, `9083b6812ec5a6aae2c8247455e6a623`, `藥盒`,
		(Ws) => {
			//////////
			// 綁定UI //
			//////////
			setTimeout(() => {
				console.log(`Select UI`);
				let Data;
				Data = {
					function: `NodeSelect`,
					data: { SelectID: `9d172eded924c119277505ac0e8c85da` }
				};
				Ws.send(JSON.stringify(Data));
			}, 50);

			/////////////
			// 綁定藥物辨識盒 //
			/////////////
			// setTimeout(() => {
			// 	console.log(`Select Box`);
			// 	let Data;
			// 	Data = {
			// 		function: `NodeSelect`,
			// 		data: { SelectID: `9d172eded924c119277505ac0e8c85da` }
			// 	};
			// 	Ws.send(JSON.stringify(Data));
			// }, 50);

			///////////////////
			// 取得病人資料 & 開抽屜用 //
			///////////////////
			setTimeout(() => {
				console.log(`GetPatientData`);
				Data = {
					function: `GetPatientData`,
					data: { PatientID: `E123456789` }
				}
				Ws.send(JSON.stringify(Data));
				// Ws.close();
			}, 100);

			////////////
			// 取得病人藥單 //
			////////////
			setTimeout(() => {
				console.log(`GetPrescription`);
				Data = {
					function: `GetPrescription`,
					data: { PatientID: `E123456789` }
				}
				Ws.send(JSON.stringify(Data));
			}, 200);
			setTimeout(() => {
				console.log(`ImgMed`);
				Imgbase64 = Fs.readFileSync(`Img/Img_02.png`, `base64`);
				Data = {
					function: `ImgMed`,
					data: { Img: Imgbase64 }
				}
				Ws.send(JSON.stringify(Data));
			}, 1200);
			setTimeout(() => {
				console.log(`Detection`);
				Data = {
					function: `Detection`,
					data: { 
						Prescription : DataPrescription,
						ImgMed: DataImgMed
					}
				}
				Ws.send(JSON.stringify(Data));
			}, 5000);
		},
		(Msg, ConnectName) => {
			const DateStr = DateToStr(new Date(), `yyyy-MM-dd-hh:mm:ss`);
			// console.log(DateStr, `API Ws Msg ${ConnectName},${Msg}`);
			const Data = JSON.parse(Msg);
			if(Data.function == `ImgMed`) {
				Fs.writeFileSync(`./TestOut2.png`, Data.data.Img, `base64`);
				DataImgMed = Data.data;
			} else if(Data.function == `GetPrescription`) {
				DataPrescription = Data.data;
			}
		}
	);

	// WsConnect(`ws://${IP}:8001/api`, 1, `9d172eded924c119277505ac0e8c85da`, `抽屜`,
	// 	(Ws) => {

	// 	},
	// 	(Msg, ConnectName) => {
	// 		const DateStr = DateToStr(new Date(), `yyyy-MM-dd-hh:mm:ss`);
	// 		console.log(DateStr, `API Ws Msg ${ConnectName},${Msg}`);
	// 	}
	// );
	
	// WsConnect(`ws://${IP}:8001/api`, 3, `4255a461e9d28ac347e16b2729411fdb`, `眼鏡`,
	// 	(Ws) => {
	// 	},
	// 	(Msg, ConnectName) => {
	// 		const DateStr = DateToStr(new Date(), `yyyy-MM-dd-hh:mm:ss`);
	// 		console.log(DateStr, `API Ws Msg ${ConnectName},${Msg}`);
	// 	}
	// );

	// WsConnect(`ws://${IP}:8001/api`, 4, `71ff71526d15db86eb50fcac245d183b`, `UI`,
	// 	(Ws) => {

	// 	},
	// 	(Msg, ConnectName) => {
	// 		const DateStr = DateToStr(new Date(), `yyyy-MM-dd-hh:mm:ss`);
	// 		console.log(DateStr, `API Ws Msg ${ConnectName},${Msg}`);
	// 	}
	// );
}

if (DeBug2) {
	WsConnect(`ws://127.0.0.1:8001/api`, 3, `9d172eded924c119277505ac0e8c85da`, `眼鏡`,
		(Ws) => {
			setTimeout(() => {
				console.log(`GetPatientData`);
				Data = {
					function: `GetPatientData`,
					data: { PatientID: `E123456789` }
				}
				Ws.send(JSON.stringify(Data));
				Data = {
					function: `ImgMed`,
					data: { Img: `` }
				}
				Ws.send(JSON.stringify(Data));
			}, 1000);
		},
		(Msg, ConnectName) => {
			const DateStr = DateToStr(new Date(), `yyyy-MM-dd-hh:mm:ss`);
			console.log(DateStr, `API Ws Msg ${ConnectName},${Msg}`);
			const Data = JSON.parse(Msg);
			if(Data.function == `ImgMed`) {
				Fs.writeFileSync(`./TestOut.png`, Data.data.Img, `base64`);
			}
		}
	);
}