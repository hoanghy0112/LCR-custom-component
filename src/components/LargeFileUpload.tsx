import React, { useState } from 'react'

const UPLOAD_URL = 'https://uploadfile-deigzpgzma-uc.a.run.app/upload'
// const UPLOAD_URL = 'https://netpartnerservices.retool.com/url/test'

export default function LargeFileUploadComponent() {
  const [file, setFile] = useState<File>()

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first!')
      return
    }

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
