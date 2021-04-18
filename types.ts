export enum CLIENT_TYPE {
  REMOTE_CONTROL = "REMOTE_CONTROL", // Sends operator commands to car
  COCKPIT = "COCKPIT", // shows camera image, car speed and similar properties
  CAMERA = "CAMERA", // is a camera
  GPIO_VIEWER = "GPIO_VIEWER", // shows pin values of GPIO
}
