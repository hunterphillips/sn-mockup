import type { Plugin } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Vite plugin that provides a dev server API for persisting mock data to JSON files.
 * Only active during development.
 */
export function mockApiPlugin(): Plugin {
  const tablesDir = path.resolve(__dirname, '../src/data/tables')

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
          const filePath = path.join(tablesDir, `${tableName}.json`)

          // Check if table file exists
          if (!fs.existsSync(filePath)) {
            res.statusCode = 404
            res.end(JSON.stringify({ error: `Table file not found: ${tableName}.json` }))
            return
          }

          // Read existing table definition
          const tableContent = fs.readFileSync(filePath, 'utf-8')
          const tableDef = JSON.parse(tableContent)

          // Update only the data array
          tableDef.data = data

          // Write back to file with pretty formatting
          fs.writeFileSync(filePath, JSON.stringify(tableDef, null, 2) + '\n')

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
