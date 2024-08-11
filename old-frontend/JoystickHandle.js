function absolutePosition(el) {
  let pos = { x: 0, y: 0 }
  while ((el = el.parentNode) !== document) {
    pos.x += el.offsetLeft
    pos.y += el.offsetTop
  }
  return pos
}

export default function JoystickHandle(handle) {
  const handleSize = { x: handle.clientWidth, y: handle.clientHeight }
  const handleCenter = { x: handleSize.x / 2, y: handleSize.y / 2 }
  const padPos = absolutePosition(handle)
  const padSize = { x: handle.parentNode.clientWidth - handleSize.x, y: handle.parentNode.clientHeight - handleSize.y }
  const padCenter = { x: padSize.x / 2, y: padSize.y / 2 }
  const clamp = (min, max) => (val) => Math.floor(Math.min(Math.max(val, min), max))
  const clampX = clamp(0, padSize.x)
  const clampY = clamp(0, padSize.y)
  const listeners = []

  handle.addEventListener("mousedown", touchstart, { passive: true })
  handle.addEventListener("touchstart", touchstart, { passive: true })

  let snapBackTimer
  let pos = { x: 0, y: 0 }
  update()

  function update() {
    listeners.forEach((listener) => listener(pos))
    const x = ((pos.x / 100) * padSize.x) / 2 + padCenter.x
    const y = ((-pos.y / 100) * padSize.y) / 2 + padCenter.y
    handle.setAttribute("style", `top: ${y}px; left: ${x}px`)
  }

  function handleMove(event) {
    event.preventDefault()
    const clientX = event.clientX || event.touches[0].clientX
    const clientY = event.clientY || event.touches[0].clientY
    pos.x = Math.round(((clampX(clientX - padPos.x - handleCenter.x) / padSize.x) * 2 - 1) * 100)
    pos.y = -Math.round(((clampY(clientY - padPos.y - handleCenter.y) / padSize.y) * 2 - 1) * 100)
    update()
  }

  function backTowardsCenter() {
    if (pos.x || pos.y) {
      pos.x = Math.abs(pos.x) < 5 ? 0 : Math.round(pos.x - pos.x / 5)
      pos.y = Math.abs(pos.y) < 5 ? 0 : Math.round(pos.y - pos.y / 5)
      update()
      snapBackTimer = setTimeout(backTowardsCenter, 20)
    } else {
      snapBackTimer = undefined
    }
  }

  function touchstart() {
    function removeHandler() {
      document.removeEventListener("mousemove", handleMove)
      document.removeEventListener("touchmove", handleMove)
      snapBackTimer = setTimeout(backTowardsCenter, 20)
    }

    if (snapBackTimer) {
      clearTimeout(snapBackTimer)
    }
    snapBackTimer = undefined
    document.addEventListener("mousemove", handleMove, { passive: false })
    document.addEventListener("touchmove", handleMove, { passive: false })
    document.addEventListener("mouseup", removeHandler, { passive: true, once: true })
    document.addEventListener("touchend", removeHandler, { passive: true, once: true })
  }

  return {
    on(eventName, func) {
      if (eventName === "change") {
        listeners.push(func)
      }
    },
  }
}
