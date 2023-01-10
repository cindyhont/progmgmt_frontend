import Document, { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script'

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <Script
            strategy='beforeInteractive'
            id='theme-beforeInteractive'
            // src={`${process.env.NEXT_PUBLIC_CDN_URL || ''}/before-interactive.min.js`}
            dangerouslySetInnerHTML={{__html:'const userMode=sessionStorage.getItem("userMode"),htmlTag=document.getElementsByTagName("html")[0];if(userMode&&["light","dark"].includes(userMode))htmlTag.style.backgroundColor="dark"===userMode?"black":"white";else{const e=sessionStorage.getItem("systemDark");htmlTag.style.backgroundColor=e?"true"===e?"black":"white":window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"black":"white"}htmlTag.style.setProperty("--viewport-height","visualViewport"in window?window.visualViewport.height+"px":"100vh");'}}
          />
          <Script id='google-chart-loader' src="https://www.gstatic.com/charts/loader.js" strategy="beforeInteractive" async defer />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
