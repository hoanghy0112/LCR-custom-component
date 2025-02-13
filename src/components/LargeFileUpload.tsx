/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react'

const UPLOAD_URL = 'https://uploadfile-deigzpgzma-uc.a.run.app/upload'
const GET_SIGNED_URL =
  'https://uploadfile-deigzpgzma-uc.a.run.app/get-signed-url'
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
      return Object.fromEntries(headers.filter(h => h).map((h, i) => [h.replaceAll('"', ''), values[i]]))
    })

    console.log({ data })
    return {
      headers,
      data,
      totalRows: data.length
    }
  } finally {
    reader.releaseLock()
  }
}

function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${sizes[i]}`
}

export default function LargeFileUploadComponent({
  setData
}: {
  setData: any
}) {
  const [file, setFile] = useState<File>()
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first!')
      return
    }
    setIsUploading(true)

    const response = await fetch(`${GET_SIGNED_URL}?fileName=${file.name}`)
    const { url } = await response.json()

    const uploadResponse = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': 'application/octet-stream' }
    })

    if (uploadResponse.ok) {
      console.log('Upload successful!')
    } else {
      console.error('Upload failed')
    }

    setIsUploading(false)
  }

  return (
    <div>
      <input
        type="file"
        onChange={async (e) => {
          setFile(e.target.files?.[0])
          setData(await readCSVPreview(e.target.files?.[0], 50))
        }}
      />
      <button onClick={handleUpload}>Upload</button>

      {isUploading ? <p>Uploading...</p> : null}
    </div>
  )
}
