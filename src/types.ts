export interface Coin {
  id: string;
  position: { x: number; y: number; z: number };
}

export interface Room {
  name: string;
  coins: Coin[];
}

export interface Config {
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
