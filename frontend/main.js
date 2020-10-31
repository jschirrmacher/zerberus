(function () {
  const canvas = document.querySelector('#car-area')
  const car = document.querySelector('#car')
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
    car.setAttribute('style', `transform: translate(${msg.posX * 150 + center.x}px, ${center.y - msg.posY * 150}px) rotate(${-msg.orientation}deg) scale(.5)`)
  }

  socket.on('connect', () => socket.emit('command', {name: 'list-commands'}))
  socket.on('car-position', setCarPosition)

  const camera_socket = io('http://192.168.178.78:5000/')

  camera_socket.on('img', data => document.getElementById('camera-preview').style.backgroundImage = "data:image/png;base64," + data['img'])


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
      function resetInterval() {
        motor.interval && clearInterval(motor.interval)
        if (motor.control.in1 !== motor.control.in2) {
          const direction = motor.control.in1 ? 1 : -1
          const value = direction * motor.control.ena / 10
          motor.interval = setInterval(() => {
            motor.angle = (motor.angle + value) % 360
            motor.wheel.style.transform = `rotate(${motor.angle}deg)`
          }, 50)
        }
      }
  
      function setValueHandler(name) {
        return function (value) {
          if (motor.control[name] !== value) {
            motor.control[name] = value
            resetInterval()
          }
        }
      }
  
      motor.control = { in1: false, in2: false, ena: false }
      motor.angle = 0
      motor.wheel = motor.querySelector('img')
      const [ in1, in2, ena ] = motor.dataset.connected.split(',')
      document.querySelector('#' + in1).onValue = setValueHandler('in1')
      document.querySelector('#' + in2).onValue = setValueHandler('in2')
      document.querySelector('#' + ena).onValue = setValueHandler('ena')
    })
  }

  function connectController(commands) {
    const controller = document.querySelector('#command-controller')
    commands.forEach(name => {
      const button = document.createElement('button')
      button.innerText = name
      button.onclick = () => socket.emit('command', { name })
      controller.appendChild(button)
      })
  }
})()
