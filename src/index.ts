import express, { Request, Response } from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import Redis from "ioredis";
import { v4 as uuid } from "uuid";

interface Coin {
  id: string;
  position: { x: number; y: number; z: number };
}

interface Room {
  name: string;
  coins: Coin[];
}

interface Config {
  rooms: Room[];
  coinAmount: number;
  coinArea: {
    xmin: number;
    xmax: number;
    ymin: number;
    ymax: number;
    zmin: number;
    zmax: number;
  };
}

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
  coinAmount: 8,
  coinArea: {
    xmin: 0,
    xmax: 100,
    ymin: 0,
    ymax: 100,
    zmin: 0,
    zmax: 100,
  },
};

const redis = new Redis(); // Se conecta a Redis

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

    const coins = getCoinsByRoom(roomName);
    socket.emit("coins", coins);
  });

  socket.on("grabCoin", (coinId: string) => {
    const coin = getCoinById(coinId);

    if (coin) {
      removeCoin(coinId);
      socket.emit("coinGrabbed", coinId);
      socket.to(currentRoom!).emit("coinGrabbed", coinId);
    }
  });
});

// Ruta para obtener la cantidad de monedas disponibles en una habitación
app.get("/api/coins/:roomName", (req: Request, res: Response) => {
  const roomName = req.params.roomName;
  const coins = getCoinsByRoom(roomName);
  res.json({ count: coins.length });
});

// Genera un conjunto de monedas en una área específica
function generateCoins(
  amount: number,
  area: {
    xmin: number;
    xmax: number;
    ymin: number;
    ymax: number;
    zmin: number;
    zmax: number;
  }
): Coin[] {
  const coins: Coin[] = [];

  for (let i = 0; i < amount; i++) {
    const position = {
      x: getRandomNumber(area.xmin, area.xmax),
      y: getRandomNumber(area.ymin, area.ymax),
      z: getRandomNumber(area.zmin, area.zmax),
    };

    coins.push({ id: uuid(), position });
  }

  return coins;
}

// Genera un número aleatorio dentro de un rango
function getRandomNumber(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// Obtiene todas las monedas de una habitación
function getCoinsByRoom(roomName: string): Coin[] {
  const room = config.rooms.find((r) => r.name === roomName);
  return room ? room.coins : [];
}

// Obtiene una moneda por su ID
function getCoinById(coinId: string): Coin | undefined {
  for (const room of config.rooms) {
    const coin = room.coins.find((c) => c.id === coinId);
    if (coin) {
      return coin;
    }
  }
  return undefined;
}

// Elimina una moneda por su ID
function removeCoin(coinId: string): void {
  for (const room of config.rooms) {
    const index = room.coins.findIndex((c) => c.id === coinId);
    if (index !== -1) {
      room.coins.splice(index, 1);
      redis.del(coinId);
      break;
    }
  }
}

const port = 3000;
server.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
