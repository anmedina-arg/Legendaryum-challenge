import express, { Request, Response } from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import redis from "./redisClient";
import { Config } from "./types";
import {
  generateCoins,
  getCoinsByRoom,
  getCoinById,
  removeCoin,
} from "./utils";

console.log(redis);

const config: Config = {
  rooms: [
    {
      name: "room1",
      coins: [],
    },
    {
      name: "room2",
      coins: [],
    },
  ],
  coinAmount: 10,
  coinArea: {
    xmin: 0,
    xmax: 100,
    ymin: 0,
    ymax: 100,
    zmin: 0,
    zmax: 100,
  },
};

// Genera las monedas iniciales y las almacena en Redis
for (const room of config.rooms) {
  const coins = generateCoins(config.coinAmount, config.coinArea);
  room.coins.push(...coins);
  for (const coin of coins) {
    redis.set(coin.id, JSON.stringify(coin));
  }
}

// Crea una aplicación Express
const app = express();
const server = createServer(app);

// Configura Socket.io
const io = new Server(server);

io.on("connection", (socket: Socket) => {
  let currentRoom: string | null = null;

  socket.on("join", (roomName: string) => {
    if (currentRoom !== null) {
      socket.leave(currentRoom);
    }

    socket.join(roomName);
    currentRoom = roomName;

    const coins = getCoinsByRoom(roomName, config);
    socket.emit("coins", coins);
  });

  socket.on("grabCoin", (coinId: string) => {
    const coin = getCoinById(coinId, config);

    if (coin) {
      removeCoin(coinId, config, redis);
      socket.emit("coinGrabbed", coinId);
      socket.to(currentRoom!).emit("coinGrabbed", coinId);
    }
  });
});

// Ruta para obtener la cantidad de monedas disponibles en una habitación
app.get("/api/coins/:roomName", (req: Request, res: Response) => {
  const roomName = req.params.roomName;
  const coins = getCoinsByRoom(roomName, config);
  res.json({ count: coins.length });
});

const port = 3000;
server.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
