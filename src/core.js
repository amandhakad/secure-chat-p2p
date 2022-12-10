/* need peer.js */
function buildLobby(lobbyKey) {
	var lpeer = new Peer(lobbyKey);

	lpeer.on('open', function(id) {
		console.log("lobby id", id);
		var connArr = {};
		var lobbyMessages = [];
		lpeer.on('connection', function(lconn) {

			lconn.on('data', function(data) {
				// console.log("Lobby received this", data);

				if(data["type"]==="new_peer") {
					connArr[lconn.peer] = { connectionRef: lconn, updatedAt: (new Date()).getTime()};
					// console.log("conArr init", connArr);
				}

				if(data["type"]==="ALIVE") {
					connArr[lconn.peer] = { connectionRef: lconn, updatedAt: (new Date()).getTime()};
					// console.log("conArr update", connArr);
				}

				lconn.send({type: "LOBBY_DATA", data: Object.keys(connArr)});

			});

			lconn.on("close", function() {
				console.log("closed");
			});

			expire(connArr);

		});
	});
}

function buildPeer(lobbyKey, resolvePeer, callbackPeerListUpdate, receiveP2PConn, handleP2PMessage) {
	var peer = new Peer();

	peer.on('open', function(id) {
		resolvePeer(peer);
		connectPeerToLobby(peer, lobbyKey, callbackPeerListUpdate);

		peer.on('connection', function(p2pConnection) {
			// peer.disconnect();
			// console.log("look this is 2");
			receiveP2PConn(p2pConnection);
			p2pConnection.on('data', function(data) {
				console.log("p2p received this", data);

				if(data["type"]==="p2pmessage") {
					handleP2PMessage({from: "Peer", msg: data["data"]})
				}

				if(data["type"]==="ALIVE") {
					// connArr[lconn.peer] = { connectionRef: lconn, updatedAt: (new Date()).getTime()};
					// console.log("conArr update", connArr);
				}

				// lconn.send({type: "LOBBY_DATA", data: Object.keys(connArr)});

			})
		});
	});
}

function connectPeerToLobby(peer, lobbyKey, callbackPeerListUpdate) {

	var conn = peer.connect(lobbyKey);

	conn.on('open', function() {
		console.log("conn", conn);

		conn.on('data', function(data) {
		 	if(data["type"]==="LOBBY_DATA") {
		 		callbackPeerListUpdate(data["data"]);
		 	}
		});

		conn.send({type: "new_peer"});
		remindAlive(conn);

	});

}

function remindAlive(conn) {
	conn.send({type: "ALIVE"});
	window.setTimeout(() => remindAlive(conn), 2000);
}

function expire(connArr) {
	for(let i in connArr) {
		if((new Date()).getTime() - connArr[i]["updatedAt"] > 5000) {
			// connArr[i]["connectionRef"].send("must close");
			connArr[i]["connectionRef"].close();
			delete connArr[i];
		}
	}
	window.setTimeout(() => expire(connArr), 2000);
}

function buildP2P(peer, target, handleP2PMessage, receiveP2PConnectionObject) {
	console.log("peer target", target);
	if(peer.disconnected) {
		peer.reconnect();
	}

	var p2pConn = peer.connect(target);

	p2pConn.on('open', function() {

		p2pConn.on('data', function(data) {
		 	if(data["type"]==="p2pmessage") {
		 		handleP2PMessage({from: "Peer", msg: data["data"] });
		 	}
		});

		// remindAlive(conn);
		receiveP2PConnectionObject(p2pConn);
	});
}