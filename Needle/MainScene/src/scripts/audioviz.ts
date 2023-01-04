import { AudioSource, Behaviour, serializable, Sprite, Image } from "@needle-tools/engine"
import { AudioAnalyser, Audio } from "three"

function lerp(start, end, amt) {
  return (1 - amt) * start + amt * end
}

export class AudioViz extends Behaviour {

  @serializable(Sprite)
  frames: Sprite[] = []
  
  @serializable(Image)
  image?: Image

  @serializable(AudioSource)
  audio?: AudioSource

  private analyser?: AudioAnalyser
  private smoothLevel: number = 0
  private didInit: boolean = false
  private maxLevel: number = .0001
  private walkFrame: number = 0

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
    const pcmData = new Float32Array(64);
    this.analyser?.analyser.getFloatTimeDomainData(pcmData);
    let sumSquares = 0.0;
    for (const amplitude of pcmData) { sumSquares += amplitude*amplitude; }
    const level = Math.sqrt(sumSquares / pcmData.length)
    this.maxLevel = Math.max(level, this.maxLevel)
    this.smoothLevel = lerp(this.smoothLevel, level / this.maxLevel, .3)
    console.log(this.smoothLevel)
    this.walkFrame += this.smoothLevel

    if(this.image?.sprite){
      const sprite = this.frames[Math.floor(this.walkFrame * 4) % 150];
      // const sprite = this.frames[Math.floor(this.smoothLevel * 600) % 150];
      this.image["setTexture"](sprite?.texture)
    //   this.image.sprite.texture = this.frames[Math.floor(this.smoothLevel * 150) % 20].texture
    }
  }
}