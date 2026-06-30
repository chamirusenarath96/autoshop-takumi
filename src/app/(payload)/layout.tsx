import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import type { ServerFunctionClient, ServerFunctionClientArgs } from 'payload'
import config from '@payload-config'
import { importMap } from './importMap'
// Supplies Payload's own root CSS theme variables, which fail to compile into
// the build in this project for reasons not yet fully root-caused.
// See payload-theme-vars.css for full investigation notes. This file is
// Payload-admin-only — never imported by the public site (src/app/globals.css
// + src/app/(public)/[locale]/layout.tsx are the completely separate,
// public-site-only styling system).
import './payload-theme-vars.css'
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
