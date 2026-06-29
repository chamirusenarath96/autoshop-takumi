import NextLink from 'next/link'
import { ComponentProps } from 'react'

export function Link({ href, children, className, ...props }: ComponentProps<typeof NextLink>) {
  return (
    <NextLink href={href} className={className} {...props}>
      {children}
    </NextLink>
  )
}
