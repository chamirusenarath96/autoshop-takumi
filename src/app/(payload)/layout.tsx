import { RootLayout } from '@payloadcms/next/layouts'
import { handleServerFunctions } from '@payloadcms/next/layouts'
import config from '@payload-config'
import { importMap } from './importMap'
import React from 'react'

type Args = {
  children: React.ReactNode
}

const Layout = async ({ children }: Args) => {
  const serverFunction = async (args: Parameters<typeof handleServerFunctions>[0]) => {
    'use server'
    return handleServerFunctions({ ...args, config, importMap })
  }

  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  )
}

export default Layout
