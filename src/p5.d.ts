declare module "p5" {
  class p5 {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
    constructor(sketch: (p: p5) => void, node?: HTMLElement | string)
    remove(): void
    createCanvas(w: number, h: number): { parent(el: HTMLElement | string): void }
    setup?: () => void
    draw?: () => void
    mouseMoved?: () => void
    mousePressed?: () => void
    mouseDragged?: () => void
    mouseReleased?: () => void
    mouseClicked?: () => void
    mouseWheel?: (event: WheelEvent) => void | boolean
    background(r: number, g?: number, b?: number, a?: number): void
    fill(r: number | number[] | string | Color, g?: number, b?: number, a?: number): void
    noFill(): void
    stroke(r: number | number[] | string, g?: number, b?: number, a?: number): void
    noStroke(): void
    strokeWeight(w: number): void
    line(x1: number, y1: number, x2: number, y2: number): void
    rect(...args: number[]): void
    ellipse(x: number, y: number, w: number, h?: number): void
    text(str: unknown, x: number, y: number, maxWidth?: number): void
    textSize(s: number): void
    textFont(font: string): void
    textAlign(h: number, v?: number): void
    vertex(x: number, y: number): void
    beginShape(): void
    endShape(mode?: unknown): void
    lerpColor(c1: unknown, c2: unknown, amt: number): Color
    color(r: number, g?: number, b?: number, a?: number): Color
    noLoop(): void
    redraw(): void
    loop(): void
    push(): void
    pop(): void
    translate(x: number, y?: number): void
    rotate(angle: number): void
    scale(s: number): void
    mouseX: number
    mouseY: number
    width: number
    height: number
    CENTER: number
    LEFT: number
    RIGHT: number
    TOP: number
    BOTTOM: number
    PI: number
    TWO_PI: number
    HALF_PI: number
    CLOSE: number
    LINES: number
    TRIANGLES: number
  }
  class Color {}
  export default p5
}
