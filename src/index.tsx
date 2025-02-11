import React, { useEffect, useState } from 'react'

import './input.css'
import './output.css'

import html2pdf from 'html2pdf.js'

import { Retool } from '@tryretool/custom-component-support'
import LargeFileUploadComponent from './components/LargeFileUpload'

export const LargeFileUpload = () => {
  return <LargeFileUploadComponent />
}

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
      const processedHtml = processHtmlContent(`  <div class="container">
        <h1>Invoice</h1>
        <div class=" row-info">
            <p class="invoice-number">Invoice number</p>
            <p class="invoice-number">${data.invoiceId}</p>
            <p class="date-info">Issue date</p>
            <p class="date-info">${data.issueDate}</p>
            <p class="date-info">Invoice date</p>
            <p class="date-info">${data.invoiceDate}</p>
        </div>
        <div class=" block-info">
            <div>
                <p class=" block-info-title">Client</p>
                <p class=" block-info-description">${data.clientName}</p>
                <p class=" block-info-description">${data.ip}</p>
            </div>
            <div>
                <p class=" block-info-title">Bill to</p>
                <p class=" block-info-description">${data.customerName}</p>
                <p class=" block-info-description">${data.address}</p>
                ${data.phone ? `<p class=" block-info-description">${data.phone}</p>` : ''}
                ${data.email ? `<p class=" block-info-description">${data.email}</p>` : ''}
            </div>
        </div>
        <p class="price-info">${data.priceInfo}</p>
        <table class="product-table">
            <thead>
                <th class="description">Item</th>
                <th class="price">Price</th>
                <th class="collection-fee">Collection fee</th>
                <th class="chargeback-fee">Chargeback fee</th>
                <th class="amount">Total</th>
            </thead>
            <tbody>
                <tr>
                    <td class="description">${data.serviceOffer}</td>
                    <td class="price">${data.price}</td>
                    <td class="collection-fee">${data.collectionFee}</td>
                    <td class="chargeback-fee">${data.chargebackFee}</td>
                    <td class="amount">${data.total}</td>
                </tr>
            </tbody>
        </table>
        <div class="summary">
            <div class="summary-row">
                <p>Subtotal</p>
                <p>${data.total}</p>
            </div>
            <div class="summary-row">
                <p>Total</p>
                <p>${data.total}</p>
            </div>
            <div class="summary-row amount-due">
                <p>Amount due</p>
                <p>${data.total}</p>
            </div>
        </div>
        ${
          data.productTerm
            ? `
          <div class="notes">
              <p>Product Terms and Conditions</p>
              <p>${data.productTerm}</p>
          </div>`
            : ''
        }
        ${
          data.additionalNotes
            ? `
          <div class="notes">
              <p>Additional notes</p>
              <p>${data.additionalNotes}</p>
          </div>`
            : ''
        }
    </div>`)
      container.innerHTML = processedHtml

      // Add the combined CSS
      const styleElement = document.createElement('style')
      styleElement.textContent = `
      /* Additional print-specific styles */
      @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');
        * {
            padding: 0;
            margin: 0;
            font-family: 'Inter';
            box-sizing: border-box;
            color: #444;
            font-size: 14px;
        }

        .container {
            padding: 50px;
            padding-top: 30px !important;
            padding-bottom: 0 !important;
        }

        h1 {
            color: #222;
            font-size: 28px;
        }

        .row-info {
            margin-top: 30px;
            width: auto;
            font-size: 14px;
            display: grid;
            grid-template-columns: 150px 200px;
            grid-template-rows: repeat(3, 1fr);
            row-gap: 3px;
        }

        .invoice-number {
            color: #333;
            font-weight: 600;
        }

        .date-info {
            color: #333;
        }

        .block-info {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
            padding-right: 50px;
        }

        .block-info>div {
            width: 200px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .block-info>div:nth-child(1) {
            width: 260px;
        }

        .block-info-title {
            font-weight: 600;
        }

        .block-info-description {
            color: #555;
        }

        .price-info {
            margin-top: 30px;
            font-weight: 600;
            font-size: 22px;
            color: #333;
        }

        .pay-online {
            display: block;
            margin-top: 10px;
        }

        .product-table {
            margin-top: 30px;
            width: 100%;
        }

        .product-table th {
            color: #666 !important;
            font-weight: 400;
            border-bottom: 2px solid #333;
            font-size: 12px;
        }

        .product-table th,
        td {
            padding: 6px 0;
        }

        .product-table tr {
            display: flex;
        }

        .description {
            text-align: left;
            flex: 1 1 0%;
        }

        .price {
            width: 110px;
            text-align: left;
            padding-right: 20px !important;
        }

        .collection-fee {
            width: 120px;
            text-align: left;
        }

        .chargeback-fee {
            width: 100px;
            text-align: left;
        }

        .amount {
            width: 100px;
            text-align: right;
        }

        .summary {
            margin-top: 20px;
            margin-left: auto;
            width: 400px;
        }

        .summary-row {
            border-top: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
        }

        .amount-due {
            color: #333;
            font-weight: 600;
        }

        .notes {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 30px;
        }

        .notes>p:nth-child(1) {
            font-weight: 600;
        }

        .notes>p:nth-child(2) {
            line-height: 20px;
        }
      `

      container.prepend(styleElement)

      const options = {
        margin: [0, 0, 2, 0],
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
