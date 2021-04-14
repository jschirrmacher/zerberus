const preview = document.getElementById("camera-preview")
const previewUrl = preview.src
setInterval(() => (preview.src = previewUrl + "?" + +new Date()), 500)
