/* global io */

import JoystickHandle from "./JoystickHandle.js"
const posContainer = document.getElementById("pos")

const socket = io()

JoystickHandle(document.getElementById("pad-handle")).on("change", (pos) => {
  posContainer.innerText = `${pos.x} / ${pos.y}`
  socket.emit("joystick", pos)
})
