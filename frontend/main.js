(function () {
  const canvas = document.querySelector('#car-area')
  const car = document.querySelector('#car')
  const carPos = document.querySelector('#car-pos')
  const center = { x: canvas.clientWidth / 2, y: canvas.clientHeight / 2 }

  const socket = io()

  socket.on('hi', msg => {
    document.querySelector('h1').innerText = msg
    document.querySelectorAll('#gpio td').forEach(pin => {
      pin.classList.toggle('on', false)
      pin.classList = Array.from(pin.classList).filter(c => !c.match(/^mode-/))
    })
  })

  socket.on('gpio-mode', msg => {
    const el = document.querySelector('#gpio #pin-' + msg.pin)
    if (el) {
      el.classList = Array.from(el.classList).filter(c => !c.match(/^mode-/))
      el.classList.add('mode-' + msg.mode.toLowerCase())
    }
  })

  socket.on('gpio-write', msg => {
    const el = document.querySelector('#gpio #pin-' + msg.pin)
    if (el) {
      el.classList.toggle('on', !!msg.value)
      if (el.onValue) {
        el.onValue(!!msg.value)
      }
    }
  })

  socket.on('gpio-pwm', msg => {
    const el = document.querySelector('#gpio #pin-' + msg.pin)
    if (el) {
      if (el.onValue) {
        el.onValue(+msg.value)
      }
    }
  })

  socket.on('command-list', commands => {
    connectController(commands)
  })

  function setCarPosition(msg) {
    const x = msg.posX * 150 + center.x
    const y = msg.posY * 150 + center.y
    car.setAttribute('style', `transform: translate(${x}px, ${y}px) rotate(${msg.orientation}deg) scale(.5)`)
    carPos.innerHTML = `x: ${msg.posX.toFixed()}<br>y: ${msg.posY.toFixed()}<br>o: ${msg.orientation.toFixed(0)}`
  }

  socket.on('connect', () => socket.emit('command', {name: 'list-commands'}))
  socket.on('car-position', setCarPosition)

  const camera_socket = io('http://192.168.178.78:5000/')

  camera_socket.on('img', data => {
    console.log(data)
    document.getElementById('camera-preview').style.backgroundImage = "data:image/png;base64," + data['img']
  } )

  window.addEventListener('keydown', (event) => {
    const keys = {
      ArrowUp: 'accelerate',
      ArrowDown: 'decelerate',
      ArrowLeft: 'turn-left',
      ArrowRight: 'turn-right',
      Space: 'break',
    }
    socket.emit('control', { cmd: keys[event.code] })
  })

  connectLEDs()
  connectMotors()
  setCarPosition({ posX: 0, posY: 0, orientation: 0 })

  function connectLEDs() {
    document.querySelectorAll('.led').forEach(led => {
      const shadow = led.querySelector('.shadow')
      const pin = document.querySelector('#' + led.dataset.connected)
      pin.onValue = value => shadow.style.opacity = 1 - value
    })
  }

  function connectMotors() {
    document.querySelectorAll('.motor').forEach(motor => {
      function updateWheel() {
        if (motor.control.in1 !== motor.control.in2 && motor.control.ena) {
          const percent = motor.control.ena / 2.55
          motor.wheel.style.animationDuration = (100 / percent) + 's'
          motor.wheel.style.animationDirection = motor.control.in1 ? 'reverse' : 'normal'
          motor.speedo.innerText = (motor.control.in1 ? -1 : 1) * Math.round(percent) + '%'
        } else {
          motor.wheel.style.animationDuration = '0s'
          motor.speedo.innerText = 'STOPPED'
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
      motor.wheel = motor.querySelector('img')
      motor.speedo = motor.querySelector('.speed')
      const [ in1, in2, ena ] = motor.dataset.connected.split(',')
      document.querySelector('#' + in1).onValue = setValueHandler('in1')
      document.querySelector('#' + in2).onValue = setValueHandler('in2')
      document.querySelector('#' + ena).onValue = setValueHandler('ena')
      updateWheel()
    })
  }

  function connectController(commands) {
    const controller = document.querySelector('#command-controller')
    controller.innerHTML = ''
    commands.forEach(name => {
      const button = document.createElement('button')
      button.innerText = name
      button.onclick = () => socket.emit('command', { name })
      controller.appendChild(button)
    })
  }
})()
