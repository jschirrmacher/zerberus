(function () {
  const canvas = document.querySelector('#car-area canvas')
  const ctx = canvas.getContext('2d')
  ctx.strokeStyle = 'red'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(canvas.width / 2, canvas.height / 2)
  ctx.lineTo(canvas.width / 2 - 1, canvas.height / 2 - 1)
  ctx.stroke()

  let lastPos = { x: canvas.width / 2 - 1, y: canvas.height / 2 - 1 }
  
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

  socket.on('car-position', msg => {
    ctx.beginPath()
    ctx.moveTo(lastPos.x, lastPos.y)
    lastPos.x = msg.posX + canvas.width / 2
    lastPos.y = msg.posY + canvas.height / 2
    ctx.lineTo(lastPos.x, lastPos.y)
    ctx.stroke()
    console.log(msg)
  })

  connectLEDs()
  connectMotors()

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
})()
