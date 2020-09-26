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
    }
  })
})()
