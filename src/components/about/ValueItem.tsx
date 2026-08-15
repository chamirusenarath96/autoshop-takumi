import * as icons from 'lucide-react'
import { ShieldCheck } from 'lucide-react'

type Props = {
  icon?: string | null
  title: string
  description?: string | null
}

export function ValueItem({ icon, title, description }: Props) {
  const Icon = (icon && (icons as unknown as Record<string, icons.LucideIcon>)[icon]) || ShieldCheck

  return (
    <div className="flex flex-col items-start gap-2">
      <Icon className="text-primary" size={26} strokeWidth={1.75} />
      <h3 className="font-semibold">{title}</h3>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  )
}
