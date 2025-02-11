import React, { useEffect, useState } from 'react'

import './input.css'
import './output.css'

import html2pdf from 'html2pdf.js'

import { Retool } from '@tryretool/custom-component-support'

export const PdfConverter = () => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [data] = Retool.useStateObject({
    name: 'data',
    label: 'Data',
    initialValue: {}
  })
  const [fileName, _setFileName] = Retool.useStateString({
    name: 'fileName',
    label: 'File Name',
    initialValue: 'pdfdocument'
  })

  const [isDisabled, _setIsDisabled] = Retool.useStateBoolean({
    name: 'isDisabled',
    label: 'Disabled',
    initialValue: false
  })

  useEffect(() => {
    // Add page break styles
    const pageBreakStyles = `
      .page-wrapper {
        margin-bottom: 20mm;
        page-break-inside: avoid;
        page-break-after: auto;
      }

      /* Prevent unwanted breaks */
      h1, h2, h3, h4, h5, h6, img, table {
        page-break-inside: avoid;
        page-break-after: auto;
      }

      /* Force page breaks before specific elements if needed */
      .page-break-before {
        page-break-before: always;
      }

      /* Prevent orphans and widows */
      p {
        orphans: 3;
        widows: 3;
      }

      /* Keep related elements together */
      .keep-together {
        page-break-inside: avoid;
      }
    `

    const styleElement = document.createElement('style')
    styleElement.innerHTML = pageBreakStyles
    document.head.appendChild(styleElement)

    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  const generatePdf = async () => {
    try {
      if (isGenerating || isDisabled) return

      setIsGenerating(true)

      // Create a container with page break handling
      const container = document.createElement('div')
      container.className = 'pdf-container'

      // Process HTML content to wrap sections in page-wrapper
      const processedHtml = processHtmlContent('<p>Hello world</p>')
      container.innerHTML = processedHtml

      // Add the combined CSS
      const styleElement = document.createElement('style')
      styleElement.textContent = `
      /* Additional print-specific styles */

      `

      container.prepend(styleElement)

      const options = {
        margin: [2, 2, 0, 2],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          logging: false,
          useCORS: true
        },
        jsPDF: {
          unit: 'mm',
          format: 'A4',
          orientation: 'portrait',
          compress: true
        },
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy'],
          before: '.page-break-before',
          avoid: '.keep-together'
        }
      }

      await html2pdf().from(container).set(options).save()

      // Generate the PDF and output it as a Base64 string
      // const pdfBase64 = await html2pdf()
      //   .from(container)
      //   .set(options)
      //   .output('datauristring')

      // Remove the prefix (data:application/pdf;base64,) if needed
      // const base64String = pdfBase64.split(',')[1]

      // setBase64Data(base64String)
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  // Helper function to process HTML content and add page wrappers
  const processHtmlContent = (html: string) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    // Find natural breaking points (headers, sections, etc.)
    const sections = doc.body.children
    let currentWrapper = document.createElement('div')
    currentWrapper.className = 'page-wrapper'

    const processedContent = document.createElement('div')

    Array.from(sections).forEach((section: Element) => {
      // Start a new wrapper for headers or large sections
      if (
        section.tagName.match(/^H[1-6]$/) ||
        section.classList.contains('section') ||
        section.tagName === 'TABLE'
      ) {
        if (currentWrapper.children.length > 0) {
          processedContent.appendChild(currentWrapper)
          currentWrapper = document.createElement('div')
          currentWrapper.className = 'page-wrapper'
        }
      }

      currentWrapper.appendChild(section.cloneNode(true))
    })

    if (currentWrapper.children.length > 0) {
      processedContent.appendChild(currentWrapper)
    }

    return processedContent.innerHTML
  }

  return (
    <button
      className={` ${isDisabled || isGenerating ? 'export-btn-disabled' : 'export-btn'} w-full text-[12px] text-[#fff] font-bold h-[32px] rounded-[5px] ${isDisabled || isGenerating ? 'bg-[#58b63b] cursor-not-allowed' : 'bg-[#174773] hover:bg-blue-950 '}  overflow-hidden`}
      onClick={generatePdf}
      disabled={isGenerating || isDisabled}
    >
      Export
    </button>
  )
}
