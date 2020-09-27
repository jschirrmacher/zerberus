(function () {
  const socket = io()

  socket.on('hi', msg => {
    document.querySelector('h1').innerText = msg
    document.querySelectorAll('#gpio td').forEach(pin => {
      pin.classList.toggle('on', false)
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
      motor.angle = 0
      const pin = document.querySelector('#' + motor.dataset.connected)
      const wheel = motor.querySelector('img')
      pin.onValue = value => {
        motor.interval && clearInterval(motor.interval)
        motor.interval = setInterval(() => {
          angle = (angle + value * 10) % 360
          wheel.style.transform = `rotate(${angle}deg)`
        }, 50)
      }
    })
  }
})()
