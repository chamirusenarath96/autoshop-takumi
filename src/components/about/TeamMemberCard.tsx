import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

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
      <Avatar className="aspect-square h-auto w-full rounded-lg">
        <AvatarImage src={photoUrl ?? undefined} alt={name} className="object-cover" />
        <AvatarFallback className="rounded-lg bg-muted" />
      </Avatar>
      <h3 className="font-semibold mt-3">{name}</h3>
      {role && <p className="text-sm text-muted-foreground">{role}{years ? ` · ${years}` : ''}</p>}
      {specialty && <p className="text-xs text-primary mt-1">{specialty}</p>}
    </div>
  )
}
