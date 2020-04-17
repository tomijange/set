import React, { useContext } from "react";
import "./index.css";
import Deck from "../components/Deck";
import { useObserver } from "mobx-react";

import Game from "../Model/Game";
import { GameStatus } from "../common/gameStatus";

export default function Main() {
  const game = useContext(Game);
  return (
    <div className="main">
      {useObserver(() => (
        <>
          {game.status === GameStatus.RUNNING && <Deck />}
          {game.status === GameStatus.LOBBY && (
            <button onClick={() => game.startGame()}>Starten</button>
          )}
          {game.status === GameStatus.NONE && (
            <>
              <input
                value={game.userName}
                onChange={(event) => game.setName(event.target.value)}
              />
              <button onClick={() => game.createGame()}>
                Spiel erstellen oder Joinen
              </button>
            </>
          )}
        </>
      ))}
    </div>
  );
}
