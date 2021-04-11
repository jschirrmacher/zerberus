/* global io */

import JoystickHandle from "./JoystickHandle.js"
const speedometer = document.getElementById("speedometer")
const compass = document.getElementById("compass")

const socket = io()

JoystickHandle(document.getElementById("pad-handle")).on("change", (pos) => {
  socket.emit("joystick", pos)
})

socket.on("car-position", (info) => {
  speedometer.innerText = info.speed
  const rotate = Math.round(info.orientation)
  compass.setAttribute("style", `transform: rotate(${rotate}deg)`)
})
