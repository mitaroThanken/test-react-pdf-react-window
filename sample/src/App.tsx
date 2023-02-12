import { asyncMap } from '@wojtekmaj/async-array-utils';
import { useCallback, useEffect, useRef, useState } from 'react'
import { pdfjs, Document, Page } from 'react-pdf/dist/esm/entry.vite';
import { VariableSizeList } from 'react-window';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import './App.css'
import { LoadingProcessData } from 'react-pdf';

const width = 500;
const height = width * 1.5;

interface RowProps {
  index: number,
  style: React.CSSProperties
}
const Row = (props: RowProps) => {
  const onPageRenderSuccess = (page: pdfjs.PDFPageProxy) => {
    console.info(`Page ${page.pageNumber} rendered.`);
  };

  return (
    <div style={props.style}>
      <Page
        onRenderSuccess={onPageRenderSuccess}
        pageIndex={props.index}
        width={width}
      />
    </div>
  );
};

function App() {
  const [pdf, setPdf] = useState<pdfjs.PDFDocumentProxy>();
  const [pageViewports, setPageViewports] = useState<pdfjs.PageViewport[]>();

  const updating = useRef(false);
  useEffect(() => {
    if (!pdf) return;
    if (updating.current) return;
    updating.current = true;
    setPageViewports(undefined);

    (async () => {
      const pageNumbers = Array.from(new Array(pdf.numPages)).map(
        (_, index) => index + 1
      );

      const nextPageViewports = await asyncMap(pageNumbers, async pageNumber => {
        const page = await pdf.getPage(pageNumber);
        return page.getViewport({ scale: 1 });
      });

      setPageViewports(nextPageViewports);
      updating.current = false;
    })();
  }, [pdf]);

  const onDocumentLoadSuccess = useCallback((nextPdf: pdfjs.PDFDocumentProxy) => {
    setPdf(nextPdf);
  }, []);

  const getPageHeight = useCallback((pageIndex: number) => {
    if (!pageViewports) {
      throw new Error("getPageHeight() called too early");
    }

    const pageViewport = pageViewports[pageIndex];
    const scale = width / pageViewport.width;
    const actualHeight = pageViewport.height * scale;

    return actualHeight;
  }, [pageViewports]);

  const onDocumentLoadProgress = ({ loaded, total }: LoadingProcessData) => {
    const tot = Math.round((loaded / total) * 100);
    console.info({ tot });
  }

  return (
    <div className="App">
      <Document file="r3_all.pdf"
        options={{
          cMapUrl: '/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: '/standard_fonts/'
        }}
        onLoadProgress={onDocumentLoadProgress}
        onLoadSuccess={onDocumentLoadSuccess}>
        {pdf && pageViewports
          ? (
            <VariableSizeList
              width={width}
              height={height}
              itemCount={pdf.numPages}
              itemSize={getPageHeight}>
              {Row}
            </VariableSizeList>
          )
          : <></>}
      </Document>
    </div>
  );
}

export default App
