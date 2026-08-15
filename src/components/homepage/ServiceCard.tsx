import * as icons from 'lucide-react'
import { Wrench } from 'lucide-react'
import { Card } from '@/components/ui/card'

type Props = {
  icon?: string | null
  name: string
  description?: string | null
  priceFrom?: string | null
}

export function ServiceCard({ icon, name, description, priceFrom }: Props) {
  const Icon = (icon && (icons as unknown as Record<string, icons.LucideIcon>)[icon]) || Wrench

  return (
    <Card className="p-5 gap-2">
      <Icon className="text-primary" size={28} strokeWidth={1.75} />
      <h3 className="font-semibold mt-2">{name}</h3>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {priceFrom && <p className="text-sm font-medium text-primary mt-1">{priceFrom}</p>}
    </Card>
  )
}
