type Props = {
  name: string
  role?: string | null
  years?: string | null
  specialty?: string | null
  photo?: any
}

export function TeamMemberCard({ name, role, years, specialty, photo }: Props) {
  const photoUrl = typeof photo === 'object' ? photo?.sizes?.card?.url ?? photo?.url : null

  return (
    <div>
      <div className="aspect-square rounded-lg overflow-hidden bg-muted">
        {photoUrl && <img src={photoUrl} alt={name} className="w-full h-full object-cover" />}
      </div>
      <h3 className="font-semibold mt-3">{name}</h3>
      {role && <p className="text-sm text-muted-foreground">{role}{years ? ` · ${years}` : ''}</p>}
      {specialty && <p className="text-xs text-primary mt-1">{specialty}</p>}
    </div>
  )
}
