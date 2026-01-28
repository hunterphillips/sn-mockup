import type { Plugin } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Vite plugin that provides a dev server API for persisting mock data to JSON files.
 * Only active during development.
 *
 * Record data is stored separately from table definitions in recordData/ directory.
 */
export function mockApiPlugin(): Plugin {
  const recordDataDir = path.resolve(__dirname, '../src/data/recordData')

  return {
    name: 'mock-api',
    configureServer(server) {
      // Save table data endpoint
      server.middlewares.use('/api/tables', async (req, res, next) => {
        // Only handle POST requests
        if (req.method !== 'POST') {
          return next()
        }

        // Parse URL to get table name: /api/tables/incident
        const urlParts = req.url?.split('/').filter(Boolean) || []
        const tableName = urlParts[0]

        if (!tableName) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: 'Table name required' }))
          return
        }

        // Read request body
        let body = ''
        for await (const chunk of req) {
          body += chunk
        }

        try {
          const { data } = JSON.parse(body)

          // Ensure recordData directory exists
          if (!fs.existsSync(recordDataDir)) {
            fs.mkdirSync(recordDataDir, { recursive: true })
          }

          const filePath = path.join(recordDataDir, `${tableName}.json`)

          // Write just the records array (not wrapped in TableDefinition)
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n')

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: true, recordCount: data.length }))
        } catch (error) {
          console.error('Failed to save table data:', error)
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Failed to save table data' }))
        }
      })
    },
  }
}
