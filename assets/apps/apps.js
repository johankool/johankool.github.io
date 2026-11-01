(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

  // The ball flies from side to side in high arcs, with its trail a moment behind. A shuttle doesn't spin
  // but flies cork first: in its artwork the cork points 47° below horizontal.
  const flightDuration = 2400
  const trailDelay = 60
  const corkAngle = 47

  const position = (time, width, depth) => {
    const flight = time / flightDuration
    const isReturning = Math.floor(flight) % 2 === 1
    const progress = flight % 1
    const height = 4 * (progress - 0.5) ** 2 // 0 at the top of the arc, 1 at both ends.
    const across = isReturning ? -width : width
    return {
      x: isReturning ? width * (1 - progress) : width * progress,
      y: height * depth,
      angle: Math.atan2(8 * (progress - 0.5) * depth, across) * 180 / Math.PI
    }
  }

  document.querySelectorAll('.rally').forEach((rally) => {
    if (reducedMotion) return
    const copies = [...rally.querySelectorAll('.rally-x')]
    const fly = (time) => {
      const size = copies[0].offsetWidth
      const width = rally.clientWidth - size
      const depth = Math.min(rally.clientHeight - size, 170)
      const isShuttle = rally.hasAttribute('data-shuttle')
      copies.forEach((copy, index) => {
        const { x, y, angle } = position(Math.max(time - index * trailDelay, 0), width, depth)
        copy.style.transform = `translate(${x}px, ${y}px)`
        copy.firstElementChild.style.transform = isShuttle ? `rotate(${angle - corkAngle}deg)` : ''
      })
      requestAnimationFrame(fly)
    }
    requestAnimationFrame(fly)
  })

  // Sections slide in as they scroll into view.
  const revealed = document.querySelectorAll('[data-reveal]')
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      }
    }, { rootMargin: '0px 0px -8% 0px' })
    revealed.forEach((section) => observer.observe(section))
  } else {
    revealed.forEach((section) => section.classList.add('is-visible'))
  }

  // Scores per scoring system: the display of a game, and its winner (0 you, 1 them) if it's over.
  const scoring = {
    rally(points, { to, cap }) {
      const [us, them] = points
      const lead = Math.max(us, them)
      const isOver = (lead >= to && Math.abs(us - them) >= 2) || (cap > 0 && lead >= cap)
      return { display: [us, them], winner: isOver ? (us > them ? 0 : 1) : null }
    },
    tennis(points) {
      const [us, them] = points
      const calls = ['0', '15', '30', '40']
      if (Math.max(us, them) >= 4 && Math.abs(us - them) >= 2) {
        return { display: us > them ? ['Game', calls[Math.min(them, 3)]] : [calls[Math.min(us, 3)], 'Game'], winner: us > them ? 0 : 1 }
      }
      if (us >= 3 && them >= 3) {
        if (us === them) return { display: ['40', '40'], winner: null, call: 'Deuce' }
        return { display: us > them ? ['Ad', '40'] : ['40', 'Ad'], winner: null, call: 'Advantage' }
      }
      return { display: [calls[us], calls[them]], winner: null }
    }
  }

  document.querySelectorAll('[data-demo]').forEach((demo) => {
    demo.hidden = false
    const score = scoring[demo.dataset.scoring]
    const options = { to: Number(demo.dataset.to), cap: Number(demo.dataset.cap) }
    const sides = [...demo.querySelectorAll('[data-side]')]
    const status = demo.querySelector('[data-status]')
    const undo = demo.querySelector('[data-undo]')
    const log = []

    const render = (scored) => {
      const points = [0, 1].map((side) => log.filter((point) => point === side).length)
      const { display, winner, call } = score(points, options)
      sides.forEach((button) => {
        const side = Number(button.dataset.side)
        button.querySelector('[data-score]').textContent = display[side]
        button.disabled = winner !== null
        button.classList.remove('is-scored')
      })
      if (scored !== undefined) {
        const button = sides.find((side) => Number(side.dataset.side) === scored)
        void button.offsetWidth // Restarts the animation.
        button.classList.add('is-scored')
      }
      if (winner !== null) {
        status.textContent = winner === 0 ? 'Game! You win.' : 'Game! They win.'
      } else {
        status.textContent = call || (log.length ? `${log.length} point${log.length === 1 ? '' : 's'} played` : 'Tap a side to score')
      }
      undo.disabled = log.length === 0
      undo.textContent = winner === null ? 'Undo' : 'Play again'
      undo.dataset.finished = winner === null ? '' : 'true'
    }

    sides.forEach((button) => button.addEventListener('click', () => {
      const side = Number(button.dataset.side)
      log.push(side)
      render(side)
    }))
    undo.addEventListener('click', () => {
      if (undo.dataset.finished) {
        log.length = 0
      } else {
        log.pop()
      }
      render()
    })
    render()
  })

  // Screenshots step with buttons too, for those without a trackpad.
  document.querySelectorAll('[data-shots]').forEach((shots) => {
    const nav = shots.parentElement.querySelector('[data-shots-nav]')
    nav.hidden = false
    nav.querySelectorAll('[data-shots-step]').forEach((button) => button.addEventListener('click', () => {
      const distance = shots.querySelector('img').offsetWidth + 18
      shots.scrollBy({ left: distance * Number(button.dataset.shotsStep), behavior: reducedMotion ? 'auto' : 'smooth' })
    }))
  })

  // The overview's hero goes through the sports, or shows the one you point at.
  const hero = document.querySelector('[data-cycle]')
  if (hero) {
    const items = [...document.querySelectorAll('[data-cycle-item]')]
    const name = hero.querySelector('[data-cycle-name]')
    const rally = hero.querySelector('.rally')
    const balls = hero.querySelectorAll('[data-ball]')
    let index = 0

    const show = (item) => {
      index = items.indexOf(item)
      hero.style.setProperty('--accent', item.style.getPropertyValue('--accent'))
      name.textContent = item.dataset.name
      rally.toggleAttribute('data-shuttle', 'shuttle' in item.dataset)
      balls.forEach((ball) => { ball.src = item.dataset.ball })
    }

    let timer
    const start = () => {
      if (reducedMotion) return
      timer = setInterval(() => show(items[(index + 1) % items.length]), 4000)
    }
    items.forEach((item) => {
      item.addEventListener('pointerenter', () => { clearInterval(timer); show(item) })
      item.addEventListener('pointerleave', start)
    })
    start()
  }
})()
