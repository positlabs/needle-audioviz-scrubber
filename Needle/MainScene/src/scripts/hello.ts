import { Behaviour } from "@needle-tools/engine"

export class Hello extends Behaviour {

  start() {
    console.log('hello')
    window.addEventListener('click', () => {
      console.log('click')
    })
  }
}