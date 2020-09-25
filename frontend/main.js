(function () {
  const socket = io()

  socket.on('hi', msg => {
    document.querySelector('h1').innerText = msg
  })

  socket.on('gpio', msg => {
    document.querySelector('#gpio-' + msg.pin).innerText = msg.value
  })
})()
