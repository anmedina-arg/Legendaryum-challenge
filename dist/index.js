"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var http_1 = require("http");
var socket_io_1 = require("socket.io");
var ioredis_1 = __importDefault(require("ioredis"));
var uuid_1 = require("uuid");
var mock_1 = require("./mock");
var redis = new ioredis_1.default(); // Se conecta a Redis
// Genera las monedas iniciales y las almacena en Redis
for (var _i = 0, _b = mock_1.config.rooms; _i < _b.length; _i++) {
    var room = _b[_i];
    var coins = generateCoins(mock_1.config.coinAmount, mock_1.config.coinArea);
    (_a = room.coins).push.apply(_a, coins);
    for (var _c = 0, coins_1 = coins; _c < coins_1.length; _c++) {
        var coin = coins_1[_c];
        redis.set(coin.id, JSON.stringify(coin));
    }
}
// Crea una aplicación Express
var app = (0, express_1.default)();
var server = (0, http_1.createServer)(app);
// Configura Socket.io
var io = new socket_io_1.Server(server);
io.on("connection", function (socket) {
    var currentRoom = null;
    socket.on("join", function (roomName) {
        if (currentRoom !== null) {
            socket.leave(currentRoom);
        }
        socket.join(roomName);
        currentRoom = roomName;
        var coins = getCoinsByRoom(roomName);
        socket.emit("coins", coins);
    });
    socket.on("grabCoin", function (coinId) {
        var coin = getCoinById(coinId);
        if (coin) {
            removeCoin(coinId);
            socket.emit("coinGrabbed", coinId);
            socket.to(currentRoom).emit("coinGrabbed", coinId);
        }
    });
});
// Ruta para obtener la cantidad de monedas disponibles en una habitación
app.get("/api/coins/:roomName", function (req, res) {
    var roomName = req.params.roomName;
    var coins = getCoinsByRoom(roomName);
    res.json({ count: coins.length });
});
// Genera un conjunto de monedas en una área específica
function generateCoins(amount, area) {
    var coins = [];
    for (var i = 0; i < amount; i++) {
        var position = {
            x: getRandomNumber(area.xmin, area.xmax),
            y: getRandomNumber(area.ymin, area.ymax),
            z: getRandomNumber(area.zmin, area.zmax),
        };
        coins.push({ id: (0, uuid_1.v4)(), position: position });
    }
    return coins;
}
// Genera un número aleatorio dentro de un rango
function getRandomNumber(min, max) {
    return Math.random() * (max - min) + min;
}
// Obtiene todas las monedas de una habitación
function getCoinsByRoom(roomName) {
    var room = mock_1.config.rooms.find(function (r) { return r.name === roomName; });
    return room ? room.coins : [];
}
// obtener una moneda por su ID
function getCoinById(coinId) {
    for (var _i = 0, _a = mock_1.config.rooms; _i < _a.length; _i++) {
        var room = _a[_i];
        var coin = room.coins.find(function (c) { return c.id === coinId; });
        if (coin) {
            return coin;
        }
    }
    return undefined;
}
// Funcion para eliminar una moneda
function removeCoin(coinId) {
    for (var _i = 0, _a = mock_1.config.rooms; _i < _a.length; _i++) {
        var room = _a[_i];
        var index = room.coins.findIndex(function (c) { return c.id === coinId; });
        if (index !== -1) {
            room.coins.splice(index, 1);
            redis.del(coinId);
            break;
        }
    }
}
var port = 3000;
server.listen(port, function () {
    console.log("Servidor escuchando en el puerto ".concat(port));
});
