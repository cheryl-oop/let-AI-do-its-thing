import { FRUITS, GIFTS } from '../game/data'
import { useGame } from '../store/useGame'
import { PixelIcon } from './PixelIcon'

function ItemCard({
  id,
  name,
  icon,
  cost,
  mood,
  gift,
  points,
  alive,
  onCare,
}: {
  id: string
  name: string
  icon: Parameters<typeof PixelIcon>[0]['kind']
  cost: number
  mood: number
  gift?: boolean
  points: number
  alive: boolean
  onCare: (id: string) => void
}) {
  const affordable = points >= cost && alive

  return (
    <button
      type="button"
      className={`item-card ${gift ? 'gift' : 'fruit'}`}
      disabled={!affordable}
      onClick={() => onCare(id)}
      title={affordable ? `${name} · mood +${mood}` : `Costs ${cost} FP`}
    >
      <PixelIcon kind={icon} size={34} />
      <span className="item-name">{name}</span>
      <span className="item-mood">+{mood} mood</span>
      <span className="item-cost">{cost} FP</span>
    </button>
  )
}

export function CarePanel({ onCare }: { onCare: (id: string) => void }) {
  const points = useGame((state) => state.pet.points)
  const alive = useGame((state) => state.pet.alive)

  return (
    <div className="care">
      <p className="hint">
        Spend focus points. Every fruit or gift resets the neglect timer — a fed Tomodoro
        stays happy.
      </p>

      <h3 className="section-title">FRUITS</h3>
      <div className="shop-grid">
        {FRUITS.map((item) => (
          <ItemCard
            key={item.id}
            id={item.id}
            name={item.name}
            icon={item.icon}
            cost={item.cost}
            mood={item.mood}
            points={points}
            alive={alive}
            onCare={onCare}
          />
        ))}
      </div>

      <h3 className="section-title">GIFTS</h3>
      <div className="shop-grid">
        {GIFTS.map((item) => (
          <ItemCard
            key={item.id}
            id={item.id}
            name={item.name}
            icon={item.icon}
            cost={item.cost}
            mood={item.mood}
            gift
            points={points}
            alive={alive}
            onCare={onCare}
          />
        ))}
      </div>
    </div>
  )
}
