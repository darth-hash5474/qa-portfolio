import { a11yLabel } from '../lib/bugs'

// Procedural cover art: no image files needed, and deterministic for screenshots.
export default function Cover({ game, size = 'md', scene }) {
  const h = (game.hue + (scene ? scene * 35 : 0)) % 360
  const style = {
    background: `radial-gradient(circle at 70% 20%, hsl(${(h + 50) % 360} 85% 55% / .55), transparent 55%), linear-gradient(135deg, hsl(${h} 70% 34%), hsl(${(h + 40) % 360} 75% 14%))`,
  }
  return (
    <div
      className={`cover cover-${size}`}
      style={style}
      role="img"
      {...a11yLabel(scene ? `${game.title} screenshot ${scene}` : `${game.title} cover art`)}
      data-testid="cover"
    >
      <span className="cover-emoji" aria-hidden="true">
        {game.emoji}
      </span>
      {size !== 'xs' && !scene && (
        <span className="cover-title" aria-hidden="true">
          {game.title}
        </span>
      )}
    </div>
  )
}
