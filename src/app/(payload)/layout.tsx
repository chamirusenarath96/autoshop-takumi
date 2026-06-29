import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import type { ServerFunctionClient, ServerFunctionClientArgs } from 'payload'
import config from '@payload-config'
import { importMap } from './importMap'
import React from 'react'

type Args = {
  children: React.ReactNode
}

const Layout = async ({ children }: Args) => {
  const serverFunction: ServerFunctionClient = async (args: ServerFunctionClientArgs) => {
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
