import React, { useContext } from "react";
import Game from "Model/Game";
import { useObserver } from "mobx-react";

import "./GameLobby.css";
import PlayerList from "components/PlayerList";
import Deck from "components/Deck";

import "./Game.css";

export default function Lobby() {
  const game = useContext(Game);

  return useObserver(() => (
    <div className="game-container">
      <div className="game-bar">
        <PlayerList />
        <div
          className="button button-create small close-button"
          onClick={() => game.leaveGame()}
        >
          <span>x</span>
        </div>
      </div>
      <div className="deck">
        <Deck />
      </div>
    </div>
  ));
}