/** A loop the registry can hold and resume: a Web Animation, or a CSS loop from cssLoop(). */
                                              

/** Ends a loop for good: an animation left running keeps ticking on its element after the page goes away. */
const end = (loop      ) => (loop instanceof Animation ? loop.cancel() : loop.pause())

/**
 * A CSS animation as a loop: page-mcp.css holds every animation on an element marked is-offscreen, pseudo-elements
 * included. CSS recreates an animation when its rules change, so the element is held rather than the Animation object.
 */
export const cssLoop = (element         )       => ({
  play: () => element.classList.remove('is-offscreen'),
  pause: () => element.classList.add('is-offscreen'),
})

/**
 * The /mcp page's endless loops, as on the docs home page (apps/docs loops.ts). Whatever creates a loop adds it here
 * with the element that shows it, and the loop runs only while that element is on screen and the page hasn't paused
 * them all. A hidden element (display: none) is never on screen, so its loops stay held. The margin takes in the few px
 * the frame glitch draws past its lines. When the page's signal aborts, every loop ends, and a loop added after that
 * ends at once.
 */
export class Loops {
           #byElement = new Map                    ()
           #onScreen = new WeakMap                  ()
           #observer = new IntersectionObserver((entries) => this.#update(entries), { rootMargin: '24px' })
           #signal             
  #paused = false

  constructor(signal             ) {
    this.#signal = signal
    signal.addEventListener('abort', () => this.#endAll(), { once: true })
  }

  /** Runs `loop` only while `element` is on screen, and returns it. */
  add                (element         , loop   )    {
    if (this.#signal.aborted) {
      end(loop)
      return loop
    }
    let loops = this.#byElement.get(element)
    if (!loops) {
      loops = new Set()
      this.#byElement.set(element, loops)
      this.#observer.observe(element)
    }
    loops.add(loop)
    if (this.#onScreen.get(element) === false || this.#paused) loop.pause()
    return loop
  }

  /** Stops managing `loop`. Code that cancels a loop removes it first, or the registry would play it again. */
  remove(loop      )       {
    for (const loops of this.#byElement.values()) loops.delete(loop)
  }

  /** Holds every loop, on screen or not, until resume(). */
  pause()       {
    this.#setPaused(true)
  }

  /** Lets loops run again while their elements are on screen. */
  resume()       {
    this.#setPaused(false)
  }

  #setPaused(paused         ) {
    if (this.#paused === paused) return
    this.#paused = paused
    for (const element of this.#byElement.keys()) this.#sync(element)
  }

  #endAll() {
    this.#observer.disconnect()
    for (const loops of this.#byElement.values()) for (const loop of loops) end(loop)
    this.#byElement.clear()
  }

  #update(entries                                  ) {
    for (const { target, isIntersecting } of entries) {
      this.#onScreen.set(target, isIntersecting)
      this.#sync(target)
    }
  }

  #sync(element         ) {
    const run = this.#onScreen.get(element) === true && !this.#paused
    for (const loop of this.#byElement.get(element) ?? []) {
      if (run) loop.play()
      else loop.pause()
    }
  }
}
