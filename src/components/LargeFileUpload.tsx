import React, { useState } from 'react'

const UPLOAD_URL = 'https://uploadfile-deigzpgzma-uc.a.run.app/upload'
// const UPLOAD_URL = 'https://netpartnerservices.retool.com/url/test'

// Function to read first N lines of a CSV file
async function readCSVPreview(file, numLines = 100) {
  // Check if file is provided and is a File object
  if (!file || !(file instanceof File)) {
    throw new Error('Please provide a valid file')
  }

  // Create a stream reader for the file
  const reader = file.stream().getReader()
  const decoder = new TextDecoder()
  let lines = []
  let partialLine = ''
  let headerRow = null

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      // Convert the chunk to text and combine with any partial line from previous chunk
      const chunk = decoder.decode(value, { stream: true })
      const combined = partialLine + chunk

      // Split into lines
      const newLines = combined.split('\n')

      // Save the last partial line for next chunk
      partialLine = newLines.pop()

      // Process complete lines
      if (!headerRow) {
        // First line is header
        headerRow = newLines.shift()
        lines.push(...newLines)
      } else {
        lines.push(...newLines)
      }

      // If we have enough lines, stop reading
      if (lines.length >= numLines) {
        lines = lines.slice(0, numLines)
        break
      }
    }

    // Parse header into columns
    const headers = headerRow.split(',').map((h) => h.trim())

    // Parse data rows
    const data = lines.map((line) => {
      const values = line.split(',').map((v) => v.trim())
      return Object.fromEntries(headers.map((h, i) => [h, values[i]]))
    })

    return {
      headers,
      data,
      totalRows: data.length
    }
  } finally {
    reader.releaseLock()
  }
}

export default function LargeFileUploadComponent() {
  const [file, setFile] = useState<File>()

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first!')
      return
    }

    const data = await readCSVPreview(file, 100)
    console.log({ data })

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(UPLOAD_URL, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        alert('File uploaded successfully!')
      } else {
        alert('File upload failed!')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
    }
  }

  return (
    <div>
      <input type="file" onChange={(e) => setFile(e.target.files?.[0])} />
      <button onClick={handleUpload}>Upload</button>
    </div>
  )
}
