import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import type { ServerFunctionClient, ServerFunctionClientArgs } from 'payload'
import config from '@payload-config'
import { importMap } from './importMap'
// Payload's own complete, prebuilt admin stylesheet — official export, see
// CLAUDE.md "Styling architecture" for why this is needed instead of relying
// on RootLayout's internal `@payloadcms/ui/scss/app.scss` import (that SCSS
// fails to compile correctly in this project's webpack pipeline; this
// prebuilt CSS sidesteps the problem entirely). Admin-only — never imported
// by the public site.
import '@payloadcms/next/css'
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
