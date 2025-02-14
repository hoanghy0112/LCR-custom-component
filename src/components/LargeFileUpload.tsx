/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from 'react'

const UPLOAD_URL = 'https://uploadfile-v2-deigzpgzma-uc.a.run.app/save-to-db'
const GET_SIGNED_URL =
  'https://uploadfile-v2-deigzpgzma-uc.a.run.app/get-signed-url'
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
    const headers = headerRow
      .split(',')
      .map((h) => h.trim().replaceAll('"', ''))

    // Parse data rows
    const data = lines.map((line) => {
      const values = line.split(',').map((v) => v.trim())
      return Object.fromEntries(
        headers
          .filter((h) => h)
          .map((h, i) => [h.replaceAll('"', ''), values[i].replaceAll('"', '')])
      )
    })

    console.log({ data })
    return {
      headers,
      data,
      totalRows: (await countCsvRowsStream(file)) - 1
    }
  } finally {
    reader.releaseLock()
  }
}

async function countCsvRowsStream(file) {
  let rowCount = 0
  let remainder = ''
  const decoder = new TextDecoder()
  const stream = file.stream()
  const reader = stream.getReader()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    // Decode chunk and add any remainder from previous chunk
    const chunk = remainder + decoder.decode(value, { stream: true })
    const lines = chunk.split(/\r\n|\r|\n/)
    // Save the last line in case it's incomplete
    remainder = lines.pop()
    rowCount += lines.length
  }

  // If there's any remainder left, count it as a row
  if (remainder.length > 0) {
    rowCount++
  }

  return rowCount
}

function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${sizes[i]}`
}

export default function LargeFileUploadComponent({
  setData,
  dbUploadingFiles,
  setFileName,
  fileName,
  uploadedFileName,
  onSubmit,
  onFileStatusChanged,
  uploadingFiles,
  setUploadingFiles,
  uploadData
}: {
  fileName: string
  dbUploadingFiles: any
  setData: any
  setFileName: any
  uploadedFileName: string
  onSubmit: any
  onFileStatusChanged: any
  uploadingFiles: any[]
  setUploadingFiles: any
  uploadData: any
}) {
  const [file, setFile] = useState<File>()
  const [isUploading, setIsUploading] = useState(false)
  const [_uploadingFiles, _setUploadingFiles] = useState<any>([])

  const inputRef = useRef<HTMLInputElement>(null)

  const isDisabled = !file;
  // const isDisabled = isUploading || dbUploadingFiles.length >= 2

  useEffect(() => {
    setUploadingFiles(_uploadingFiles)
    onFileStatusChanged()
  }, [_uploadingFiles])

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first!')
      return
    }
    if (!uploadData.clientId) {
      alert('Please select a client first!')
      return
    }
    setIsUploading(true)

    const response = await fetch(`${GET_SIGNED_URL}?fileName=${file.name}`)
    const { url, fileName } = await response.json()

    const uploadedFile = new File([file], fileName, {
      type: file.type,
      lastModified: file.lastModified
    })
    const originalFileName = file.name

    const currentFileName = uploadedFileName
    const timestamp = new Date()

    onSubmit()
    setData({})
    setFileName('')
    if (inputRef.current) inputRef.current.value = ''

    _setUploadingFiles((prev: any) => [
      ...prev.filter((d: any) => d.fileName !== currentFileName),
      {
        fileName: currentFileName,
        originalFileName,
        timestamp,
        status: 'uploading'
      }
    ])
    setIsUploading(false)

    const uploadResponse = await fetch(url, {
      method: 'PUT',
      body: uploadedFile,
      headers: { 'Content-Type': 'application/octet-stream' }
    })

    _setUploadingFiles((prev: any) => [
      ...prev.filter((d: any) => d.fileName !== currentFileName),
      {
        fileName: currentFileName,
        originalFileName,
        timestamp,
        status: uploadResponse.ok ? 'finished' : 'upload-error'
      }
    ])

    const savingToDbResponse = await fetch(UPLOAD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...uploadData,
        fileName,
        clientFileName: uploadedFileName
      })
    })

    _setUploadingFiles((prev: any) => [
      ...prev.filter((d: any) => d.fileName !== currentFileName),
      {
        fileName: currentFileName,
        originalFileName,
        timestamp,
        status: savingToDbResponse.ok ? 'saved' : 'saving-error'
      }
    ])

    onFileStatusChanged()
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        className=" flex flex-col items-center upload-wrapper"
      >
        <div className=" w-[30px] h-[30px]">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path
              d="M384 80H128c-26 0-43 14-48 40L48 272v112a48.14 48.14 0 0048 48h320a48.14 48.14 0 0048-48V272l-32-152c-5-27-23-40-48-40z"
              fill="none"
              stroke="currentColor"
              strokeLinejoin="round"
              strokeWidth="32"
            />
            <path
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="32"
              d="M48 272h144M320 272h144M192 272a64 64 0 00128 0M144 144h224M128 208h256"
            />
          </svg>
        </div>
        <p className=" upload-text">
          {fileName || 'Select .csv file to upload'}
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        className=" hidden"
        onChange={async (e) => {
          setFile(e.target.files?.[0])
          setData(await readCSVPreview(e.target.files?.[0], 50))
          setFileName(e.target.files?.[0].name)
        }}
        accept=".csv"
      />
      <button
        onClick={handleUpload}
        className={`upload-btn ${isDisabled ? 'btn-disabled' : ''}`}
        disabled={isDisabled}
      >
        <div className=" w-[20px] h-[20px]">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path
              d="M320 367.79h76c55 0 100-29.21 100-83.6s-53-81.47-96-83.6c-8.89-85.06-71-136.8-144-136.8-69 0-113.44 45.79-128 91.2-60 5.7-112 43.88-112 106.4s54 106.4 120 106.4h56"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="32"
            />
            <path
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="32"
              d="M320 255.79l-64-64-64 64M256 448.21V207.79"
            />
          </svg>
        </div>
        <span>Upload to the database</span>
      </button>
    </div>
  )
}
