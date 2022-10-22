/* global io */

import JoystickHandle from "./JoystickHandle.js"
import { CLIENT_TYPE } from "./types.js"

const preview = document.getElementById("camera-preview")
const speedometer = document.getElementById("speedometer")
const compass = document.getElementById("compass")
const trackerToggle = document.querySelector("#tracker-toggle input")
const cameraToggle = document.querySelector("#camera-toggle input")

const previewUrl = preview.src
let cameraInterval

const socket = io()
socket.emit("hi", [CLIENT_TYPE.REMOTE_CONTROL, CLIENT_TYPE.COCKPIT])

JoystickHandle(document.getElementById("pad-handle")).on("change", (pos) => {
  socket.emit("joystick", pos)
})

trackerToggle.addEventListener("click", () => {
  socket.emit("tracker", !trackerToggle.checked)
})
cameraToggle.addEventListener("click", () => {
  if (cameraToggle.checked) {
    cameraInterval = setInterval(() => (preview.src = previewUrl + "?" + +new Date()), 500)
  } else {
    clearInterval(cameraInterval)
  }
})

socket.on("car-position", (info) => {
  speedometer.innerText = info.speed + "km/h"
  const rotate = Math.round(info.orientation)
  compass.setAttribute("style", `transform: rotate(${rotate}deg)`)
})
