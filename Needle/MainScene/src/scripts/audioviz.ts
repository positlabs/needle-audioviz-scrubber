import { AudioSource, Behaviour, serializable, Sprite, Image } from "@needle-tools/engine"
import { AudioAnalyser, Audio, Vector2 } from "three"

function lerp(start, end, amt) {
  return (1 - amt) * start + amt * end
}

export class AudioViz extends Behaviour {
  @serializable(Image)
  image: Image = new Image()

  objectFitCover: boolean = true

  @serializable(AudioSource)
  audio?: AudioSource

  @serializable(Sprite)
  frames: Sprite[] = []

  private analyser?: AudioAnalyser
  private smoothLevel: number = 0
  private didInit: boolean = false
  private maxLevel: number = .0001
  private walkFrame: number = 0
  private startSize: Vector2 = new Vector2(1, 1)

  private rectNaturalSize: Vector2 = new Vector2(300, 150)

  start() {
    window.addEventListener('resize', this.onResize.bind(this))

    // cache original size of sprite before we resize it
    // sort of just for dev purposes so we aren't getting a feedback loop based on this value
    this.startSize = new Vector2(window.innerWidth, window.innerHeight)
    if (this.image.sprite?.rect) {
      this.rectNaturalSize.x = this.image.sprite.rect.width
      this.rectNaturalSize.y = this.image.sprite.rect.height
    }

    // setTimeout(() => {
      // let rectAspect = this.rectNaturalSize.y / this.rectNaturalSize.x
      // let windowAspect = window.innerHeight / window.innerWidth
      // // fill height
      // this.image.setOptions({
      //   width: 500 * windowAspect / rectAspect,
      //   height: 500,
      // })
    // }, 1)

    this.onResize()
  }

  onResize() {
    // resize the image to contain or cover

    // get the aspect ratios
    let rectAspect = this.rectNaturalSize.y / this.rectNaturalSize.x
    let windowAspect = window.innerHeight / window.innerWidth
    console.log('rectAspect', rectAspect)
    console.log('windowAspect', windowAspect)

    // find new ratio for constant size
    const windowSize = new Vector2(window.innerWidth, window.innerHeight)
    const constantSizeFactor = windowSize.y / this.startSize.y
    console.log('constantSizeFactor', constantSizeFactor)
    // 500 units is 100% of screen size
    const constantSize = new Vector2(500, 500)//.multiplyScalar(constantSizeFactor)

    // by default we use max height and scale width
    let size = new Vector2(windowAspect / rectAspect, 1).multiply(constantSize)

    // flip the relationship if aspect overflows
    // if(windowAspect > rectAspect) size = new Vector2(size.y, size.x)
    // console.log('windowAspect > rectAspect', windowAspect > rectAspect)

    // let coverScaleFactor = 1
    // if(this.objectFitCover) 
    // coverScaleFactor = rectAspect / windowAspect
    // console.log('coverScaleFactor', coverScaleFactor)
    // size = size.multiplyScalar(coverScaleFactor)// * constantSizeFactor)

    console.log('size', size)

    this.image.setOptions({
      width: size.x,
      height: size.y,
      // width: 500,
      // height: 500,
    })
  }

  initAnalyzer() {
    if (!this.audio) return
    this.didInit = true
    const sound = this.audio.Sound as any as Audio
    this.analyser = new AudioAnalyser(sound, 64) // fft size
  }

  update(): void {
    if (this.audio?.isPlaying && !this.didInit) this.initAnalyzer()

    // const freq = this.analyser?.getAverageFrequency() || 0
    // this.smoothLevel = lerp(this.smoothLevel, freq / 255, .5)

    // get normalized amplitude
    const pcmData = new Float32Array(64)
    this.analyser?.analyser.getFloatTimeDomainData(pcmData)
    let sumSquares = 0.0
    for (const amplitude of pcmData) { sumSquares += amplitude * amplitude }
    const level = Math.sqrt(sumSquares / pcmData.length)
    this.maxLevel = Math.max(level, this.maxLevel)
    this.smoothLevel = lerp(this.smoothLevel, level / this.maxLevel, .3)
    // console.log(this.smoothLevel)

    // use amplituede to drive forward progress
    this.walkFrame += this.smoothLevel

    // update the sprite source texture
    const sprite = this.frames[Math.floor(this.walkFrame * 4) % 150]
    // const sprite = this.frames[Math.floor(this.smoothLevel * 600) % 150];
    this.image.setTexture(sprite?.texture)
  }
}