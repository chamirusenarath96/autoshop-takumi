type Props = {
  index: number
  title: string
  description?: string | null
}

export function StepItem({ index, title, description }: Props) {
  return (
    <div className="flex flex-col items-start gap-2">
      <span className="takumi-display text-4xl text-primary">{String(index).padStart(2, '0')}</span>
      <h3 className="font-semibold">{title}</h3>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  )
}
