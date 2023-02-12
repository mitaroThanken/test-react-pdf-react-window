import { asyncMap } from '@wojtekmaj/async-array-utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { pdfjs, Document, Page } from 'react-pdf/dist/esm/entry.vite';
import { VariableSizeList } from 'react-window';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import './App.css'
import { LoadingProcessData } from 'react-pdf';

/** スクロールバーを含む幅 */
const width = 500;
const height = width * 1.5;
const border = 1;

interface RowProps {
  index: number,
  style: React.CSSProperties
}
const Row = (width: number) => (props: RowProps) => {
  const onPageRenderSuccess = (page: pdfjs.PDFPageProxy) => {
    console.info(`Page ${page.pageNumber} rendered.`);
  };

  return (
    <div style={{
      ...props.style,
      borderBottom: `solid ${border}px`
    }}>
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

  // スクロールバーの幅・高さを捉える
  // cf. https://stackoverflow.com/a/3417992
  const [scrollBarSize, setScrollBarSize] = useState<number[]>();
  useEffect(() => {
    const inner = document.createElement('p');
    inner.style.width = "100%";
    inner.style.height = "100%";

    const outer = document.createElement('div');
    outer.style.position = "absolute";
    outer.style.top = "0px";
    outer.style.left = "0px";
    outer.style.visibility = "hidden";
    outer.style.width = "100px";
    outer.style.height = "100px";
    outer.style.overflow = "hidden";
    outer.appendChild(inner);

    document.body.appendChild(outer);

    const w1 = inner.offsetWidth;
    const h1 = inner.offsetHeight;
    outer.style.overflow = 'scroll';
    let w2 = inner.offsetWidth;
    let h2 = inner.offsetHeight;
    if (w1 == w2) w2 = outer.clientWidth;
    if (h1 == h2) h2 = outer.clientHeight;

    document.body.removeChild(outer);

    setScrollBarSize([(w1 - w2), (h1 - h2)]);
  }, []);

  /** スクロールバーを除いた、表示に使用できる幅 */
  const effectiveWidth = useMemo(() => !scrollBarSize ? width : width - scrollBarSize[0], [scrollBarSize]);

  const getPageHeight = useCallback((pageIndex: number) => {
    if (!pageViewports) {
      throw new Error("getPageHeight() called too early");
    }

    const pageViewport = pageViewports[pageIndex];
    const scale = effectiveWidth / pageViewport.width;
    const actualHeight = pageViewport.height * scale;

    return Math.floor(actualHeight) + border;
  }, [pageViewports, effectiveWidth]);

  const onDocumentLoadProgress = ({ loaded, total }: LoadingProcessData) => {
    const tot = Math.round((loaded / total) * 100);
    console.info({ tot });
  }

  const [estimatedItemSize, setEstimatedItemSize] = useState(height);
  useEffect(() => {
    if (!pageViewports) return;
    setEstimatedItemSize(getPageHeight(0));
  }, [pageViewports, getPageHeight])

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
              itemSize={getPageHeight}
              estimatedItemSize={estimatedItemSize}>
              {Row(effectiveWidth)}
            </VariableSizeList>
          )
          : <></>}
      </Document>
    </div>
  );
}

export default App
