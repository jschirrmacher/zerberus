/* global io */
import { CLIENT_TYPE } from "./types.js"
;(function () {
  const canvas = document.querySelector("#car-area")
  const car = document.querySelector("#car")
  const carPos = document.querySelector("#car-pos")
  const mpuAccel = document.querySelector("#mpu .accel")
  const mpuGyro = document.querySelector("#mpu .gyro")
  const mpuSpeed = document.querySelector("#mpu .speed")
  const carPath = document.querySelector("#path")
  const center = { x: canvas.clientWidth / 2, y: canvas.clientHeight / 2 }
  const wayPoints = [center.x.toFixed(0) + " " + center.y.toFixed(0)]
  const flightindicator = document.querySelector("#flightindicator line")
  const speedo = document.querySelector("#speedo")

  const socket = io()

  socket.on("hi", (msg) => {
    document.querySelector("h1").innerText = msg
    document.querySelectorAll("#gpio td").forEach((pin) => {
      pin.classList.toggle("on", false)
      pin.classList = Array.from(pin.classList).filter((c) => !c.match(/^mode-/))
    })
    socket.emit("hi", [CLIENT_TYPE.REMOTE_CONTROL, CLIENT_TYPE.COCKPIT, CLIENT_TYPE.GPIO_VIEWER])
  })

  socket.on("gpio-mode", (msg) => {
    const el = document.querySelector("#gpio #pin-" + msg.pin)
    if (el) {
      el.classList = Array.from(el.classList).filter((c) => !c.match(/^mode-/))
      el.classList.add("mode-" + msg.mode.toLowerCase())
    }
  })

  socket.on("gpio-write", (msg) => {
    const el = document.querySelector("#gpio #pin-" + msg.pin)
    if (el) {
      el.classList.toggle("on", !!msg.value)
      if (el.onValue) {
        el.onValue(!!msg.value)
      }
    }
  })

  socket.on("gpio-pwm", (msg) => {
    const el = document.querySelector("#gpio #pin-" + msg.pin)
    if (el) {
      if (el.onValue) {
        el.onValue(+msg.value)
      }
    }
  })

  socket.on("command-list", (commands) => {
    connectController(commands)
  })

  function addWaypoint(x, y) {
    const waypoint = x.toFixed(0) + " " + y.toFixed(0)
    if (waypoint !== wayPoints[wayPoints[0]]) {
      wayPoints.unshift(waypoint)
      wayPoints.splice(250)
      carPath.setAttribute("d", "M" + wayPoints.join(" L"))
    }
  }

  function setCarPosition(msg) {
    const x = msg.posX * 150 + center.x
    const y = center.y - msg.posY * 150
    car.setAttribute("style", `transform: translate(${x}px, ${y}px) rotate(${msg.orientation}deg) scale(.5)`)
    addWaypoint(x, y)
    carPos.innerHTML = `x: ${msg.posX}<br>y: ${msg.posY}<br>o: ${msg.orientation}`

    const accel = msg.mpu?.accel.split(",")
    const gyro = msg.mpu?.gyro.split(",")
    const speed = msg.mpu?.speed.split(",")
    mpuAccel.innerHTML = "<span>accel:</span><span>" + accel.split(",").join("</span><span>") + "</span>"
    mpuGyro.innerHTML = "<span>gyro:</span><span>" + gyro.split(",").join("</span><span>") + "</span>"
    mpuSpeed.innerHTML = "<span>speed:</span><span>" + speed.split(",").join("</span><span>") + "</span>"

    flightindicator.y1 = 75 + accel.y * 75
    flightindicator.y2 = 75 + accel.y * 75
  }

  socket.on("connect", () => socket.emit("command", { name: "list-commands" }))
  socket.on("car-position", setCarPosition)

  const preview = document.getElementById("camera-preview")
  const camToggle = document.getElementById("camera-toggle")
  const previewUrl = preview.src
  let previewInterval
  camToggle.addEventListener("change", () => {
    if (camToggle.checked) {
      previewInterval = setInterval(() => (preview.src = previewUrl + "?" + +new Date()), 500)
    } else {
      clearInterval(previewInterval)
    }
  })
  document.querySelector("#clearPath").addEventListener("click", () => {
    const currentPos = wayPoints[wayPoints.length - 1]
    wayPoints.length = 0
    addWaypoint(...currentPos.split(" ").map(Number))
    document.activeElement.blur()
  })

  // const camera_socket = io('http://192.168.178.78:5000/')
  // camera_socket.on("error", () => {
  //   debugger
  // })
  // const utf8decoder = new TextDecoder()
  // camera_socket.on('img', async data => {
  //   console.log("img", data)
  //   document.getElementById('camera-preview').style.backgroundImage = "url(data:image/jpg;base64," + utf8decoder.decode(new Uint8Array(data['img'])) + ")"
  // })

  window.addEventListener("keydown", (event) => {
    const keys = {
      ArrowUp: "forward",
      ArrowDown: "back",
      ArrowLeft: "left",
      ArrowRight: "right",
      Space: "break",
      KeyT: "track",
    }
    if (keys[event.code]) {
      socket.emit("control", { cmd: keys[event.code] })
    }
  })

  connectLEDs()
  connectMotors()
  setCarPosition({ posX: 0, posY: 0, orientation: 0, accel: "0,0,0", gyro: "0,0,0" })

  function connectLEDs() {
    document.querySelectorAll(".led").forEach((led) => {
      const shadow = led.querySelector(".shadow")
      const pin = document.querySelector("#" + led.dataset.connected)
      pin.onValue = (value) => (shadow.style.opacity = 1 - value)
    })
  }

  function connectMotors() {
    document.querySelectorAll(".motor").forEach((motor) => {
      function updateWheel() {
        if (motor.control.in1 !== motor.control.in2 && motor.control.ena) {
          const percent = motor.control.ena / 2.55
          motor.wheel.style.animationDuration = 100 / percent + "s"
          motor.wheel.style.animationDirection = motor.control.in1 ? "reverse" : "normal"
          motor.speedo.innerText = (motor.control.in1 ? -1 : 1) * Math.round(percent) + "%"
        } else {
          motor.wheel.style.animationDuration = "0s"
          motor.speedo.innerText = "STOPPED"
        }
      }

      function setValueHandler(name) {
        return function (value) {
          if (motor.control[name] !== value) {
            motor.control[name] = value
            updateWheel()
          }
        }
      }

      motor.control = { in1: false, in2: false, ena: false }
      motor.angle = 0
      motor.wheel = motor.querySelector("img")
      motor.speedo = motor.querySelector(".speed")
      const [in1, in2, ena] = motor.dataset.connected.split(",")
      document.querySelector("#" + in1).onValue = setValueHandler("in1")
      document.querySelector("#" + in2).onValue = setValueHandler("in2")
      document.querySelector("#" + ena).onValue = setValueHandler("ena")
      updateWheel()
    })
  }

  function connectController(commands) {
    const controller = document.querySelector("#command-controller")
    controller.innerHTML = ""
    commands.forEach((name) => {
      const button = document.createElement("button")
      button.innerText = name
      button.onclick = () => {
        socket.emit("command", { name })
        document.activeElement.blur()
      }
      controller.appendChild(button)
    })
  }
})()
