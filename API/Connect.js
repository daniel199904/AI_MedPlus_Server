const DateToStr = require(`../Lib/datetostr.js`);
const MD5 = require(`md5`);
/**
 * [WsServerClientList description]
 * @type {Array}
 */
let WsServerClientList = [];
/**
 * [NodeSelectMeshList description]
 * @type {Array}
 */
let NodeSelectMeshList = [];
/**
 * NodeRegister
 * @param  {Object} Data Websocket Req Data
 * @param  {Object} Ws   Websocket Object
 * @return {Object}      Websocket Res Data
 */
const NodeRegister = async (Data, Ws) => {
	const DateStr = DateToStr(new Date(), `yyyy-MM-dd-hh:mm:ss`);
	const Client = WsServerClientList.find((Client) => Client.ID == Data.data.ID)
	let ResData;
	if (Client) {
		console.log(DateStr, `API Error`, `ID Repeat, ID:`, Client.ID);
		NodeClear(Client.Ws);
		// ResData = {
		// 	function: `NodeRegister`,
		// 	status: false
		// };
		// return ResData;
	}

	console.log(DateStr, `API On`, `ID:`, Data.data.ID, `Type:`, Data.data.Type);
	WsServerClientList.push({ ID: Data.data.ID, Type: Data.data.Type, SelectID: null, Ws: Ws });
	ResData = {
		function: `NodeRegister`,
		status: true,
		data: {
			Type: Data.data.Type,
			ID: Data.data.ID
		}
	};
	return ResData;
}
/**
 * NodeClear
 * @param  {Object} Ws Websocket Object
 * @return {Object}    Websocket Res Data
 */
const NodeClear = async (Ws) => {
	const DateStr = DateToStr(new Date(), `yyyy-MM-dd-hh:mm:ss`);
	const Client = WsServerClientList.find((Client) => Client.Ws == Ws);
	if (!Client) return;
	console.log(DateStr, `API Close`, `ID:`, Client.ID, `Type:`, Client.Type);
	// 如果此節點有綁定
	if(Client.SelectID) {
		// 先取得綁定的清單
		const SelectList = NodeSelectMeshList.find((SelectList) => SelectList.SelectID == Client.SelectID);
		// 先移除已經離線的設備
		SelectList.MeshList = SelectList.MeshList.filter((Mesh) => Mesh.ID != Client.ID);
		// 對還連線的設備發出斷線通知，並且清除還有連線設備的SelectID
		SelectList.MeshList.forEach((Mesh) => {
			// 發出斷開連線的通知
			let ResData = {
				function: `NodeSelectClose`,
				status: true,
				data: {
					SelectID: Client.SelectID 
				}
			};
			Mesh.Ws.send(JSON.stringify(ResData));
			// 清除SelectID
			const SelectClient = WsServerClientList.find((Client) => Client.ID == Mesh.ID);
			SelectClient.SelectID = null;
		});
		// 移除綁定事件
		NodeSelectMeshList = NodeSelectMeshList.filter((NodeSelectMesh) => NodeSelectMesh != SelectList);
	}
	WsServerClientList = WsServerClientList.filter((Client) => Client.Ws != Ws);
	return;
};


const NodeSelect = async (Data, Ws) => {
	const DateStr = DateToStr(new Date(), `yyyy-MM-dd-hh:mm:ss`);
	// 請求綁定節點資料
	// 透過Ws Object Find
	const ReqClient = WsServerClientList.find((Client) => Client.Ws == Ws);
	// 欲綁定節點資料
	// 透過登記過的ID Find
	const SelectClient = WsServerClientList.find((Client) => Client.ID == Data.data.SelectID);

	// 任意一者沒取得（沒做過節點登記）跳出
	if (!ReqClient) return;
	if (!SelectClient) return;
	// 根據目前時間產生SelectID
	// 不一定會使用，但是先產生
	const SelectID = MD5(DateStr);
	if (ReqClient.SelectID) {
		// 如果請求的節點有綁定的節點
		const SelectList = NodeSelectMeshList.find((SelectList) => SelectList.SelectID == ReqClient.SelectID);
		SelectList.MeshList.push({ ID: SelectClient.ID, Type: SelectClient.Type, Ws: SelectClient.Ws });
		SelectClient.SelectID = ReqClient.SelectID;
	} else if(SelectClient.SelectID) {
		// 如果欲綁定的節點有綁定的節點
		const SelectList = NodeSelectMeshList.find((SelectList) => SelectList.SelectID == SelectClient.SelectID);
		SelectList.MeshList.push({ ID: ReqClient.ID, Type: ReqClient.Type, Ws: ReqClient.Ws });
		ReqClient.SelectID = SelectClient.SelectID;
	} else {
		NodeSelectMeshList.push({
			SelectID: SelectID,
			MeshList: [
				{ ID: ReqClient.ID, Type: ReqClient.Type, Ws: ReqClient.Ws },
				{ ID: SelectClient.ID, Type: SelectClient.Type, Ws: SelectClient.Ws }
			]
		});
		ReqClient.SelectID = SelectID;
		SelectClient.SelectID = SelectID;
	}

	let ResData = {
		function: `NodeSelect`,
		status: true,
		data: {
			SelectID: SelectID
		}
	};
	// 將綁定Res轉傳至綁定的設備
	SelectClient.Ws.send(JSON.stringify(ResData));
	// 請求綁定的Res算是完整的WS接收/回應流程，故Return給main做後續處理
	return ResData;
}

/**
 * GetNodeList
 * @param  {Object} Data Websocket Req Data
 * @param  {Object} Ws   Websocket Object
 * @return {Object}      Websocket Res Data
 */

const GetNodeList = async (Data, Ws) => {
	const DateStr = DateToStr(new Date(), `yyyy-MM-dd-hh:mm:ss`);
	const NodeList = [];
	WsServerClientList.forEach((Client) => NodeList.push({ Type: Client.Type, ID: Client.ID }));
	let ResData = {
		function: `GetNodeList`,
		status: true,
		data: {
			List: NodeList
		}
	};
	return ResData;
};

module.exports = {
	NodeRegister: NodeRegister,
	NodeClear: NodeClear,
	GetNodeList: GetNodeList,
	NodeSelect: NodeSelect,
	WsServerClientList: () => { return WsServerClientList; },
	NodeSelectMeshList: () => { return NodeSelectMeshList; }
}