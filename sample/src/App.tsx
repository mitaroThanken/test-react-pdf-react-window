import { useCallback, useState } from 'react'
import { pdfjs, Document, Page } from 'react-pdf/dist/esm/entry.vite';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import './App.css'

function App() {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>();

  const onDocumentLoadSuccess = useCallback((pdfDocument: pdfjs.PDFDocumentProxy) => {
    setNumPages(pdfDocument.numPages);
    setPageNumber(1);
  }, []);

  return (
    <div className="App">
      <Document file="r3_all.pdf"
        options={{
          cMapUrl: '/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: '/standard_fonts/'
        }}
        onLoadSuccess={onDocumentLoadSuccess}>
        {pageNumber !== undefined ? <Page pageNumber={pageNumber} /> : <></>}
      </Document>
      <p>
        Page {pageNumber} of {numPages}
      </p>
    </div>
  )
}

export default App
