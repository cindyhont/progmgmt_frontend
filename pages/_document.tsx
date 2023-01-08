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
            src={`${process.env.NEXT_PUBLIC_CDN_URL || ''}/before-interactive.min.js`}
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
