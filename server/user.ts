import * as ws from "ws";
import {
  decorate,
  observable,
  autorun,
  IReactionDisposer,
  computed,
  action,
} from "mobx";
import Game from "./game";
import { Messages } from "../src/common/messages";
import { DEBUG } from ".";
import Statistics from "./statistics";

const names = ["Captain America", "Ironman", "Superman", "Batman", "Flash"];
let lastIndex = 0;

const HIGHLIGHT_DURATION = 3000;

export type UserId = string;

class User {
  constructor(id: UserId) {
    this.name = names[lastIndex++ % names.length];
    this.id = id;
  }
  sockets: Set<ws> = new Set();
  name: string;
  id: UserId;
  publicId: string = new Date().getTime().toString();
  disposer: IReactionDisposer[] = [];
  ready: boolean = false;
  selecting: boolean = false;
  coolDown: boolean = false;
  coolDownTimer: NodeJS.Timeout | null = null;
  statistics = new Statistics();
  highlightedCard: string | null = null;
  highlightedCardTimer: NodeJS.Timeout | null = null;

  highlightCard(card: string) {
    this.highlightedCardTimer && clearTimeout(this.highlightedCardTimer);
    this.highlightedCard = card;
    this.highlightedCardTimer = setTimeout(
      () => (this.highlightedCard = null),
      HIGHLIGHT_DURATION
    );
  }

  startCoolDown(duration: number) {
    this.coolDownTimer && clearTimeout(this.coolDownTimer);
    this.coolDown = true;
    this.coolDownTimer = setTimeout(() => (this.coolDown = false), duration);
  }

  registerSocket(ws: ws) {
    this.sockets.add(ws);
    const dispose = autorun(() => this.send(Messages.USER_NAME, this.name));
    const dispose2 = autorun(() => this.send(Messages.READY, this.ready));
    const dispose3 = autorun(() =>
      this.send(Messages.PUBLIC_ID, this.publicId)
    );

    ws.on("close", () => {
      this.sockets.delete(ws);
      dispose();
      dispose2();
      dispose3();
    });
  }

  send(message: string, data: any) {
    this.sockets.forEach((ws) => ws.send(JSON.stringify([message, data])));
  }

  disconnectFromGame() {
    this.disposer.forEach((dispose) => dispose());
    this.ready = false;
  }

  connectToGame(game: Game) {
    this.disconnectFromGame();
    const connect: { [key in Messages]?: keyof Game } = {
      [Messages.DECK]: "deck",
      [Messages.CARDS]: "cards",
      [Messages.SELECTED_CARDS]: "selectedCards",
      [Messages.STATUS]: "status",
      [Messages.GAME_ID]: "id",
      [Messages.PLAYERS]: "playerList",
      [Messages.HIGHLIGHTED_CARDS]: "highlightedCards",
    };

    this.disposer = Object.entries(connect).map(([message, key]) =>
      autorun((event) => {
        DEBUG &&
          console.log(
            "[send " + game.id + "]:",
            message,
            game[key as keyof Game]
          );
        this.send(message, game[key as keyof Game]);
      })
    );

    this.sockets.forEach((ws) =>
      ws.on("close", () => this.disconnectFromGame())
    );
  }

  get connected() {
    return this.sockets.size > 0;
  }
}

decorate(User, {
  name: observable,
  ready: observable,
  selecting: observable,
  connected: computed,
  publicId: observable,
  statistics: observable,
  coolDown: observable,
  startCoolDown: action,
  highlightedCard: observable,
  highlightCard: action,
});

export default User;
