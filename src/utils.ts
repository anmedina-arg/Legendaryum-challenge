import { v4 as uuid } from "uuid";
import { Coin, Config } from "./types";
import Redis from "ioredis";

export function getRandomNumber(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function generateCoins(
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

export function getCoinsByRoom(roomName: string, config: Config): Coin[] {
  const room = config.rooms.find((r) => r.name === roomName);
  return room ? room.coins : [];
}

export function getCoinById(coinId: string, config: Config): Coin | undefined {
  for (const room of config.rooms) {
    const coin = room.coins.find((c) => c.id === coinId);
    if (coin) {
      return coin;
    }
  }
  return undefined;
}

export function removeCoin(coinId: string, config: Config, redis: Redis): void {
  for (const room of config.rooms) {
    const index = room.coins.findIndex((c) => c.id === coinId);
    if (index !== -1) {
      room.coins.splice(index, 1);
      redis.del(coinId);
      break;
    }
  }
}
